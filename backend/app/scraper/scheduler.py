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

        for article in clustered_articles:
            # Step 2: Check for duplicates
            existing = await db.execute(
                select(Article).where(Article.original_url == article.url)
            )
            existing_article = existing.scalar_one_or_none()
            if existing_article:
                if existing_article.ai_summary is None:
                    db_article = existing_article
                else:
                    skip_count += 1
                    continue
            else:
                db_article = None

            # Step 3: Fetch full article text if the feed only gave us a snippet
            text = article.text
            scraped_image = None
            if len(text) < 200 or not article.image_url:
                full_text, scraped_img = await fetch_article_text(article.url)
                if full_text and len(full_text) > len(text):
                    text = full_text
                if scraped_img and not article.image_url:
                    scraped_image = scraped_img
                    
                # NEW LOGIC: Actively search for more sources if text is STILL too short
                if len(text) < 200:
                    try:
                        import asyncio
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

            # Determine final image and source
            final_image_url = article.image_url or scraped_image
            final_image_source = article.source_domain if final_image_url else None

            # Step 4: Summarize via LLM — Phase 2 structured output
            ai_summary = None
            market_impact = None
            detailed_summary = None
            category = None
            tags = []

            if text:
                result = await summarizer.summarize(article.headline, text)
                if result:
                    ai_summary = result.ai_summary
                    market_impact = result.market_impact
                    detailed_summary = result.detailed_summary
                    category = result.category
                    tags = result.tags
                    logger.info(
                        f"Summarized via {result.provider} [{category}]: "
                        f"{article.headline[:60]}"
                    )

            # Step 5: Store in database with Phase 2 fields
            if db_article is None:
                db_article = Article(
                    original_headline=article.headline,
                    original_url=article.url,
                    source_domain=article.source_domain,
                    ai_summary=ai_summary,
                    market_impact=market_impact,
                    published_at=article.published_at,
                    created_at=datetime.now(timezone.utc),
                    # Phase 2
                    image_url=final_image_url,
                    image_source=final_image_source,
                    detailed_summary=detailed_summary,
                    category=category,
                    tags=tags if tags else [],
                    # Phase 3
                    additional_sources=article.additional_sources,
                )
                db.add(db_article)
            else:
                # Update the existing un-summarized article
                db_article.ai_summary = ai_summary
                db_article.market_impact = market_impact
                db_article.detailed_summary = detailed_summary
                db_article.category = category
                db_article.tags = tags if tags else []
                
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
