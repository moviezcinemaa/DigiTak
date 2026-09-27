import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-title">
          <img src="/favicon.jpg" alt="DigiTak Logo" className="site-logo" />
          <span>DigiTak</span>
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setNavOpen(!navOpen)}
          aria-label="Toggle navigation"
        >
          {navOpen ? "Close" : "Menu"}
        </button>
        <nav className={`site-nav${navOpen ? " open" : ""}`}>
          <NavLink to="/" end onClick={() => setNavOpen(false)}>
            Feed
          </NavLink>
          <NavLink to="/movies" onClick={() => setNavOpen(false)}>
            Movies
          </NavLink>
          <NavLink to="/about" onClick={() => setNavOpen(false)}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={() => setNavOpen(false)}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
