import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree, getRawFileBuffer } from "@/lib/github";
import mime from "mime";

export async function GET(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    const { entries } = await getFilteredTree(session.branchName);
    const allowed = new Set(entries.map((e) => e.path));
    if (!allowed.has(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { buffer, name } = await getRawFileBuffer(filePath, session.branchName);
    const contentType = mime.getType(name) ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("download error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
