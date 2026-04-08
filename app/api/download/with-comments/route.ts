import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getConfig, getFilteredTree, getRawFileBuffer } from "@/lib/github";
import { getComments } from "@/lib/supabase";
import { buildAnnotatedMarkdown } from "@/lib/markdown";

export async function GET(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getConfig();
  const branchConfig = config.branches.find((b) => b.name === session.branchName);
  if (!branchConfig?.comments.enabled) {
    return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
  }

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    const { entries } = await getFilteredTree(session.branchName);
    const allowed = new Set(entries.map((e) => e.path));
    if (!allowed.has(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comments = await getComments(filePath, session.branchName);
    const { buffer, name } = await getRawFileBuffer(filePath, session.branchName);

    const ext = name.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "md" || ext === "mdx") {
      const rawText = buffer.toString("utf-8");
      const annotated = buildAnnotatedMarkdown(rawText, comments);
      const baseName = name.replace(/\.(md|mdx)$/, "");
      const outputName = `${baseName}-with-comments.md`;

      return new NextResponse(annotated, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${outputName}"`,
        },
      });
    }

    // For non-markdown files: return original file + sidecar .comments.md as a zip
    // (zip support deferred to a follow-up; for now return original + plain comment list)
    const commentText = comments.length
      ? buildAnnotatedMarkdown("", comments).replace(/^---\n\n/, "")
      : "No comments on this file.\n";
    const commentFile = `${name}.comments.md`;

    // Return a basic text bundle for non-markdown files
    const combined = `# ${name}\n\nOriginal file: see ${name}\n\n${commentText}`;

    return new NextResponse(combined, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${commentFile}"`,
      },
    });
  } catch (err) {
    console.error("download/with-comments error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
