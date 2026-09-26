import { useState, useEffect } from "react";
import { fetchArticles, searchArticles } from "../api/client";
import type { Article, Category } from "../types";
import ArticleCard from "../components/ArticleCard";
import ArticleListItem from "../components/ArticleListItem";
import CategoryBar from "../components/CategoryBar";
import SearchBar from "../components/SearchBar";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const perPage = 18;

  useEffect(() => {
    if (!isSearching) {
      loadArticles();
    }
  }, [page, activeCategory]);

  async function loadArticles() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles(
        page,
        perPage,
        undefined,
        activeCategory !== "All" ? activeCategory : undefined
      );
      setArticles(data.articles);
      setTotal(data.total);
    } catch {
      setError(
        "Unable to load articles. The backend may not be running yet."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    setIsSearching(true);
    setSearchQuery(query);
    try {
      const data = await searchArticles(query);
      setArticles(data.articles);
      setTotal(data.total);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setIsSearching(false);
    setSearchQuery("");
    setPage(1);
    loadArticles();
  }

  function handleCategoryChange(cat: Category) {
    setActiveCategory(cat);
    setPage(1);
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery("");
    }
  }

  const totalPages = Math.ceil(total / perPage);

  const withImage = articles.filter(a => a.image_url);
  const withoutImage = articles.filter(a => !a.image_url);

  return (
    <>
      <h1 className="page-heading">Global Financial Intelligence</h1>
      <p className="page-subheading">
        Raw market data distilled into actionable insights. Powered by a resilient 17-model AI chain, stripping the noise from global financial coverage.
      </p>

      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isSearching={isSearching}
      />

      <CategoryBar active={activeCategory} onChange={handleCategoryChange} />

      {isSearching && (
        <p className="search-result-info">
          {total} result{total !== 1 ? "s" : ""} for "{searchQuery}"
        </p>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <SkeletonLoader count={6} />
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <p>No articles found.</p>
          <p>
            {isSearching
              ? "Try a different search term."
              : "The scraper runs on startup and every 60 minutes. Check back shortly."}
          </p>
        </div>
      ) : (
        <>
          {/* Top section: Articles with images (Dynamic Grid) */}
          {withImage.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              {withImage.map((article, idx) => {
                const rowIdx = Math.floor(idx / 3);
                const itemsInThisRow = Math.min(3, withImage.length - rowIdx * 3);
                let span = 2; // defaults to 3 per row (6/3=2)
                if (itemsInThisRow === 1) span = 6;
                else if (itemsInThisRow === 2) span = 3;

                return (
                  <div key={article.id} style={{ gridColumn: `span ${span}`, display: 'flex', flexDirection: 'column' }}>
                    <ArticleCard article={article} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom section: Articles without images (List view) */}
          {withoutImage.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {withoutImage.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}

          {!isSearching && totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
