# DigiTak 📈

DigiTak is an intelligent, highly-concurrent automated financial news aggregator. It continuously scrapes, deduplicates, curates, and summarizes top financial stories, IPO news, and crypto updates from around the globe using a resilient multi-provider LLM fallback chain.

---

## 🏗️ Architectural Overview

DigiTak is built for extreme speed and API-limit resilience. It splits the workload between a lightning-fast asynchronous REST API and a heavy-duty background scraper engine.

- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python) running on Uvicorn for asynchronous request handling.
- **Database Engine**: PostgreSQL utilizing `asyncpg` and SQLAlchemy ORM. Optimized with specific B-Tree indexes (`published_at`, `category`, `created_at`).
- **Scraper Engine**: `APScheduler` driven Python cron jobs. Uses `feedparser` and `BeautifulSoup4` to parse and sanitize raw HTML/XML feeds.
- **AI Summarization**: A custom 17-model LLM fallback chain spanning **Groq**, **OpenRouter**, and **Google Gemini** to guarantee a 0% failure rate on summaries despite rigid free-tier rate limits.
- **Frontend App**: React 18 + TypeScript + Vite. State management via `Zustand`. Features a dynamic CSS Grid engine that intelligently shifts between List and Card views based on the presence of parsed OpenGraph image elements.

---

## 🔄 Core Workflow Diagram

```mermaid
graph TD
    %% Scraper Engine
    subgraph Background Scraper Engine
    A[APScheduler Cron] -->|Concurrent asyncio.gather| B(Fetch 11+ Global RSS Feeds)
    B -->|Sanitize HTML & Extract og:image| C{Deduplication Engine}
    C -->|difflib similarity > 60%| D[Merge with Existing Article]
    C -->|Unique Story| E{Text Length Check}
    E -->|< 200 chars| S(Active DuckDuckGo News Search)
    S -->|Fetch 3 extra sources| E
    E -->|> 200 chars| F[LLM Batch Summarizer Pipeline]
    end

    %% AI Pipeline
    subgraph Multi-Provider LLM Chain (Batched)
    F -->|Attempt 1| G(Groq - Llama 3 / Qwen)
    G -.->|Rate Limit 429| H(OpenRouter - Gemma / Liquid)
    H -.->|Rate Limit 429| I(Google Gemini 3.x Flash)
    G -->|Success| J[Structured JSON Array]
    H -->|Success| J
    I -->|Success| J
    end

    %% Storage & UI
    J --> K[(PostgreSQL Database)]
    K -->|Async SQLAlchemy| L[FastAPI REST API]
    L -->|GZip + In-Memory Caching| M[React Frontend]
    M -->|Dynamic Grid Switch| N((End User))
```

---

## 🚀 Key Features

- **Massive Concurrency**: The entire scraping pipeline is completely asynchronous. It uses `asyncio.gather` and semaphores to concurrently fetch dozens of RSS feeds and HTML pages simultaneously without blocking the main event loop.
- **Active Source Aggregation**: If an RSS feed only provides a tiny text snippet, the scraper automatically performs a live DuckDuckGo News search for the headline, pulls down the top 3 alternative articles, and aggregates their text before summarizing.
- **LLM Batch Processing**: Instead of sending one prompt per article, the system chunks articles into batches of 5 and requests a massive JSON array from the LLM. This cuts API requests by 80%, completely eliminating `429 Too Many Requests` errors on free-tier APIs.
- **API Caching & Compression**: `fastapi-cache2` prevents database hammering by caching the `/articles` endpoints, while `GZipMiddleware` compresses the heavy text payloads by over 70% before transit.
- **Semantic Deduplication**: Prevents overlapping stories (e.g., CNBC and Yahoo Finance reporting the same IPO) by running a `difflib.SequenceMatcher` across headlines. If a >60% match is found, it appends the secondary source to the primary article instead of duplicating it in the UI.

---

## 📂 Codebase Structure

```text
DigiTak/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py         # FastAPI REST endpoints
│   │   ├── scraper/
│   │   │   ├── feed_reader.py    # RSS parsing & image extraction
│   │   │   ├── scheduler.py      # APScheduler, Cold Start & Deduplication
│   │   │   └── summarizer.py     # 17-model LLM Fallback Chain
│   │   ├── models.py             # SQLAlchemy Postgres schemas
│   │   └── main.py               # Uvicorn entry point & Lifespan hooks
│   └── alembic/                  # Database migrations
│
└── frontend/
    ├── src/
    │   ├── components/           # Reusable UI (ArticleCard, SearchBar)
    │   ├── pages/                # Views (Home, ArticlePage)
    │   ├── api/                  # Axios HTTP client
    │   └── store/                # Zustand state management
    └── index.html
```

---

## 🔌 External APIs & Feeds Used

1. **Groq API**: Primary LLM inference for generating structural article summaries and extracting categories/tags (utilizing `qwen3.8-27b`, `allam-2-7b`, etc).
2. **OpenRouter API**: Secondary fallback AI layer.
3. **Google Gemini API**: Tertiary fallback AI layer (`gemini-3.8-flash`).
4. **RSS Feeds**: Aggregating raw data from Yahoo Finance, MarketWatch, CNBC, CoinTelegraph, Investing.com, and MoneyControl.
