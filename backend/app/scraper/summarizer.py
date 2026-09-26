"""
Multi-provider LLM summarizer with automatic rotation across free tiers.

Supported providers (in priority order):
1. Gemini (Google) — via google-generativeai SDK
2. Groq — via OpenAI-compatible API

Phase 2: Upgraded prompt enforces a structured JSON response with:
- detailed_summary (200-250 words)
- category (one of 6 fixed categories)
- tags (up to 5 stock tickers/company names)
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

VALID_CATEGORIES = ["IPO", "Stocks", "Economy", "Global", "Crypto", "Commodities"]

SUMMARIZATION_PROMPT = """You are a senior financial news analyst writing for a professional financial news aggregation platform.

Given the following article headline and text, produce a JSON response with exactly three fields:

1. "detailed_summary": A highly detailed, professional financial summary. CRITICAL RULE: It MUST be exactly 3 robust paragraphs and strictly between 200 and 250 words. Write in a formal journalistic tone. Include relevant context about why this news matters, what led to it, and what it means for investors. Break complex topics into digestible insights. Do NOT use bullet points — write flowing paragraphs. Do NOT hallucinate or extrapolate from your pre-training knowledge. You will be provided with aggregated text from multiple news sources about this topic; synthesize all provided source text into a cohesive report.

2. "category": Classify the article into EXACTLY ONE primary category from this list: "IPO", "Stocks", "Economy", "Global", "Crypto", "Commodities". Choose the most dominant topic. 

3. "tags": An array of up to 7 items. This MUST include:
   - Any relevant stock tickers, indices, or company names (e.g. "RELIANCE", "NIFTY50", "BTC").
   - Any secondary categories the article falls into from the allowed list ("IPO", "Stocks", "Economy", "Global", "Crypto", "Commodities"). For example, if an article is primarily about "Global" markets but heavily features Bitcoin, set category to "Global" and add "Crypto" to the tags array.

Article headline: {headline}
Article text: {text}

Respond with ONLY valid JSON, no markdown formatting or code blocks. Example:
{{"detailed_summary": "...", "category": "Stocks", "tags": ["RELIANCE", "NIFTY50"]}}"""


@dataclass
class SummarizationResult:
    """Phase 2 result includes detailed_summary, category, tags, plus legacy fields."""
    ai_summary: str  # Short 2-3 sentence version (first ~60 words of detailed)
    market_impact: str  # Legacy field — still populated for backward compat
    detailed_summary: str
    category: str
    tags: list[str]
    provider: str


class Summarizer:
    def __init__(self):
        self.settings = get_settings()
        self._providers = self._build_provider_list()

    def _build_provider_list(self) -> list[str]:
        providers = []
        if self.settings.gemini_api_key:
            providers.append("gemini")
        if self.settings.groq_api_key:
            providers.append("groq")
        if self.settings.openrouter_api_key:
            providers.append("openrouter")
        return providers

    async def summarize(
        self, headline: str, text: str
    ) -> Optional[SummarizationResult]:
        if not self._providers:
            logger.warning("No LLM API keys configured. Skipping summarization.")
            return None

        prompt = SUMMARIZATION_PROMPT.format(headline=headline, text=text[:4000])

        for provider in self._providers:
            try:
                result = await self._call_provider(provider, prompt)
                if result:
                    return result
            except Exception as e:
                logger.error(f"Provider {provider} failed: {e}")
                continue

        logger.error("All LLM providers failed for summarization.")
        return None

    async def _call_provider(
        self, provider: str, prompt: str
    ) -> Optional[SummarizationResult]:
        if provider == "gemini":
            return await self._call_gemini(prompt)
        elif provider == "groq":
            return await self._call_groq(prompt)
        elif provider == "openrouter":
            return await self._call_openrouter(prompt)
        return None

    async def _call_gemini(self, prompt: str) -> Optional[SummarizationResult]:
        import google.generativeai as genai
        genai.configure(api_key=self.settings.gemini_api_key)
        
        models_to_try = [
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash"
        ]
        
        last_error = None
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                response = await model.generate_content_async(prompt)
                return self._parse_response(response.text, f"gemini-{model_name}")
            except Exception as e:
                logger.warning(f"Gemini model {model_name} failed: {e}")
                last_error = e
                continue
                
        logger.error(f"All Gemini models failed. Last error: {last_error}")
        raise last_error

    async def _call_groq(self, prompt: str) -> Optional[SummarizationResult]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=self.settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0,
        )
        
        models_to_try = [
            "qwen/qwen3.8-27b",
            "allam-2-7b",
            "canopylabs/orpheus-v1-english"
        ]

        last_error = None
        for model in models_to_try:
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=1000,
                )
                return self._parse_response(response.choices[0].message.content, f"groq-{model}")
            except Exception as e:
                logger.warning(f"Groq model {model} failed: {e}")
                last_error = e
                continue
                
        logger.error(f"All Groq models failed. Last error: {last_error}")
        raise last_error

    async def _call_openrouter(self, prompt: str) -> Optional[SummarizationResult]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=self.settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            max_retries=0,
        )
        
        models_to_try = [
            "google/gemma-4-26b-a4b-it:free",
            "google/gemma-4-31b-it:free",
            "qwen/qwen3.8-27b:free",
            "liquid/lfm-2.5-2.6b:free",
            "openrouter/free",
        ]
        
        last_error = None
        for model in models_to_try:
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=1000,
                    extra_headers={
                        "HTTP-Referer": self.settings.frontend_url,
                        "X-Title": "DigiTak",
                    }
                )
                return self._parse_response(response.choices[0].message.content, f"openrouter-{model}")
            except Exception as e:
                logger.warning(f"OpenRouter model {model} failed: {e}")
                last_error = e
                continue
                
        logger.error(f"All OpenRouter models failed. Last error: {last_error}")
        raise last_error

    def _parse_response(
        self, raw: str, provider: str
    ) -> Optional[SummarizationResult]:
        try:
            # Strip markdown code blocks if the model wraps its response
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]
            data = json.loads(cleaned)

            detailed = data.get("detailed_summary", "")
            category = data.get("category", "")
            tags = data.get("tags", [])

            # Validate category
            if category not in VALID_CATEGORIES:
                category = "Stocks"  # Safe default

            # Validate tags — ensure list of strings, max 5
            if not isinstance(tags, list):
                tags = []
            tags = [str(t).upper().strip() for t in tags[:5] if t]

            # Generate short ai_summary from first ~60 words of detailed
            words = detailed.split()
            ai_summary = " ".join(words[:60]) + ("..." if len(words) > 60 else "")

            # Legacy market_impact — extract key points from detailed summary
            market_impact = f"- Category: {category}\n- Tags: {', '.join(tags) if tags else 'N/A'}\n- See detailed analysis above"

            return SummarizationResult(
                ai_summary=ai_summary,
                market_impact=market_impact,
                detailed_summary=detailed,
                category=category,
                tags=tags,
                provider=provider,
            )
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse {provider} response: {e}\nRaw: {raw[:300]}")
            return None


# Module-level singleton
_summarizer: Optional[Summarizer] = None


def get_summarizer() -> Summarizer:
    global _summarizer
    if _summarizer is None:
        _summarizer = Summarizer()
    return _summarizer
