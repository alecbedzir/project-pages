import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree } from "@/lib/github";
import Link from "next/link";

type Props = { params: Promise<{ path: string[] }> };

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

export default async function GalleryPage({ params }: Props) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) redirect("/auth/signin");

  const { path: segments } = await params;
  const folderPath = segments.map(decodeURIComponent).join("/");

  // getFilteredTree is wrapped with React cache() — no extra network call vs layout
  const { entries } = await getFilteredTree(session.branchName);

  const images = entries.filter((e) => {
    const dir = e.path.includes("/") ? e.path.slice(0, e.path.lastIndexOf("/")) : "";
    const ext = e.path.split(".").pop()?.toLowerCase() ?? "";
    return dir === folderPath && IMAGE_EXTS.has(ext);
  });

  if (images.length === 0) notFound();

  const folderName = folderPath.split("/").pop() ?? folderPath;
  const breadcrumbs = folderPath.split("/");

  return (
    <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto", minWidth: 0 }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "1.25rem", fontSize: "0.875rem", color: "var(--color-grey-500)" }}>
        <span style={{ color: "var(--color-grey-700)" }}>Home</span>
        {breadcrumbs.map((part, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i}>
              <span style={{ margin: "0 0.35rem" }}>/</span>
              <span style={{ color: isLast ? "var(--color-grey-900)" : "var(--color-grey-700)", fontWeight: isLast ? 500 : 400 }}>{part}</span>
            </span>
          );
        })}
      </nav>

      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
        {folderName} — {images.length} image{images.length !== 1 ? "s" : ""}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {images.map((entry) => {
          const name = entry.path.split("/").pop() ?? entry.path;
          const src = `/api/raw?path=${encodeURIComponent(entry.path)}`;
          const viewHref = `/view/${entry.path.split("/").map(encodeURIComponent).join("/")}`;
          return (
            <Link
              key={entry.path}
              href={viewHref}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: "1px solid var(--color-grey-300)",
                  background: "var(--color-grey-100)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={name}
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  title={name}
                  style={{
                    padding: "0.35rem 0.6rem",
                    fontSize: "0.75rem",
                    color: "var(--color-grey-700)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
