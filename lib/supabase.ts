import { createClient } from "@supabase/supabase-js";

export type Comment = {
  id: string;
  file_path: string;
  branch: string;
  anchor: string | null;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not configured");
  return createClient(url, key);
}

export async function getComments(filePath: string, branch: string): Promise<Comment[]> {
  const { data, error } = await getClient()
    .from("comments")
    .select("*")
    .eq("file_path", filePath)
    .eq("branch", branch)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createComment(
  comment: Omit<Comment, "id" | "created_at" | "updated_at">
): Promise<Comment> {
  const { data, error } = await getClient()
    .from("comments")
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment(
  id: string,
  authorEmail: string,
  body: string
): Promise<Comment> {
  const { data, error } = await getClient()
    .from("comments")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_email", authorEmail) // ownership check
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Comment not found or permission denied");
  return data;
}

export async function deleteComment(id: string, authorEmail: string): Promise<void> {
  const { error } = await getClient()
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_email", authorEmail); // ownership check

  if (error) throw error;
}
