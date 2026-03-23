"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavNode, NavFolder } from "@/lib/nav";

const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 140;
const SIDEBAR_MAX_WIDTH = 600;

interface SidebarProps {
  tree: NavNode[];
  isOpen: boolean;
}

function FolderNode({ node, depth }: { node: NavFolder; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: `0.3rem ${0.75 + depth * 0.75}rem`,
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--color-grey-700)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        >
          <polygon points="2,1 8,5 2,9" />
        </svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
      </button>
      {open && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {node.children.map((child) => (
            <NavItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FileNode({ node, depth }: { node: NavNode & { type: "file" }; depth: number }) {
  const pathname = usePathname();
  const href = `/view/${node.path.split("/").map(encodeURIComponent).join("/")}`;
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        style={{
          display: "block",
          padding: `0.3rem ${0.75 + depth * 0.75}rem`,
          fontSize: "0.7rem",
          color: isActive ? "var(--color-grey-900)" : "var(--color-grey-700)",
          fontWeight: isActive ? 600 : 400,
          textDecoration: "none",
          borderLeft: isActive ? "3px solid var(--color-yellow)" : "3px solid transparent",
          background: isActive ? "var(--color-yellow)" : "transparent",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {node.name}
      </Link>
    </li>
  );
}

function NavItem({ node, depth }: { node: NavNode; depth: number }) {
  if (node.type === "folder") return <FolderNode node={node} depth={depth} />;
  return <FileNode node={node} depth={depth} />;
}

export default function Sidebar({ tree, isOpen }: SidebarProps) {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth.current + delta));
      setWidth(next);
    };

    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [width]);

  return (
    <aside
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        minHeight: "calc(100vh - var(--nav-height))",
        background: "var(--color-white)",
        borderRight: "1px solid var(--color-grey-300)",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        position: "sticky" as const,
        top: "var(--nav-height)",
        maxHeight: "calc(100vh - var(--nav-height))",
        boxSizing: "border-box",
      }}
      aria-label="Navigation"
    >
      <nav style={{ paddingTop: "1rem", paddingBottom: "2rem" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tree.map((node) => (
            <NavItem key={node.path} node={node} depth={0} />
          ))}
        </ul>
      </nav>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "5px",
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
        }}
      />
    </aside>
  );
}
