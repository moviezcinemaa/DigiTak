"""
Scheduled scraping pipeline.

Runs on a configurable interval (default: 60 minutes) to:
1. Read RSS feeds from financial news sources
2. Check for duplicate URLs in the database
3. Fetch full article text
4. Summarize via LLM (with provider rotation) — Phase 2 extracts
   detailed_summary, category, and tags
5. Store results in the database
"""

import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from app.database import async_session
from app.models import Article
from app.scraper.feed_reader import read_feeds, fetch_article_text
from app.scraper.summarizer import get_summarizer
from app.config import get_settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def run_scrape_cycle():
    """Execute one full scrape-summarize-store cycle."""
    logger.info("Starting scrape cycle...")
    settings = get_settings()
    summarizer = get_summarizer()

    # Determine if it's a cold start
    since_hours = 1
    async with async_session() as db:
        from sqlalchemy import func
        last_article = await db.scalar(select(func.max(Article.created_at)))
        if last_article is None:
            since_hours = 72
            logger.info("Cold start detected: fetching news from the past 72 hours.")
        else:
            logger.info("Fetching news from the last 1 hour.")

    # Step 1: Read feeds
    feed_articles = await read_feeds(since_hours)
    if not feed_articles:
        logger.info("No articles found in feeds.")
        return

    # Phase 3: Cluster similar articles
    import difflib
    clustered_articles = []
    for article in feed_articles:
        found_cluster = False
        for cluster in clustered_articles:
            # 60% similarity in headline groups them
            if difflib.SequenceMatcher(None, article.headline.lower(), cluster.headline.lower()).ratio() > 0.6:
                cluster.additional_sources.append({"url": article.url, "domain": article.source_domain, "headline": article.headline})
                # Append text to give LLM more context
                cluster.text += f"\n\n--- Source: {article.source_domain} ---\n" + article.text
                found_cluster = True
                break
        if not found_cluster:
            clustered_articles.append(article)

    new_count = 0
    skip_count = 0

    async with async_session() as db:
        # Step 1: Cleanup old articles (older than 3 days)
        from sqlalchemy import delete
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=3)
        await db.execute(delete(Article).where(Article.created_at < cutoff))
        await db.commit()

        import asyncio
        semaphore = asyncio.Semaphore(10)
        
        async def prepare_article(article, existing_article=None):
            async with semaphore:
                db_article = existing_article
                text = article.text
                scraped_image = None
                
                if len(text) < 200 or not article.image_url:
                    full_text, scraped_img = await fetch_article_text(article.url)
                    if full_text and len(full_text) > len(text):
                        text = full_text
                    if scraped_img and not article.image_url:
                        scraped_image = scraped_img
                        
                    if len(text) < 200:
                        try:
                            from duckduckgo_search import DDGS
                            def perform_search():
                                with DDGS() as ddgs:
                                    return list(ddgs.news(article.headline, max_results=3))
                            results = await asyncio.to_thread(perform_search)
                            if results:
                                for r in results:
                                    if r.get('url') and r['url'] != article.url:
                                        search_url = r['url']
                                        s_text, _ = await fetch_article_text(search_url)
                                        if s_text and len(s_text) > 100:
                                            text += f"\n\n--- Source: {r.get('source', search_url)} ---\n" + s_text
                                            article.additional_sources.append({
                                                "url": search_url, 
                                                "domain": r.get('source', search_url), 
                                                "headline": r.get('title', article.headline)
                                            })
                        except Exception as e:
                            from app.scraper.feed_reader import logger
                            logger.error(f"DDG Search failed for '{article.headline}': {e}")
                
                final_image_url = article.image_url or scraped_image
                final_image_source = article.source_domain if final_image_url else None
                
                return {
                    "feed_article": article,
                    "db_article": db_article,
                    "text": text,
                    "final_image_url": final_image_url,
                    "final_image_source": final_image_source
                }

        tasks = []
        for article in clustered_articles:
            existing = await db.execute(select(Article).where(Article.original_url == article.url))
            existing_article = existing.scalar_one_or_none()
            if existing_article:
                if existing_article.ai_summary is None:
                    tasks.append(prepare_article(article, existing_article))
                else:
                    skip_count += 1
            else:
                tasks.append(prepare_article(article, None))
                
        prepared_articles = await asyncio.gather(*tasks)

        # Step 4: Batch Summarize in chunks of 5
        batch_size = 5
        for i in range(0, len(prepared_articles), batch_size):
            chunk = prepared_articles[i:i+batch_size]
            
            llm_input = []
            for idx, item in enumerate(chunk):
                llm_input.append({
                    "id": idx,
                    "headline": item["feed_article"].headline,
                    "text": item["text"][:4000]
                })
                
            summaries = await summarizer.summarize_batch(llm_input)
            
            for idx, item in enumerate(chunk):
                summary_res = summaries[idx] if idx < len(summaries) else None
                ai_summary = summary_res.ai_summary if summary_res else None
                market_impact = summary_res.market_impact if summary_res else None
                detailed_summary = summary_res.detailed_summary if summary_res else None
                category = summary_res.category if summary_res else None
                tags = summary_res.tags if summary_res else []
                
                if summary_res:
                    logger.info(f"Summarized via {summary_res.provider} [{category}]: {item['feed_article'].headline[:60]}")
                
                if item["db_article"] is None:
                    db_article = Article(
                        original_headline=item["feed_article"].headline,
                        original_url=item["feed_article"].url,
                        source_domain=item["feed_article"].source_domain,
                        ai_summary=ai_summary,
                        market_impact=market_impact,
                        published_at=item["feed_article"].published_at,
                        created_at=datetime.now(timezone.utc),
                        image_url=item["final_image_url"],
                        image_source=item["final_image_source"],
                        detailed_summary=detailed_summary,
                        category=category,
                        tags=tags,
                        additional_sources=item["feed_article"].additional_sources,
                    )
                    db.add(db_article)
                else:
                    db_article = item["db_article"]
                    db_article.ai_summary = ai_summary
                    db_article.market_impact = market_impact
                    db_article.detailed_summary = detailed_summary
                    db_article.category = category
                    db_article.tags = tags
                    
                new_count += 1
                
            await db.commit()

    logger.info(f"Scrape cycle complete: {new_count} new, {skip_count} skipped")


def start_scheduler():
    """Start the APScheduler background job."""
    settings = get_settings()
    scheduler.add_job(
        run_scrape_cycle,
        "interval",
        minutes=settings.scrape_interval_minutes,
        id="scrape_cycle",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc),
    )
    scheduler.start()
    logger.info(
        f"Scheduler started. Scraping every {settings.scrape_interval_minutes} minutes."
    )


def stop_scheduler():
    """Shut down the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
