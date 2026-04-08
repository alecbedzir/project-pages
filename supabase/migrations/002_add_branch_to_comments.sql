-- Migration: add branch column to comments table
-- Run this in the Supabase SQL editor after 001_initial_schema.sql.
--
-- Purpose: comments are now scoped per git branch. Each branch in
-- vaimopages.config represents a different audience (e.g. "master",
-- "client"), and comments should be isolated between them.
--
-- Existing rows are assigned to "master" as the default. If your
-- existing comments belong to a different branch, update them manually:
--   UPDATE comments SET branch = 'your-branch' WHERE branch = 'master';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'master';

CREATE INDEX IF NOT EXISTS comments_branch_idx ON comments(branch);
