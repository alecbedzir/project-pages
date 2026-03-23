import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree, getFileContent } from "@/lib/github";
import { buildNavTree } from "@/lib/nav";
import { renderMarkdown } from "@/lib/markdown";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import ConfigError from "@/components/ConfigError";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) redirect("/auth/signin");

  const repo = process.env.DOCS_REPO ?? "the configured repository";
  let filteredTree: Awaited<ReturnType<typeof getFilteredTree>>;
  try {
    filteredTree = await getFilteredTree();
  } catch {
    return <ConfigError repo={repo} />;
  }
  const { entries, config } = filteredTree;
  const nav = buildNavTree(entries);

  // Try to render README.md or index.md as the home page
  let homeHtml: string | null = null;
  const homeCandidates = ["README.md", "readme.md", "index.md", "INDEX.md"];
  for (const candidate of homeCandidates) {
    if (entries.find((e) => e.path === candidate)) {
      try {
        const file = await getFileContent(candidate);
        const raw = Buffer.from(file.content, "base64").toString("utf-8");
        homeHtml = await renderMarkdown(raw);
      } catch {
        // continue to next candidate
      }
      break;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav siteTitle={config.site.title} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar tree={nav} isOpen={true} />
        <main
          style={{
            flex: 1,
            padding: "2rem 2.5rem",
            overflowY: "auto",
          }}
        >
          {homeHtml ? (
            <article
              className="prose"
              dangerouslySetInnerHTML={{ __html: homeHtml }}
            />
          ) : (
            <div>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {config.site.title}
              </h1>
              {config.site.description && (
                <p style={{ color: "var(--color-grey-700)" }}>{config.site.description}</p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginTop: "2rem",
                }}
              >
                {nav.map((node) => (
                  <a
                    key={node.path}
                    href={node.type === "file" ? `/view/${node.path}` : undefined}
                    style={{
                      display: "block",
                      padding: "1.25rem",
                      background: "var(--color-white)",
                      border: "1px solid var(--color-grey-300)",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: "var(--color-grey-900)",
                    }}
                  >
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                      {node.name}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--color-grey-500)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {node.type === "folder" ? "Folder" : node.path.split(".").pop()?.toUpperCase()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
