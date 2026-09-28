import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { sanityClient, urlFor } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

export default function Verify() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieNews | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<MovieNews[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCounting, setIsCounting] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;
    const query = `*[_type == "movieNews" && slug.current == $slug][0]{
      _id, title, slug, youtubeReactions, telegramLink
    }`;
    const relatedQuery = `*[_type == "movieNews" && slug.current != $slug] | order(_createdAt desc)[0...4] {
      _id, title, slug, poster, "summaryPreview": pt::text(financialNews)
    }`;

    Promise.all([
      sanityClient.fetch(query, { slug }),
      sanityClient.fetch(relatedQuery, { slug })
    ]).then(([movieData, relatedData]) => {
      setMovie(movieData);
      setRelatedMovies(relatedData);
      setLoading(false);
    });
  }, [slug]);

  const startTimer = useCallback(() => {
    setIsCounting(true);
    timeoutRef.current = setTimeout(() => {
      setIsCounting(false);
      setTimerDone(true);
    }, 10000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSwipeDown = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="verify-page">
        <div className="verify-loading">Loading...</div>
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="verify-page">
        <h1>Not Found</h1>
        <p>This entry does not exist.</p>
        <Link to="/movies" className="movie-back-link">Back to Movies</Link>
      </section>
    );
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <section className="verify-page">
        <h1 className="verify-title">{movie.title}</h1>
        <div className="verify-timer-section">
          {!isCounting && !timerDone && (
            <button
              type="button"
              className="verify-btn"
              onClick={startTimer}
            >
              Start Verification
            </button>
          )}

          {isCounting && (
            <div className="verify-countdown">
              <div className="numero_counting_wrapper">
                <div className="numero_shape"></div>
              </div>
            </div>
          )}

          {timerDone && (
            <button
              type="button"
              className="verify-btn"
              onClick={handleSwipeDown}
            >
              Swipe Down
            </button>
          )}
        </div>

        <img 
          src="/yt-reactions-placeholder.jpg" 
          alt="Reactions placeholder" 
          style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", marginBottom: "24px", border: "1px solid var(--border-color)" }} 
        />

        {movie.youtubeReactions && (
          <div className="verify-reactions">
            <h2 className="verify-reactions-heading">Reactions</h2>
            <p className="verify-reactions-text">{movie.youtubeReactions}</p>
          </div>
        )}

        {relatedMovies.length > 0 && (
          <div className="related-section" style={{ marginTop: '32px' }}>
            <h2 className="related-heading">More Movies</h2>
            <div className="news-grid-dynamic">
              {relatedMovies.map((relMovie, idx) => {
                const rowIdx = Math.floor(idx / 3);
                const itemsInThisRow = Math.min(3, relatedMovies.length - rowIdx * 3);
                let span = 2; // defaults to 3 per row (6/3=2)
                if (itemsInThisRow === 1) span = 6;
                else if (itemsInThisRow === 2) span = 3;
                
                let truncated = relMovie.summaryPreview || "";
                if (truncated.length > 120) {
                  truncated = truncated.slice(0, 120).trimEnd() + "...";
                }
                
                return (
                  <div key={relMovie._id} className="news-grid-item-dynamic" style={{ '--dynamic-span': span } as any}>
                    <Link
                      to={`/movies/${relMovie.slug.current}`}
                      className="news-card"
                      style={{ textDecoration: 'none' }}
                    >
                      {relMovie.poster ? (
                        <div className="news-card-image">
                          <img
                            src={urlFor(relMovie.poster).width(800).url()}
                            alt={relMovie.title}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="movie-poster-placeholder">{relMovie.title[0]}</div>
                      )}
                      <div className="news-card-body">
                        <h2 className="news-card-headline" style={{ margin: 0 }}>
                          {relMovie.title}
                        </h2>
                        {truncated && (
                          <p className="news-card-preview">{truncated}</p>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ height: '32px' }} />

        <div className="verify-footer-action">
          {timerDone ? (
            <Link
              to={`/download-options/${movie.slug.current}`}
              className="verify-btn verify-btn-active"
              style={{ width: "100%" }}
            >
              Get Link
            </Link>
          ) : (
            <button
              type="button"
              className="verify-btn verify-btn-disabled"
              disabled
              style={{ width: "100%" }}
            >
              Wait to Get Link...
            </button>
          )}
        </div>
      </section>
    </>
  );
}
