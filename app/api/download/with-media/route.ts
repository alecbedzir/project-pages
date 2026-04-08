import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree, getRawFileBuffer } from "@/lib/github";
import JSZip from "jszip";
import path from "path";

const MD_EXTS = new Set(["md", "mdx"]);

/** Extracts relative image src values from raw markdown and resolves them against the file's directory. */
function extractImagePaths(markdown: string, filePath: string): string[] {
  const fileDir = filePath.includes("/") ? filePath.slice(0, filePath.lastIndexOf("/")) : "";
  const base = "/" + fileDir;
  const seen = new Set<string>();

  // ![alt](src) — skip http/https and data: URIs
  const mdImg = /!\[[^\]]*\]\((?!https?:\/\/)(?!data:)([^\s)]+)/g;
  // <img src="src"> — same exclusions
  const htmlImg = /<img[^>]+src=["'](?!https?:\/\/)(?!data:)([^\s"']+)/gi;

  for (const regex of [mdImg, htmlImg]) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(markdown)) !== null) {
      const src = m[1].split("?")[0]; // strip query strings
      if (!src) continue;
      const resolved = path.posix.resolve(base, src).slice(1);
      seen.add(resolved);
    }
  }

  return Array.from(seen);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path is required" }, { status: 400 });

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  if (!MD_EXTS.has(ext)) {
    return NextResponse.json({ error: "Only markdown files are supported" }, { status: 400 });
  }

  try {
    const { entries } = await getFilteredTree(session.branchName);
    const allowed = new Set(entries.map((e) => e.path));

    if (!allowed.has(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { buffer: mdBuffer, name: mdName } = await getRawFileBuffer(filePath, session.branchName);
    const rawMarkdown = mdBuffer.toString("utf-8");

    const imagePaths = extractImagePaths(rawMarkdown, filePath).filter((p) => allowed.has(p));

    const zip = new JSZip();
    zip.file(filePath, mdBuffer);

    await Promise.all(
      imagePaths.map(async (imgPath) => {
        try {
          const { buffer } = await getRawFileBuffer(imgPath, session.branchName);
          zip.file(imgPath, buffer);
        } catch {
          // skip images that fail to fetch
        }
      })
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const baseName = mdName.replace(/\.(mdx?)$/, "");
    const zipName = `${baseName}-with-media.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (err) {
    console.error("download/with-media error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
