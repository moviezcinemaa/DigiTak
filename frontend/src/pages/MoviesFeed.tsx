import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sanityClient, urlFor } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

const QUERY = `*[_type == "movieNews"] | order(_createdAt desc) {
  _id, title, slug, poster, telegramLink
}`;

export default function MoviesFeed() {
  const [movies, setMovies] = useState<MovieNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sanityClient.fetch(QUERY).then((data: MovieNews[]) => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="movies-feed">
        <h1 className="movies-feed-title">Movies</h1>
        <div className="movies-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="movie-card-skeleton">
              <div className="movie-poster-skeleton" />
              <div className="movie-title-skeleton" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (movies.length === 0) {
    return (
      <section className="movies-feed">
        <h1 className="movies-feed-title">Movies</h1>
        <p className="movies-empty">No entries yet. Add content in Sanity Studio.</p>
      </section>
    );
  }

  return (
    <section className="movies-feed">
      <h1 className="movies-feed-title">Movies</h1>
      <div className="movies-grid">
        {movies.map((movie) => (
          <Link
            key={movie._id}
            to={`/movies/${movie.slug.current}`}
            className="movie-card"
          >
            {movie.poster ? (
              <img
                src={urlFor(movie.poster).width(400).height(560).url()}
                alt={movie.title}
                className="movie-poster"
              />
            ) : (
              <div className="movie-poster-placeholder">{movie.title[0]}</div>
            )}
            <h2 className="movie-card-title">{movie.title}</h2>
          </Link>
        ))}
      </div>
    </section>
  );
}
