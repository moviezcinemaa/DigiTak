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
        <div className="news-grid-dynamic">
          {[1, 2, 3, 4].map((i) => {
            const rowIdx = Math.floor((i - 1) / 3);
            const itemsInThisRow = Math.min(3, 4 - rowIdx * 3);
            let span = 2;
            if (itemsInThisRow === 1) span = 6;
            else if (itemsInThisRow === 2) span = 3;
            
            return (
              <div key={i} className="news-grid-item-dynamic" style={{ '--dynamic-span': span } as any}>
                <div className="movie-card-skeleton">
                  <div className="movie-poster-skeleton" />
                  <div className="movie-title-skeleton" />
                </div>
              </div>
            );
          })}
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
      <div className="news-grid-dynamic">
        {movies.map((movie, idx) => {
          const rowIdx = Math.floor(idx / 3);
          const itemsInThisRow = Math.min(3, movies.length - rowIdx * 3);
          let span = 2; // defaults to 3 per row (6/3=2)
          if (itemsInThisRow === 1) span = 6;
          else if (itemsInThisRow === 2) span = 3;

          return (
            <div key={movie._id} className="news-grid-item-dynamic" style={{ '--dynamic-span': span } as any}>
              <Link
                to={`/movies/${movie.slug.current}`}
                className="news-card"
                style={{ textDecoration: 'none' }}
              >
                {movie.poster ? (
                  <div className="news-card-image" style={{ backgroundColor: '#000' }}>
                    <img
                      src={urlFor(movie.poster).width(800).url()}
                      alt={movie.title}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="movie-poster-placeholder">{movie.title[0]}</div>
                )}
                <div className="news-card-body">
                  <h2 className="news-card-headline" style={{ margin: 0 }}>
                    {movie.title}
                  </h2>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
