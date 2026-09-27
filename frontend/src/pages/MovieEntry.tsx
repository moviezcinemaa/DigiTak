import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import { sanityClient, urlFor } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

export default function MovieEntry() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const query = `*[_type == "movieNews" && slug.current == $slug][0]`;
    sanityClient.fetch(query, { slug }).then((data: MovieNews | null) => {
      setMovie(data);
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
        <Link to="/movies" className="movie-back-link">Back to Movies</Link>
      </section>
    );
  }

  return (
    <section className="movie-entry">
      <Link to="/movies" className="movie-back-link">Back to Movies</Link>

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
            <span className="movie-cta-text">How to Download</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
