# DigiTak

AI-summarized financial intelligence. Aggregates news from Reuters, CNBC, Yahoo Finance, MarketWatch, and Bloomberg, processes each story through free-tier LLM providers, and serves concise summaries with market impact analysis.

## Architecture

```
frontend/          React + Vite + TypeScript (UI)
backend/           FastAPI + SQLAlchemy (API + Scraper)
  app/
    api/           REST endpoints
    scraper/       RSS reader, LLM summarizer, scheduler
  alembic/         Database migrations
docker-compose.yml Local development orchestration
```

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your Neon database URL and at least one LLM API key
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port 5432
- FastAPI backend on port 8000 (runs migrations automatically)
- Vite frontend on port 5173

### 3. Run without Docker

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## LLM Providers

The summarizer rotates through configured providers in this order:

1. **Grok** (xAI) — `GROK_API_KEY` — free tier available
2. **Gemini** (Google) — `GEMINI_API_KEY` — free tier via AI Studio
3. **Groq** — `GROQ_API_KEY` — free tier for Llama models

Set at least one key in `.env`. If a provider fails, the next one is tried automatically.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/articles` | List articles (paginated, filterable by source) |
| GET | `/api/articles/{id}` | Single article detail |
| GET | `/api/sources` | List distinct source domains |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Live financial news feed |
| `/article/{id}` | Single article detail (SEO) |
| `/about` | Mission and methodology |
| `/privacy-policy` | Cookie and AdSense compliance |
| `/terms-of-service` | Legal disclaimer |
| `/contact` | Contact form |
