-- Run this once in the Supabase SQL editor to set up the comments table.

CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path    TEXT NOT NULL,
  anchor       TEXT,
  parent_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_file_path_idx ON comments(file_path);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);

-- Row-level security: the app uses the service role key server-side,
-- so RLS is disabled. Enable it if you ever expose the anon key.
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
