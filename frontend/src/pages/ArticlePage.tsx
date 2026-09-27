import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchArticle, fetchRelatedArticles } from "../api/client";
import type { Article } from "../types";
import ArticleCard from "../components/ArticleCard";
import ArticleListItem from "../components/ArticleListItem";


function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitIntoParagraphs(text: string): string[] {
  // If already contains newlines, split on them
  if (text.includes("\n\n")) {
    return text.split("\n\n").filter(Boolean);
  }
  // Otherwise, split long text into ~3 paragraphs by sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 3) return [text];
  const chunkSize = Math.ceil(sentences.length / 3);
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(" ").trim());
  }
  return paragraphs;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchArticle(id)
      .then((data) => {
        setArticle(data);
        // Fetch related articles after getting the article
        return fetchRelatedArticles(id);
      })
      .then((relatedData) => {
        setRelated(relatedData);
      })
      .catch(() => setError("Article not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="article-detail">
        <div className="skeleton skeleton-hero-image"></div>
        <div className="skeleton skeleton-headline" style={{ width: "90%" }}></div>
        <div className="skeleton skeleton-meta"></div>
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line long"></div>
        <div className="skeleton skeleton-line medium"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div>
        <Link to="/" className="back-link">
          ← Back to feed
        </Link>
        <div className="error-state">
          <p>{error || "Article not found."}</p>
        </div>
      </div>
    );
  }

  const summaryText = article.detailed_summary || article.ai_summary || "";
  const paragraphs = splitIntoParagraphs(summaryText);
  const tags = article.tags || [];

  return (
    <div className="article-detail">
      <Link to="/" className="back-link">
        ← Back to feed
      </Link>

      {/* Hero image */}
      {article.image_url && (
        <div className="article-hero-image">
          <img 
            src={article.image_url} 
            alt="" 
          />
          {article.image_source && (
            <div className="image-caption" style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>
              Image source: {article.image_source}
            </div>
          )}
        </div>
      )}

      <div className="article-detail-meta">
        {article.category && (
          <span className="category-badge">{article.category}</span>
        )}
        <span className="article-source">{article.source_domain}</span>
        <span className="article-time">{formatDate(article.published_at)}</span>
      </div>

      <h1 className="article-detail-headline">{article.original_headline}</h1>

      {paragraphs.length > 0 && (
        <div className="article-body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="article-tags">
          <span style={{ fontSize: "0.9rem", color: "#666", marginRight: "8px", fontWeight: 600 }}>Related Tickers:</span>
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="article-outlink">
        <h3>Sources:</h3>
        <ul>
          <li>
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {article.source_domain}
            </a>
          </li>
          {article.additional_sources &&
            article.additional_sources.map((src, i) => (
              <li key={i}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {src.domain}
                </a>{" "}
                — {src.headline}
              </li>
            ))}
        </ul>
      </div>

      {/* Related news */}
      {related.length > 0 && (
        <div className="related-section">
          <h3 className="related-heading">Related News</h3>
          
          {/* Images */}
          {related.filter(r => r.image_url).length > 0 && (
            <div className="news-grid-dynamic" style={{ marginBottom: "32px" }}>
              {related.filter(r => r.image_url).map((r, idx, arr) => {
                const rowIdx = Math.floor(idx / 3);
                const itemsInThisRow = Math.min(3, arr.length - rowIdx * 3);
                let span = 2;
                if (itemsInThisRow === 1) span = 6;
                else if (itemsInThisRow === 2) span = 3;

                return (
                  <div key={r.id} className="news-grid-item-dynamic" style={{ '--dynamic-span': span } as any}>
                    <ArticleCard article={r} />
                  </div>
                );
              })}
            </div>
          )}

          {/* List items */}
          {related.filter(r => !r.image_url).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {related.filter(r => !r.image_url).map((r) => (
                <ArticleListItem key={r.id} article={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
