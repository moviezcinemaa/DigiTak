import os
from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://gofact:gofact_local@localhost:5432/gofact"
    database_url_sync: str = "postgresql://gofact:gofact_local@localhost:5432/gofact"

    # LLM API keys (all optional; the summarizer rotates through whichever are set)
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""

    # Scraper
    scrape_interval_minutes: int = 60

    # App
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    model_config = {
        "env_file": [".env", "../.env"],
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @model_validator(mode='after')
    def fix_database_urls(self) -> 'Settings':
        if self.database_url and self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        if self.database_url_sync and self.database_url_sync.startswith("postgres://"):
            self.database_url_sync = self.database_url_sync.replace("postgres://", "postgresql://", 1)
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
