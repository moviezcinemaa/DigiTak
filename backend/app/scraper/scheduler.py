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
        last_article = await db.scalar(
            select(func.max(Article.created_at)).where(Article.ai_summary.is_not(None))
        )
        unsummarized_count = await db.scalar(
            select(func.count(Article.id)).where(Article.ai_summary.is_(None))
        )
        if last_article is None or (unsummarized_count and unsummarized_count > 0):
            since_hours = 72
            logger.info(f"Cold start or {unsummarized_count} unsummarized articles detected: fetching news from the past 72 hours.")
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
        # Step 1: Insert ALL incoming articles into DB immediately as unsummarized
        for article in clustered_articles:
            existing = await db.execute(select(Article).where(Article.original_url == article.url))
            if not existing.scalar_one_or_none():
                db.add(Article(
                    original_headline=article.headline,
                    original_url=article.url,
                    source_domain=article.source_domain,
                    published_at=article.published_at,
                    created_at=datetime.now(timezone.utc),
                    image_url=article.image_url,
                    additional_sources=article.additional_sources
                ))
        await db.commit()

        # Step 2: Cleanup old articles (older than 3 days)
        from sqlalchemy import delete, desc
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=3)
        await db.execute(delete(Article).where(Article.created_at < cutoff))
        
        # Step 3: Keep only the 54 most recent unsummarized articles in DB to prevent endless cold starts
        unsummarized_query = select(Article.id).where(Article.ai_summary.is_(None)).order_by(desc(Article.published_at)).offset(54)
        excess_ids = (await db.execute(unsummarized_query)).scalars().all()
        if excess_ids:
            await db.execute(delete(Article).where(Article.id.in_(excess_ids)))
        await db.commit()

        # Step 4: Fetch up to 54 unsummarized articles from the DB to process
        db_articles_to_process = (await db.execute(
            select(Article).where(Article.ai_summary.is_(None)).order_by(desc(Article.published_at)).limit(54)
        )).scalars().all()

        import asyncio
        semaphore = asyncio.Semaphore(10)
        
        url_to_rss_text = {a.url: a.text for a in clustered_articles}
        
        async def prepare_article(db_article):
            async with semaphore:
                text = url_to_rss_text.get(db_article.original_url, "")
                scraped_image = None
                
                if len(text) < 200 or not db_article.image_url:
                    full_text, scraped_img = await fetch_article_text(db_article.original_url)
                    if full_text and len(full_text) > len(text):
                        text = full_text
                    if scraped_img and not db_article.image_url:
                        scraped_image = scraped_img
                        
                    if len(text) < 200:
                        try:
                            from ddgs import DDGS
                            def perform_search():
                                with DDGS() as ddgs:
                                    return list(ddgs.news(db_article.original_headline, max_results=3))
                            results = await asyncio.to_thread(perform_search)
                            if results:
                                for r in results:
                                    if r.get('url') and r['url'] != db_article.original_url:
                                        search_url = r['url']
                                        s_text, _ = await fetch_article_text(search_url)
                                        if s_text and len(s_text) > 100:
                                            text += f"\n\n--- Source: {r.get('source', search_url)} ---\n" + s_text
                                            sources = list(db_article.additional_sources) if db_article.additional_sources else []
                                            sources.append({
                                                "url": search_url, 
                                                "domain": r.get('source', search_url), 
                                                "headline": r.get('title', db_article.original_headline)
                                            })
                                            db_article.additional_sources = sources
                        except Exception as e:
                            from app.scraper.feed_reader import logger
                            logger.warning(f"DDG Search failed for '{db_article.original_headline}': {e}")
                
                final_image_url = db_article.image_url or scraped_image
                final_image_source = db_article.source_domain if final_image_url else None
                
                return {
                    "db_article": db_article,
                    "text": text,
                    "final_image_url": final_image_url,
                    "final_image_source": final_image_source
                }

        tasks = [prepare_article(db_article) for db_article in db_articles_to_process]
        prepared_articles = await asyncio.gather(*tasks)

        # Step 5: Batch Summarize in chunks of 3
        batch_size = 3
        for i in range(0, len(prepared_articles), batch_size):
            chunk = prepared_articles[i:i+batch_size]
            
            llm_input = []
            for idx, item in enumerate(chunk):
                llm_input.append({
                    "id": idx,
                    "headline": item["db_article"].original_headline,
                    "text": item["text"][:1500]
                })
                
            summaries = await summarizer.summarize_batch(llm_input)
            
            for idx, item in enumerate(chunk):
                summary_res = summaries[idx] if idx < len(summaries) else None
                if summary_res:
                    db_article = item["db_article"]
                    db_article.ai_summary = summary_res.ai_summary
                    db_article.market_impact = summary_res.market_impact
                    db_article.detailed_summary = summary_res.detailed_summary
                    db_article.category = summary_res.category
                    db_article.tags = summary_res.tags
                    if item["final_image_url"] and not db_article.image_url:
                        db_article.image_url = item["final_image_url"]
                        db_article.image_source = item["final_image_source"]
                    
                    logger.info(f"Summarized via {summary_res.provider} [{summary_res.category}]: {db_article.original_headline[:60]}")
                    new_count += 1
                
            await db.commit()
            await asyncio.sleep(8) # Prevent API rate limit on free tiers (RPM limits)

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
