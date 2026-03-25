"use client";

import { useMemo, useState } from "react";

interface Cue {
  index: number;
  start: string;
  end: string;
  text: string;
}

function parseSrt(raw: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = raw.trim().replace(/\r\n/g, "\n").split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    // First line may be the cue index (a number)
    let timeLine: string | undefined;
    let textStart: number;

    if (/^\d+$/.test(lines[0].trim())) {
      timeLine = lines[1];
      textStart = 2;
    } else if (lines[0].includes("-->")) {
      timeLine = lines[0];
      textStart = 1;
    } else {
      continue;
    }

    const match = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3})/
    );
    if (!match) continue;

    cues.push({
      index: cues.length + 1,
      start: match[1].replace(",", "."),
      end: match[2].replace(",", "."),
      text: lines.slice(textStart).join("\n"),
    });
  }

  return cues;
}

function parseVtt(raw: string): Cue[] {
  const cues: Cue[] = [];
  // Strip the WEBVTT header and any metadata before the first blank line pair
  const body = raw.replace(/\r\n/g, "\n").replace(/^WEBVTT[^\n]*\n(?:.*\n)*?\n/, "\n");
  const blocks = body.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    let timeLine: string | undefined;
    let textStart: number;

    // Cue identifier (optional) is a line that doesn't contain "-->"
    if (!lines[0].includes("-->") && lines[1]?.includes("-->")) {
      timeLine = lines[1];
      textStart = 2;
    } else if (lines[0].includes("-->")) {
      timeLine = lines[0];
      textStart = 1;
    } else {
      continue;
    }

    const match = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}\.\d{3})/
    );
    if (!match) continue;

    cues.push({
      index: cues.length + 1,
      start: match[1],
      end: match[2],
      text: lines
        .slice(textStart)
        .join("\n")
        .replace(/<[^>]+>/g, ""), // strip VTT formatting tags like <b>, <i>
    });
  }

  return cues;
}

interface SubtitleViewProps {
  raw: string;
  format: "vtt" | "srt";
}

export default function SubtitleView({ raw, format }: SubtitleViewProps) {
  const cues = useMemo(
    () => (format === "vtt" ? parseVtt(raw) : parseSrt(raw)),
    [raw, format]
  );
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return cues;
    const q = filter.toLowerCase();
    return cues.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.start.includes(q) ||
        c.end.includes(q)
    );
  }, [cues, filter]);

  if (!cues.length) {
    return (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: "0.8125rem",
          color: "var(--color-grey-700)",
          background: "var(--color-grey-100)",
          padding: "1rem",
          borderRadius: "6px",
        }}
      >
        {raw}
      </pre>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <input
          type="search"
          placeholder="Filter cues…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid var(--color-grey-300)",
            borderRadius: "4px",
            fontSize: "0.9375rem",
            width: "260px",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-yellow)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-grey-300)")}
        />
        <span style={{ fontSize: "0.875rem", color: "var(--color-grey-500)" }}>
          {filtered.length} of {cues.length} cues
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8125rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: 600,
                  padding: "0.5rem 0.75rem",
                  borderBottom: "2px solid var(--color-grey-300)",
                  background: "var(--color-grey-100)",
                  whiteSpace: "nowrap",
                  width: "3rem",
                }}
              >
                #
              </th>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: 600,
                  padding: "0.5rem 0.75rem",
                  borderBottom: "2px solid var(--color-grey-300)",
                  background: "var(--color-grey-100)",
                  whiteSpace: "nowrap",
                  width: "10rem",
                }}
              >
                Start
              </th>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: 600,
                  padding: "0.5rem 0.75rem",
                  borderBottom: "2px solid var(--color-grey-300)",
                  background: "var(--color-grey-100)",
                  whiteSpace: "nowrap",
                  width: "10rem",
                }}
              >
                End
              </th>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: 600,
                  padding: "0.5rem 0.75rem",
                  borderBottom: "2px solid var(--color-grey-300)",
                  background: "var(--color-grey-100)",
                }}
              >
                Text
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cue) => (
              <tr
                key={cue.index}
                style={{ borderBottom: "1px solid var(--color-grey-200)" }}
              >
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    color: "var(--color-grey-500)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cue.index}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "var(--color-grey-700)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cue.start}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "var(--color-grey-700)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cue.end}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {cue.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
