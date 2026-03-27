"use client";

import { useState, useCallback } from "react";
import type { OutlineHeading } from "@/lib/markdown";

export default function OutlinePanel({ headings }: { headings: OutlineHeading[] }) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--nav-height) + 1rem)",
        right: "1.5rem",
        zIndex: 90,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "0.5rem",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div
          style={{
            width: "min(65vw, calc(100vw - 5rem))",
            maxHeight: "calc(100vh - var(--nav-height) - 2rem)",
            overflowY: "auto",
            background: "#e9e9e9",
            borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            padding: "0.5rem 0",
          }}
        >
          {headings.map((h, i) => (
            <a
              key={i}
              href={`#${h.id}`}
              onClick={(e) => handleClick(e, h.id)}
              className="outline-link"
              style={{
                display: "block",
                padding: "0.3rem 1rem",
                paddingLeft: `calc(0.75rem + ${(h.level - 1)} * 1rem)`,
                textDecoration: "none",
                color: "var(--color-grey-900)",
                fontSize: "13px",
                fontWeight: h.level <= 2 ? (h.level === 1 ? 600 : 500) : 400,
                lineHeight: 1.4,
              }}
            >
              {h.text}
            </a>
          ))}
        </div>
      )}

      <button
        style={{
          background: "var(--color-grey-100)",
          border: "1px solid var(--color-grey-300)",
          borderRadius: "6px",
          padding: "0.35rem 0.85rem",
          fontSize: "0.875rem",
          color: "var(--color-grey-700)",
          cursor: "default",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Outline
      </button>
    </div>
  );
}
