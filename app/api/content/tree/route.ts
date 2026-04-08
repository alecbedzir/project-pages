import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getFilteredTree } from "@/lib/github";
import { buildNavTree } from "@/lib/nav";

export async function GET() {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { entries, config } = await getFilteredTree(session.branchName);
    const nav = buildNavTree(entries);
    return NextResponse.json({ nav, site: config.site });
  } catch (err) {
    console.error("content/tree error:", err);
    return NextResponse.json({ error: "Failed to load file tree" }, { status: 500 });
  }
}
