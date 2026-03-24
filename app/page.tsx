import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree, getFileContent } from "@/lib/github";
import { buildNavTree } from "@/lib/nav";
import { renderMarkdown } from "@/lib/markdown";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import MarkdownView from "@/components/FileView/MarkdownView";
import CommentPanel from "@/components/Comments/CommentPanel";
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

  // Look for a root-level README (case-insensitive, md or mdx)
  const readmeEntry = entries.find((e) => /^readme\.(md|mdx)$/i.test(e.path));

  let mainContent: React.ReactNode;
  const commentsEnabled = config.comments.enabled;

  if (readmeEntry) {
    const file = await getFileContent(readmeEntry.path);
    const raw = Buffer.from(file.content, "base64").toString("utf-8");
    const html = await renderMarkdown(raw, readmeEntry.path);
    mainContent = <MarkdownView html={html} filePath={readmeEntry.path} commentsEnabled={commentsEnabled} />;
  } else {
    mainContent = (
      <p style={{ color: "var(--color-grey-400)", fontSize: "0.9375rem" }}>
        Select a file from the left navigation to get started.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav siteTitle={config.site.title} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar tree={nav} isOpen={true} />

        <main
          style={{
            flex: 1,
            padding: "1.5rem 2rem",
            overflowY: "auto",
            minWidth: 0,
            ...(readmeEntry ? {} : {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }),
          }}
        >
          {mainContent}
        </main>

        {readmeEntry && commentsEnabled && (
          <CommentPanel filePath={readmeEntry.path} />
        )}
      </div>
    </div>
  );
}
