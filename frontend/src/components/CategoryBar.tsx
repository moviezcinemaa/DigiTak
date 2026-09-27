import { useState } from "react";
import type { Category } from "../types";
import { CATEGORIES } from "../types";

interface CategoryBarProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="category-accordion-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="category-accordion-toggle"
      >
        <span>Filter: {active}</span>
        <span className={`toggle-icon ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      <div className={`category-accordion-content ${isOpen ? "open" : ""}`}>
        <div className="category-accordion-inner">
          <div className="category-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-chip${active === cat ? " active" : ""}`}
                onClick={() => {
                  onChange(cat);
                  // Optionally close on select if preferred
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
