"use client";

import { useId, useState, useEffect } from "react";

interface Props {
  code: string;
}

let mermaidReady = false;

export default function MermaidBlock({ code }: Props) {
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(true);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(({ default: mermaid }) => {
      if (!mermaidReady) {
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        mermaidReady = true;
      }
      mermaid
        .render(diagramId, code)
        .then(({ svg }) => { if (!cancelled) setSvg(svg); })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render diagram");
        });
    });

    return () => { cancelled = true; };
  }, [code, diagramId]);

  return (
    <div style={{ position: "relative", margin: "1.5rem 0" }}>
      <button
        onClick={() => setShowDiagram((v) => !v)}
        title={showDiagram ? "Show source" : "Show diagram"}
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          padding: "0.2rem 0.55rem",
          fontSize: "0.75rem",
          background: "var(--color-grey-100)",
          border: "1px solid var(--color-grey-300)",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 1,
          color: "var(--color-grey-700)",
          fontFamily: "inherit",
        }}
      >
        {showDiagram ? "{ } Source" : "⬡ Diagram"}
      </button>

      {showDiagram ? (
        svg ? (
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{
              overflowX: "auto",
              padding: "1.5rem",
              background: "#fafafa",
              border: "1px solid var(--color-grey-300)",
              borderRadius: "6px",
              textAlign: "center",
            }}
          />
        ) : error ? (
          <pre
            style={{
              color: "#c0392b",
              background: "#fdf2f0",
              border: "1px solid #f5c6bc",
              borderRadius: "6px",
              padding: "1rem",
              fontSize: "0.8125rem",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            Mermaid parse error:{"\n"}{error}
          </pre>
        ) : (
          <div
            style={{
              padding: "1.5rem",
              color: "var(--color-grey-500)",
              fontSize: "0.875rem",
              background: "#fafafa",
              border: "1px solid var(--color-grey-300)",
              borderRadius: "6px",
            }}
          >
            Rendering diagram…
          </div>
        )
      ) : (
        <pre
          style={{
            background: "var(--color-grey-100)",
            border: "1px solid var(--color-grey-300)",
            borderRadius: "6px",
            padding: "1rem 1rem 1rem 1rem",
            paddingTop: "2.25rem",
            fontSize: "0.8125rem",
            overflowX: "auto",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
