import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import { sanityClient, urlFor } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

export default function MovieEntry() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieNews | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<MovieNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;
    const query = `*[_type == "movieNews" && slug.current == $slug][0]`;
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

  if (loading) {
    return (
      <section className="movie-entry">
        <div className="movie-entry-skeleton">
          <div className="movie-poster-skeleton" />
          <div className="movie-title-skeleton" />
          <div className="movie-body-skeleton" />
        </div>
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="movie-entry">
        <h1>Not Found</h1>
        <p>This movie entry does not exist.</p>
        <Link to="/?category=Movies" className="back-link">← Back to feed</Link>
      </section>
    );
  }

  return (
    <section className="movie-entry">
      <Link to="/?category=Movies" className="back-link">← Back to feed</Link>

      <h1 className="movie-entry-title">{movie.title}</h1>

      {movie.poster && (
        <img
          src={urlFor(movie.poster).width(600).url()}
          alt={movie.title}
          className="movie-entry-poster"
        />
      )}

      {movie.financialNews && (
        <div className="movie-entry-body">
          <PortableText value={movie.financialNews} />
        </div>
      )}

      <div className="movie-entry-cta">
        <Link to={`/verify/${movie.slug.current}`} className="movie-cta-link">
          <div className="movie-cta-box">
            <span className="movie-cta-text">Join Telegram Community</span>
          </div>
        </Link>
      </div>

      {relatedMovies.length > 0 && (
        <div className="related-section">
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
    </section>
  );
}
