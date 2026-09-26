"""add phase2 columns: image_url, category, tags, detailed_summary, FTS index

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New columns for Phase 2
    op.add_column("articles", sa.Column("image_url", sa.Text, nullable=True))
    op.add_column(
        "articles",
        sa.Column("category", sa.String(50), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column("tags", ARRAY(sa.Text), nullable=True, server_default="{}"),
    )
    op.add_column(
        "articles",
        sa.Column("detailed_summary", sa.Text, nullable=True),
    )

    # Index on category for fast filtering
    op.create_index("ix_articles_category", "articles", ["category"])

    # Create an IMMUTABLE wrapper function for to_tsvector so it can be
    # used in a GIN index expression on Neon / cloud PostgreSQL
    op.execute(
        """
        CREATE OR REPLACE FUNCTION articles_fts_vector(headline text, tag_arr text[])
        RETURNS tsvector
        LANGUAGE sql
        IMMUTABLE
        AS $$
            SELECT to_tsvector('english', COALESCE(headline, '') || ' ' || COALESCE(array_to_string(tag_arr, ' '), ''));
        $$;
        """
    )

    # GIN full-text search index using the immutable wrapper
    op.execute(
        """
        CREATE INDEX idx_articles_fts
        ON articles
        USING GIN (
            articles_fts_vector(original_headline, tags)
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_articles_fts")
    op.execute("DROP FUNCTION IF EXISTS articles_fts_vector(text, text[])")
    op.drop_index("ix_articles_category")
    op.drop_column("articles", "detailed_summary")
    op.drop_column("articles", "tags")
    op.drop_column("articles", "category")
    op.drop_column("articles", "image_url")
