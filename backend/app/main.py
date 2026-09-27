import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.scraper.scheduler import start_scheduler, stop_scheduler
from app.config import get_settings
from fastapi.middleware.gzip import GZipMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from app.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"GoFact API starting ({settings.environment})")
    
    # NOTE: APScheduler handles background scraping. 
    # Deduplication logic in scheduler.py prevents overlap automatically!
    
    FastAPICache.init(InMemoryBackend(), prefix="gofact-cache")

    start_scheduler()
    yield
    stop_scheduler()
    logger.info("GoFact API shutting down")


app = FastAPI(
    title="GoFact API",
    description="Financial news aggregation and AI summarization API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "GoFact API is running. Access /api/health for status."}
