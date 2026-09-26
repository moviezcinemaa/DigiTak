import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.scraper.scheduler import start_scheduler, stop_scheduler
from app.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"DigiTak API starting ({settings.environment})")
    
    # Wipe the database completely on fresh startup to avoid overlap
    from app.database import async_session
    from app.models import Article
    from sqlalchemy import delete
    
    try:
        async with async_session() as db:
            result = await db.execute(delete(Article))
            await db.commit()
            logger.info(f"Database wiped clean on startup. Deleted {result.rowcount} old articles.")
    except Exception as e:
        logger.error(f"Failed to wipe database on startup: {e}")

    start_scheduler()
    yield
    stop_scheduler()
    logger.info("DigiTak API shutting down")


app = FastAPI(
    title="DigiTak API",
    description="Financial news aggregation and AI summarization API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
