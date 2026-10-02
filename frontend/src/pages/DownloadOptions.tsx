import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import { sanityClient, urlFor } from "../lib/sanity";
import type { MovieNews } from "../types/sanity";

export default function DownloadOptions() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;
    const query = `*[_type == "movieNews" && slug.current == $slug][0]{
      _id, title, slug, poster, telegramLink, financialNews
    }`;
    sanityClient.fetch(query, { slug }).then((data: MovieNews | null) => {
      setMovie(data);
      setLoading(false);
    });
  }, [slug]);

  const handleDownload = () => {
    if (movie?.telegramLink) {
      window.location.href = movie.telegramLink;
    }
  };

  if (loading) {
    return (
      <section className="download-page">
        <div className="verify-loading">Loading...</div>
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="download-page">
        <h1>Not Found</h1>
        <p>This entry does not exist.</p>
        <Link to="/movies" className="movie-back-link">Back to Movies</Link>
      </section>
    );
  }

  return (
    <>
      <section className="download-page">
        <h1 className="download-title">{movie.title}</h1>
        <p className="download-subtitle">Select your preferred quality</p>

        {movie.poster ? (
          <img
            src={urlFor(movie.poster).width(800).url()}
            alt={movie.title}
            className="movie-entry-poster"
          />
        ) : (
          <div className="movie-poster-placeholder" style={{ margin: "0 auto 32px auto", maxWidth: "800px", width: "100%", aspectRatio: "2/3" }}>
            {movie.title[0]}
          </div>
        )}

        {movie.financialNews && (
          <div className="movie-entry-body" style={{ marginTop: '32px', marginBottom: '32px' }}>
            <PortableText value={movie.financialNews} />
          </div>
        )}

        <div className="download-buttons">
          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
          >
            Download 1080p
          </button>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
          >
            Download 720p
          </button>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
          >
            Download 480p
          </button>
        </div>
      </section>
    </>
  );
}
