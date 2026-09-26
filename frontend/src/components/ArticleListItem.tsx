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

export default function ArticleListItem({ article }: { article: Article }) {
  const summaryPreview = article.detailed_summary || article.ai_summary || "";
  // Truncate to ~180 chars for 2-line preview in list format
  const truncated =
    summaryPreview.length > 180
      ? summaryPreview.slice(0, 180).trimEnd() + "..."
      : summaryPreview;

  return (
    <div className="news-list-item">
      <div className="news-list-item-body">
        <div className="news-card-meta">
          {article.category && (
            <span className="category-badge">{article.category}</span>
          )}
          <span className="article-source">{article.source_domain}</span>
          <span className="article-time">{formatTime(article.published_at)}</span>
        </div>
        <h2 className="news-list-item-headline">
          <Link to={`/article/${article.id}`}>
            {article.original_headline}
          </Link>
        </h2>
        {truncated && (
          <p className="news-list-item-preview">{truncated}</p>
        )}
      </div>
    </div>
  );
}
