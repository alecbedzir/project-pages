"use client";

interface DownloadButtonProps {
  filePath: string;
  withComments?: boolean;
  withMedia?: boolean;
  label?: string;
}

export default function DownloadButton({ filePath, withComments = false, withMedia = false, label }: DownloadButtonProps) {
  const endpoint = withComments
    ? "/api/download/with-comments"
    : withMedia
    ? "/api/download/with-media"
    : "/api/download";
  const href = `${endpoint}?path=${encodeURIComponent(filePath)}`;
  const defaultLabel = withComments ? "Download with comments" : withMedia ? "Download with media" : "Download";

  return (
    <a
      href={href}
      download
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.45rem 1rem",
        background: withComments ? "var(--color-grey-900)" : "var(--color-yellow)",
        color: withComments ? "var(--color-white)" : "var(--color-grey-900)",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.875rem",
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 1v7.586l2.293-2.293 1.414 1.414L7 11.414l-3.707-3.707 1.414-1.414L7 8.586V1h0z" />
        <path d="M1 11h2v1h8v-1h2v2H1v-2z" />
      </svg>
      {label ?? defaultLabel}
    </a>
  );
}
