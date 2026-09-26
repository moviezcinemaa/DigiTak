export default function SkeletonLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="news-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="news-card skeleton-card" key={i}>
          <div className="news-card-image">
            <div className="skeleton skeleton-image"></div>
          </div>
          <div className="news-card-body">
            <div className="news-card-meta">
              <span
                className="skeleton skeleton-meta"
                style={{ width: "60px" }}
              ></span>
              <span
                className="skeleton skeleton-meta"
                style={{ width: "80px" }}
              ></span>
            </div>
            <div className="skeleton skeleton-headline"></div>
            <div className="skeleton skeleton-line long"></div>
            <div className="skeleton skeleton-line medium"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
