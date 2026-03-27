"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { OutlineHeading } from "@/lib/markdown";

export default function OutlinePanel({ headings }: { headings: OutlineHeading[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string, index: number) => {
    e.preventDefault();
    setActiveIndex(index);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
  }, []);

  useEffect(() => {
    if (!open || headings.length === 0) return;

    // Find the last heading whose top edge is above the midpoint of the viewport —
    // that's the heading currently "in view" as the reader's focus point.
    let found = 0;
    for (let i = headings.length - 1; i >= 0; i--) {
      const el = document.getElementById(headings[i].id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) {
        found = i;
        break;
      }
    }

    setActiveIndex(found);

    // After React paints the panel, scroll it so the active item sits at ~20% from the top.
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      const item = itemRefs.current[found];
      if (!panel || !item) return;

      // offsetTop relative to the panel (handles any intermediate wrappers)
      const itemTop =
        item.getBoundingClientRect().top -
        panel.getBoundingClientRect().top +
        panel.scrollTop;

      panel.scrollTop = Math.max(0, itemTop - panel.clientHeight * 0.2);
    });
  }, [open, headings]);

  if (headings.length === 0) return null;

  return (
    <div
      style={{ position: "fixed", top: "calc(var(--nav-height) + 1rem)", right: "1.5rem", zIndex: 90 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open ? (
        <div
          ref={panelRef}
          style={{
            width: "43vw",
            maxHeight: "calc(100vh - var(--nav-height) - 1rem)",
            overflowY: "auto",
            background: "#e9e9e9",
            borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ padding: "0.5rem 0" }}>
            {headings.map((h, i) => (
              <a
                key={i}
                ref={(el) => { itemRefs.current[i] = el; }}
                href={`#${h.id}`}
                onClick={(e) => handleClick(e, h.id, i)}
                className="outline-link"
                style={{
                  display: "block",
                  padding: "0.3rem 1rem",
                  paddingLeft: `calc(0.75rem + ${h.level - 1} * 1rem)`,
                  textDecoration: "none",
                  color: "var(--color-grey-900)",
                  fontSize: "13px",
                  fontWeight: h.level === 1 ? 600 : h.level === 2 ? 500 : 400,
                  lineHeight: 1.4,
                  // Accent on the RIGHT — away from the main content edge
                  borderRight: i === activeIndex
                    ? "3px solid var(--color-yellow)"
                    : "3px solid transparent",
                  background: i === activeIndex
                    ? "rgba(245, 196, 0, 0.15)"
                    : undefined,
                }}
              >
                {h.text}
              </a>
            ))}
          </div>
        </div>
      ) : (
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
          }}
        >
          Outline
        </button>
      )}
    </div>
  );
}
