"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavNode, NavFolder } from "@/lib/nav";

interface SidebarProps {
  tree: NavNode[];
  isOpen: boolean;
}

function FolderNode({ node, depth }: { node: NavFolder; depth: number }) {
  const [open, setOpen] = useState(depth < 2); // auto-expand first two levels

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
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-grey-700)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
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
        {node.name}
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
  const href = `/view/${node.path}`;
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        style={{
          display: "block",
          padding: `0.3rem ${0.75 + depth * 0.75}rem`,
          fontSize: "0.875rem",
          color: isActive ? "var(--color-grey-900)" : "var(--color-grey-700)",
          fontWeight: isActive ? 600 : 400,
          textDecoration: "none",
          borderLeft: isActive ? "3px solid var(--color-yellow)" : "3px solid transparent",
          background: isActive ? "var(--color-grey-100)" : "transparent",
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
  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minHeight: "calc(100vh - var(--nav-height))",
        background: "var(--color-white)",
        borderRight: "1px solid var(--color-grey-300)",
        overflowY: "auto",
        flexShrink: 0,
        // Mobile: overlay
        position: "sticky" as const,
        top: "var(--nav-height)",
        maxHeight: "calc(100vh - var(--nav-height))",
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
    </aside>
  );
}
