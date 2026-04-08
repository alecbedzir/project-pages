# Commenting System

## Overview

Comments are stored in **Supabase** (PostgreSQL). They are scoped to a file path **and** a Git branch, so each branch audience sees only its own comments.

Comments are disabled by default. To enable them for a branch, set `comments.enabled: true` in `projectpages.config`:

```yaml
branches:
  - name: client
    passphrase: "..."
    comments:
      enabled: true
```

## Data Model

```sql
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path    TEXT NOT NULL,          -- e.g. "docs/overview.md"
  branch       TEXT NOT NULL,          -- e.g. "master" or "client"
  anchor       TEXT,                   -- paragraph/line anchor (see below)
  parent_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`parent_id IS NULL` = top-level comment. `parent_id` set = reply (one level of threading for v1; deeper nesting stored but rendered flat).

## Comment Anchors

Comments are anchored to a specific block:

- **Markdown**: anchored to a heading ID or paragraph index (e.g. `p-3`).
- **CSV**: anchored to a row number (e.g. `row-12`).
- **Images / binary files**: no anchor (comments attach to the file as a whole).

## Comment UI

- Comments appear in a panel on the right side of the content area (desktop) or below content (mobile).
- Top-level comments are grouped by anchor.
- Replies are indented under their parent.
- Signed-in users may post new comments or reply to any existing comment.
- A user may edit or delete their own comments.

## Download with Comments

Every file page has a **"Download with comments"** button. The API generates a download with comments embedded as footnotes:

**Markdown files:**

```
# Document Title

Some content here.[¹] Another paragraph.[²]

---

## Comments

¹ **Comment on:** "Some content here"
  **John Doe** — 2026-01-15
  Observation about this paragraph.

  ↳ **Jane Smith** — 2026-01-16
    Reply to John's comment.

² **Comment on:** paragraph identifier
  **Alice** — 2026-01-20
  Alice's remark.
```

**CSV files:** downloaded with comments appended after a blank row separator.

**Images / other files:** downloaded as-is with a `.comments.md` sidecar file.

The download is generated server-side and streamed on the fly — no file is stored.

## Database Migrations

Migrations live in [`supabase/migrations/`](../supabase/migrations/). Run them in order in the Supabase SQL editor:

| File | Description |
|---|---|
| `001_initial_schema.sql` | Creates the `comments` table and indexes |
| `002_add_branch_to_comments.sql` | Adds the `branch` column for per-branch comment scoping |
