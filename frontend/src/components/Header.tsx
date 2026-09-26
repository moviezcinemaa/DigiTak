import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-title">
          DigiTak
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
