"use client";

import { useState } from "react";

interface CommentFormProps {
  filePath: string;
  anchor?: string | null;
  parentId?: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  filePath,
  anchor,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "Write a comment…",
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: filePath,
          anchor: anchor ?? null,
          parent_id: parentId ?? null,
          body,
          author_name: name,
          author_email: email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to post comment");
      }

      setBody("");
      setName("");
      setEmail("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.45rem 0.65rem",
    border: "1px solid var(--color-grey-300)",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Your name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <textarea
        placeholder={placeholder}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.8125rem", margin: 0 }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.4rem 1rem",
            background: "var(--color-yellow)",
            color: "var(--color-grey-900)",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Posting…" : "Post comment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.4rem 0.75rem",
              background: "none",
              border: "1px solid var(--color-grey-300)",
              borderRadius: "4px",
              fontSize: "0.875rem",
              cursor: "pointer",
              color: "var(--color-grey-700)",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
