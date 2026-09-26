export interface Article {
  id: string;
  original_headline: string;
  original_url: string;
  source_domain: string;
  ai_summary: string | null;
  market_impact: string | null;
  published_at: string | null;
  created_at: string;
  // Phase 2
  image_url: string | null;
  image_source: string | null;
  category: string | null;
  tags: string[] | null;
  detailed_summary: string | null;
  // Phase 3
  additional_sources: { url: string; domain: string; headline: string }[] | null;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  per_page: number;
}

export interface SearchResponse {
  articles: Article[];
  total: number;
  query: string;
}

export type Category = "All" | "IPO" | "Stocks" | "Economy" | "Global" | "Crypto" | "Commodities";

export const CATEGORIES: Category[] = [
  "All",
  "IPO",
  "Stocks",
  "Economy",
  "Global",
  "Crypto",
  "Commodities",
];
