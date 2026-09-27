import { useState, useRef, useEffect } from "react";
import type { Category } from "../types";
import { CATEGORIES } from "../types";

interface CategoryBarProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleCount = 4;

  return (
    <div className="category-bar-wrapper">
      <div className="category-bar">
        <div className="category-chips">
          {CATEGORIES.map((cat, index) => {
            const isHiddenMobile = index >= visibleCount;
            return (
              <button
                key={cat}
                className={`category-chip${active === cat ? " active" : ""}${isHiddenMobile ? " mobile-hidden-chip" : ""}`}
                onClick={() => onChange(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="dots-menu-wrapper" ref={dropdownRef}>
          <div className={`dots ${isExpanded ? "active" : ""}`} onClick={() => setIsExpanded(!isExpanded)}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            
            <div className="shadow cut"></div>
            <div className="container cut">
              <div className="drop cut2"></div>
            </div>
            
            <div className="list">
              <ul>
                {CATEGORIES.slice(visibleCount).map((cat) => (
                  <li 
                    key={cat} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(cat);
                      setIsExpanded(false);
                    }}
                    style={active === cat ? { fontWeight: "bold" } : {}}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
