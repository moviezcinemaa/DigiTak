import { useState, useRef, useEffect } from "react";
import type { Category } from "../types";
import { CATEGORIES } from "../types";

interface CategoryBarProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  return (
    <div className="category-bar-wrapper">
      <div className="category-bar">
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip${active === cat ? " active" : ""}`}
              onClick={() => onChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
