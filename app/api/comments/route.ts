import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { getComments, createComment } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path is required" }, { status: 400 });

  try {
    const comments = await getComments(filePath);
    return NextResponse.json(comments);
  } catch (err) {
    console.error("GET comments error:", err);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { file_path, anchor, parent_id, body: commentBody, author_name, author_email } = body;

    if (!file_path || !commentBody || !author_name || !author_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await createComment({
      file_path,
      anchor: anchor ?? null,
      parent_id: parent_id ?? null,
      author_name,
      author_email,
      body: commentBody,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST comment error:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
