"use client";

import { useState, useEffect, useCallback } from "react";
import type { Comment } from "@/lib/supabase";
import CommentForm from "./CommentForm";

interface CommentPanelProps {
  filePath: string;
}

interface Thread {
  root: Comment;
  replies: Comment[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ThreadItem({
  thread,
  filePath,
  onRefresh,
}: {
  thread: Thread;
  filePath: string;
  onRefresh: () => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-grey-300)",
        paddingBottom: "1rem",
        marginBottom: "1rem",
      }}
    >
      <CommentItem comment={thread.root} />

      {thread.replies.map((r) => (
        <div key={r.id} style={{ marginLeft: "1.25rem", marginTop: "0.75rem" }}>
          <CommentItem comment={r} />
        </div>
      ))}

      {!replying ? (
        <button
          onClick={() => setReplying(true)}
          style={{
            marginLeft: "1.25rem",
            marginTop: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.8125rem",
            color: "var(--color-grey-700)",
            padding: 0,
          }}
        >
          ↳ Reply
        </button>
      ) : (
        <div style={{ marginLeft: "1.25rem", marginTop: "0.75rem" }}>
          <CommentForm
            filePath={filePath}
            parentId={thread.root.id}
            anchor={thread.root.anchor}
            onSuccess={() => { setReplying(false); onRefresh(); }}
            onCancel={() => setReplying(false)}
            placeholder="Write a reply…"
          />
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.25rem" }}>
        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{comment.author_name}</span>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-grey-500)" }}>
          {formatDate(comment.created_at)}
        </span>
        {comment.anchor && (
          <span
            style={{
              fontSize: "0.75rem",
              background: "var(--color-grey-100)",
              border: "1px solid var(--color-grey-300)",
              borderRadius: "3px",
              padding: "0 0.4rem",
              color: "var(--color-grey-700)",
            }}
          >
            {comment.anchor}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {comment.body}
      </p>
    </div>
  );
}

export default function CommentPanel({ filePath }: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      setComments(data);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Build threads: top-level comments + their replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const threads: Thread[] = topLevel.map((root) => ({
    root,
    replies: comments.filter((c) => c.parent_id === root.id),
  }));

  return (
    <aside
      style={{
        width: "320px",
        flexShrink: 0,
        borderLeft: "1px solid var(--color-grey-300)",
        padding: "1.5rem",
        overflowY: "auto",
        maxHeight: "calc(100vh - var(--nav-height))",
        position: "sticky",
        top: "var(--nav-height)",
        background: "var(--color-white)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700 }}>
          Comments {!loading && `(${comments.length})`}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: "0.35rem 0.75rem",
            background: "var(--color-yellow)",
            color: "var(--color-grey-900)",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "1.25rem" }}>
          <CommentForm
            filePath={filePath}
            onSuccess={() => { setShowForm(false); fetchComments(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-grey-500)", fontSize: "0.875rem" }}>Loading…</p>
      ) : threads.length === 0 ? (
        <p style={{ color: "var(--color-grey-500)", fontSize: "0.875rem" }}>
          No comments yet. Be the first to add one.
        </p>
      ) : (
        threads.map((t) => (
          <ThreadItem
            key={t.root.id}
            thread={t}
            filePath={filePath}
            onRefresh={fetchComments}
          />
        ))
      )}
    </aside>
  );
}
