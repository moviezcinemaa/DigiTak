import { useState } from "react";
import type { Category } from "../types";
import { CATEGORIES } from "../types";

interface CategoryBarProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="category-bar-wrapper">
      {isExpanded && (
        <div className="category-backdrop" onClick={() => setIsExpanded(false)} />
      )}
      <div className={`category-bar ${isExpanded ? "expanded" : ""}`}>
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
             <button
              key={cat}
              className={`category-chip${active === cat ? " active" : ""}`}
              onClick={() => {
                onChange(cat);
                setIsExpanded(false);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <button 
        className={`category-toggle-btn ${isExpanded ? "expanded" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Collapse categories" : "Expand categories"}
      >
        {isExpanded ? "−" : "＋"}
      </button>
    </div>
  );
}
