import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFileContent, getFilteredTree } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    // Guard: verify the path is in the allowed set
    const { entries } = await getFilteredTree(session.branchName);
    const allowed = new Set(entries.map((e) => e.path));
    if (!allowed.has(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const file = await getFileContent(filePath, session.branchName);
    return NextResponse.json(file);
  } catch (err) {
    console.error("content/file error:", err);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
