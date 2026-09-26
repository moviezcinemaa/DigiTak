import { Link } from "react-router-dom";
import type { Article } from "../types";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect fill='%23e0dbd3' width='640' height='360'/%3E%3Ctext fill='%237a7a7a' font-family='Helvetica' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ArticleCard({ article }: { article: Article }) {
  const summaryPreview = article.detailed_summary || article.ai_summary || "";
  // Truncate to ~120 chars for 2-line preview
  const truncated =
    summaryPreview.length > 120
      ? summaryPreview.slice(0, 120).trimEnd() + "..."
      : summaryPreview;

  return (
    <div className="news-card">
      <Link to={`/article/${article.id}`} className="news-card-image-link">
        <div className="news-card-image">
          <img
            src={article.image_url || PLACEHOLDER_IMAGE}
            alt=""
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>
      </Link>
      <div className="news-card-body">
        <div className="news-card-meta">
          {article.category && (
            <span className="category-badge">{article.category}</span>
          )}
          <span className="article-source">{article.source_domain}</span>
          <span className="article-time">{formatTime(article.published_at)}</span>
        </div>
        <h2 className="news-card-headline">
          <Link to={`/article/${article.id}`}>
            {article.original_headline}
          </Link>
        </h2>
        {truncated && (
          <p className="news-card-preview">{truncated}</p>
        )}
      </div>
    </div>
  );
}
