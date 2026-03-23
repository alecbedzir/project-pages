import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree, getFileContent } from "@/lib/github";
import { buildNavTree } from "@/lib/nav";
import { renderMarkdown } from "@/lib/markdown";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import MarkdownView from "@/components/FileView/MarkdownView";
import CsvView from "@/components/FileView/CsvView";
import ImageView from "@/components/FileView/ImageView";
import DownloadButton from "@/components/DownloadButton";
import CommentPanel from "@/components/Comments/CommentPanel";
import ConfigError from "@/components/ConfigError";

type Props = { params: Promise<{ path: string[] }> };

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const MD_EXTS = new Set(["md", "mdx"]);

export default async function ViewPage({ params }: Props) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) redirect("/auth/signin");

  const { path: segments } = await params;
  const filePath = segments.map(decodeURIComponent).join("/");

  const repo = process.env.DOCS_REPO ?? "the configured repository";
  let filteredTree: Awaited<ReturnType<typeof getFilteredTree>>;
  try {
    filteredTree = await getFilteredTree();
  } catch {
    return <ConfigError repo={repo} />;
  }
  const { entries, config } = filteredTree;
  const nav = buildNavTree(entries);

  const entry = entries.find((e) => e.path === filePath);
  if (!entry) notFound();

  const file = await getFileContent(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const fileName = filePath.split("/").pop() ?? filePath;
  const rawBuffer = Buffer.from(file.content, "base64");

  let content: React.ReactNode;
  let showComments = true;

  if (MD_EXTS.has(ext)) {
    const raw = rawBuffer.toString("utf-8");
    const html = await renderMarkdown(raw);
    content = <MarkdownView html={html} filePath={filePath} />;
  } else if (ext === "csv") {
    const raw = rawBuffer.toString("utf-8");
    content = <CsvView rawCsv={raw} />;
  } else if (IMAGE_EXTS.has(ext)) {
    content = (
      <ImageView
        src={`/api/download?path=${encodeURIComponent(filePath)}`}
        alt={fileName}
      />
    );
  } else {
    // Generic file: metadata + download only
    showComments = false;
    content = (
      <div
        style={{
          background: "var(--color-grey-100)",
          border: "1px solid var(--color-grey-300)",
          borderRadius: "6px",
          padding: "1.5rem",
          maxWidth: "480px",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, marginBottom: "0.25rem" }}>{fileName}</p>
        <p style={{ margin: "0 0 0.25rem", color: "var(--color-grey-700)", fontSize: "0.875rem" }}>
          {(file.size / 1024).toFixed(1)} KB
        </p>
        {file.lastCommit && (
          <p style={{ margin: "0 0 1rem", color: "var(--color-grey-700)", fontSize: "0.875rem" }}>
            Last updated {new Date(file.lastCommit.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} by {file.lastCommit.author}
          </p>
        )}
        <p style={{ margin: "0 0 1.5rem", color: "var(--color-grey-500)", fontSize: "0.875rem" }}>
          Preview not available for this file type.
        </p>
        <DownloadButton filePath={filePath} />
      </div>
    );
  }

  const breadcrumbs = filePath.split("/");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav siteTitle={config.site.title} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar tree={nav} isOpen={true} />

        <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto", minWidth: 0 }}>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: "1.25rem", fontSize: "0.875rem", color: "var(--color-grey-500)" }}>
            <a href="/" style={{ color: "var(--color-grey-700)", textDecoration: "none" }}>Home</a>
            {breadcrumbs.map((part, i) => {
              const href = "/view/" + breadcrumbs.slice(0, i + 1).join("/");
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i}>
                  <span style={{ margin: "0 0.35rem" }}>/</span>
                  {isLast ? (
                    <span style={{ color: "var(--color-grey-900)", fontWeight: 500 }}>{part}</span>
                  ) : (
                    <a href={href} style={{ color: "var(--color-grey-700)", textDecoration: "none" }}>{part}</a>
                  )}
                </span>
              );
            })}
          </nav>

          {/* File metadata bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>{fileName}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              {file.lastCommit && (
                <span style={{ fontSize: "0.8125rem", color: "var(--color-grey-500)" }}>
                  Updated {new Date(file.lastCommit.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {file.lastCommit.author}
                </span>
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <DownloadButton filePath={filePath} />
                {showComments && (
                  <DownloadButton filePath={filePath} withComments label="Download with comments" />
                )}
              </div>
            </div>
          </div>

          {content}
        </main>

        {showComments && <CommentPanel filePath={filePath} />}
      </div>
    </div>
  );
}
