import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import MoviesFeed from "./pages/MoviesFeed";
import MovieEntry from "./pages/MovieEntry";
import Verify from "./pages/Verify";
import DownloadOptions from "./pages/DownloadOptions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main site — wrapped in Layout (header + footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/movies" element={<MoviesFeed />} />
          <Route path="/movies/:slug" element={<MovieEntry />} />
        </Route>

        {/* Isolated funnel routes — NO layout, NO nav, NO footer */}
        <Route path="/verify/:slug" element={<Verify />} />
        <Route path="/download-options/:slug" element={<DownloadOptions />} />
      </Routes>
    </BrowserRouter>
  );
}
