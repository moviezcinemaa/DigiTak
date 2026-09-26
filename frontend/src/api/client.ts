import type { Article, ArticleListResponse, SearchResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchArticles(
  page: number = 1,
  perPage: number = 20,
  source?: string,
  category?: string
): Promise<ArticleListResponse> {
  let path = `/articles?page=${page}&per_page=${perPage}`;
  if (source) {
    path += `&source=${encodeURIComponent(source)}`;
  }
  if (category && category !== "All") {
    path += `&category=${encodeURIComponent(category)}`;
  }
  return request<ArticleListResponse>(path);
}

export async function fetchArticle(id: string): Promise<Article> {
  return request<Article>(`/articles/${id}`);
}

export async function fetchRelatedArticles(id: string): Promise<Article[]> {
  return request<Article[]>(`/articles/${id}/related`);
}

export async function searchArticles(query: string): Promise<SearchResponse> {
  return request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
}

export async function fetchSources(): Promise<string[]> {
  return request<string[]>("/sources");
}

export async function fetchCategories(): Promise<string[]> {
  return request<string[]>("/categories");
}
