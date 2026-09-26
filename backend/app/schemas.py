from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class ArticleBase(BaseModel):
    original_headline: str
    original_url: str
    source_domain: str
    ai_summary: Optional[str] = None
    market_impact: Optional[str] = None
    published_at: Optional[datetime] = None
    # Phase 2 fields
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    detailed_summary: Optional[str] = None
    
    # Phase 3: Multi-source clustering
    additional_sources: Optional[list[dict]] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleResponse(ArticleBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ArticleListResponse(BaseModel):
    articles: list[ArticleResponse]
    total: int
    page: int
    per_page: int


class SearchResponse(BaseModel):
    articles: list[ArticleResponse]
    total: int
    query: str


class HealthResponse(BaseModel):
    status: str
    environment: str
    timestamp: datetime
