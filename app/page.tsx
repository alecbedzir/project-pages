import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree } from "@/lib/github";
import { buildNavTree } from "@/lib/nav";
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav siteTitle={config.site.title} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar tree={nav} isOpen={true} />
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <p style={{ color: "var(--color-grey-400)", fontSize: "0.9375rem" }}>
            Select a file from the left navigation to get started.
          </p>
        </main>
      </div>
    </div>
  );
}
