import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    original_headline: Mapped[str] = mapped_column(String(512), nullable=False)
    original_url: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True)
    source_domain: Mapped[str] = mapped_column(String(256), nullable=False)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    market_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    # Phase 2 columns
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_source: Mapped[str | None] = mapped_column(String(256), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True, default=list)
    detailed_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Phase 3 columns (Multi-source clustering)
    from sqlalchemy.dialects.postgresql import JSONB
    additional_sources: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True, default=list)

    def __repr__(self) -> str:
        return f"<Article {self.source_domain}: {self.original_headline[:50]}>"
