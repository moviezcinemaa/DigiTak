import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { sanityClient } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

export default function Verify() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieNews | null>(null);
  const [loading, setLoading] = useState(true);

  const [isCounting, setIsCounting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!slug) return;
    const query = `*[_type == "movieNews" && slug.current == $slug][0]{
      _id, title, slug, youtubeReactions, telegramLink
    }`;
    sanityClient.fetch(query, { slug }).then((data: MovieNews | null) => {
      setMovie(data);
      setLoading(false);
    });
  }, [slug]);

  const startTimer = useCallback(() => {
    setIsCounting(true);
    setCountdown(10);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsCounting(false);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
              <span className="verify-countdown-number">{countdown}</span>
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

        <div className="verify-spacer" />

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
