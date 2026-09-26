"""create articles table

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "articles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("original_headline", sa.String(512), nullable=False),
        sa.Column("original_url", sa.String(2048), nullable=False, unique=True),
        sa.Column("source_domain", sa.String(256), nullable=False),
        sa.Column("ai_summary", sa.Text, nullable=True),
        sa.Column("market_impact", sa.Text, nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    # Index for fast chronological queries and source filtering
    op.create_index("ix_articles_published_at", "articles", ["published_at"])
    op.create_index("ix_articles_source_domain", "articles", ["source_domain"])
    op.create_index("ix_articles_original_url", "articles", ["original_url"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_articles_original_url")
    op.drop_index("ix_articles_source_domain")
    op.drop_index("ix_articles_published_at")
    op.drop_table("articles")
