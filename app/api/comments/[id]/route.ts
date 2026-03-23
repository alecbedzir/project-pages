import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth";
import { updateComment, deleteComment } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { body, author_email } = await req.json();

  if (!body || !author_email) {
    return NextResponse.json({ error: "body and author_email are required" }, { status: 400 });
  }

  try {
    const updated = await updateComment(id, author_email, body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH comment error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(await buildAuthOptions());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { author_email } = await req.json();

  if (!author_email) {
    return NextResponse.json({ error: "author_email is required" }, { status: 400 });
  }

  try {
    await deleteComment(id, author_email);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE comment error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
