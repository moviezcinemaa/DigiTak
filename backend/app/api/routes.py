from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text, or_, and_, any_
from app.database import get_db
from app.models import Article
from app.schemas import (
    ArticleResponse,
    ArticleListResponse,
    SearchResponse,
    HealthResponse,
)
from app.config import get_settings
from app.limiter import limiter
from fastapi_cache.decorator import cache

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
@router.head("/health")
async def health_check():
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/articles", response_model=ArticleListResponse)
@limiter.limit("100/minute")
@cache(expire=300)
async def list_articles(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    source: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List articles with optional category and source filtering."""
    offset = (page - 1) * per_page

    query = select(Article).where(Article.ai_summary.is_not(None)).order_by(desc(Article.published_at))
    count_query = select(func.count(Article.id)).where(Article.ai_summary.is_not(None))

    if source:
        query = query.where(Article.source_domain == source)
        count_query = count_query.where(Article.source_domain == source)

    if category:
        category_condition = or_(
            Article.category == category,
            Article.tags.any(category)
        )
        query = query.where(category_condition)
        count_query = count_query.where(category_condition)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query.offset(offset).limit(per_page))
    articles = result.scalars().all()

    return ArticleListResponse(
        articles=[ArticleResponse.model_validate(a) for a in articles],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/articles/{article_id}", response_model=ArticleResponse)
@limiter.limit("60/minute")
@cache(expire=3600)
async def get_article(request: Request, article_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse.model_validate(article)


@router.get("/articles/{article_id}/related", response_model=list[ArticleResponse])
@limiter.limit("60/minute")
@cache(expire=3600)
async def get_related_articles(
    request: Request,
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Return up to 4 related articles that share at least one tag
    or the same category as the given article.
    """
    # Fetch the source article
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Build conditions for relatedness
    conditions = []

    # Match any shared tag using PostgreSQL array overlap operator (&&)
    if article.tags and len(article.tags) > 0:
        conditions.append(
            Article.tags.op("&&")(article.tags)
        )

    # Match same category
    if article.category:
        conditions.append(Article.category == article.category)

    if not conditions:
        return []

    query = (
        select(Article)
        .where(
            and_(
                Article.id != article_id,
                Article.ai_summary.is_not(None),
                or_(*conditions),
            )
        )
        .order_by(desc(Article.published_at))
        .limit(4)
    )

    result = await db.execute(query)
    related = result.scalars().all()
    return [ArticleResponse.model_validate(a) for a in related]


@router.get("/search", response_model=SearchResponse)
@limiter.limit("30/minute")
@cache(expire=300)
async def search_articles(
    request: Request,
    q: str = Query(..., min_length=1, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Full-text search using PostgreSQL's GIN index across headline and tags.
    """
    # Sanitize query for tsquery — replace spaces with & for AND matching
    sanitized = " & ".join(q.strip().split())

    query = (
        select(Article)
        .where(
            and_(
                Article.ai_summary.is_not(None),
                text("articles_fts_vector(original_headline, tags) @@ to_tsquery('english', :q)")
            )
        )
        .params(q=sanitized)
        .order_by(desc(Article.published_at))
        .limit(50)
    )

    result = await db.execute(query)
    articles = result.scalars().all()

    return SearchResponse(
        articles=[ArticleResponse.model_validate(a) for a in articles],
        total=len(articles),
        query=q,
    )


@router.get("/sources", response_model=list[str])
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Article.source_domain).distinct().order_by(Article.source_domain)
    )
    return result.scalars().all()


@router.get("/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Return distinct categories currently in the database."""
    result = await db.execute(
        select(Article.category)
        .where(Article.category.is_not(None))
        .distinct()
        .order_by(Article.category)
    )
    return result.scalars().all()
