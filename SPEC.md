# Vaimo Pages — Product Specification

**Version:** 0.1 (draft)
**Date:** 2026-03-23
**Status:** Pre-implementation

---

## 1. Overview

Vaimo Pages is a Next.js web application that reads a private GitHub repository and exposes a curated subset of its contents as a clean, branded documentation and collaboration site. It is aimed at small internal teams who are not accustomed to GitHub's interface.

The application is fully decoupled from the documentation repository it serves. The documentation repository declares how it wants to be presented through a single config file (`vaimopages.config`). The Next.js app is deployed independently on Vercel and reads that config at build time and/or at runtime via the GitHub API.

### 1.1 Core Goals

| Goal | Detail |
|---|---|
| Human-friendly interface | Non-technical colleagues can browse, read, and download files without touching GitHub |
| Curated exposure | A lightweight config controls which files/folders are visible — the rest stays hidden |
| Collaboration | Threaded comments on files, downloadable with the document |
| Branded | Vaimo visual identity (grey palette, yellow accent, clean typography) |
| Low-ops | Deployable to Vercel, auto-updates on repo push, no custom infrastructure required |

### 1.2 Non-Goals (v1)

- Full-text search
- Branch switching (always reads `main`)
- Role-based access control beyond the `@vaimo.com` domain restriction
- Real-time collaborative editing
- Custom domain per project (single deployment)

---

## 2. System Architecture

```
┌─────────────────────────────────┐        ┌────────────────────────────┐
│   Documentation Repository      │        │   Vaimo Pages (Next.js)    │
│   (private GitHub repo)         │        │   (separate GitHub repo)   │
│                                 │        │                            │
│   /docs/                        │  GitHub│   /app/                    │
│   /reports/                     │  API   │   /components/             │
│   /images/                      │◄──────►│   /lib/github.ts           │
│   vaimopages.config             │        │   /lib/supabase.ts         │
│                                 │  Push  │   /pages/api/              │
│                                 │ event  │                            │
└────────────────┬────────────────┘        └──────────┬─────────────────┘
                 │ webhook                            │
                 │                         ┌──────────▼─────────┐
                 └────────────────────────►│   Vercel            │
                                           │   (redeploy)        │
                                           └──────────┬──────────┘
                                                      │
                                        ┌─────────────▼──────────────┐
                                        │   Supabase (free tier)      │
                                        │   comments + threads        │
                                        └────────────────────────────┘
```

### 2.1 Key Design Decisions

- **Next.js App Router** — used throughout. Server Components for content rendering, Client Components only where interactivity is required (comments, table sorting).
- **GitHub API (REST)** — all file content is fetched via the GitHub API using a personal access token stored in Vercel environment variables. No git clone.
- **Supabase** — stores comments and threads. The Supabase client is initialised only in API routes (never in browser code) to keep the service role key server-side.
- **NextAuth.js** — handles Google OAuth and enforces the `@vaimo.com` domain restriction at the session callback level.
- **Config resolution** — `vaimopages.config` is fetched from the docs repo at startup. Its contents determine what the sidebar and routing expose.

---

## 3. Repository Relationship

| Repository | Contents | Who owns it |
|---|---|---|
| `vaimo/vaimo-pages` | The Next.js application code | Vaimo Pages developers |
| `vaimo/<docs-repo>` | Documentation files (CSV, Markdown, images, etc.) and `vaimopages.config` | Documentation team |

The two repos are completely independent. Vaimo Pages does not need to be a submodule or have any structural relationship to the docs repo. The only coupling is:

1. A GitHub personal access token in Vaimo Pages' Vercel env vars that grants read access to the docs repo.
2. A GitHub webhook in the docs repo that points at the Vaimo Pages Vercel deploy hook URL.

---

## 4. `vaimopages.config`

This file lives at the **root** of the documentation repository. It is the single source of truth for what Vaimo Pages exposes and how.

### 4.1 Format

YAML (`.yaml` extension optional; the app also accepts `.json`).

```yaml
# vaimopages.config
site:
  title: "Vaimo — Project Docs"
  description: "Internal documentation for the Acme project"

source:
  repo: "vaimo/my-docs-repo"   # GitHub owner/repo
  branch: "main"               # always main; included for explicitness

auth:
  sessionDurationDays: 14     # how long a successful login lasts (default: 7)

include:
  - "docs/**"
  - "reports/**"
  - "assets/images/**"

exclude:
  - "docs/internal/**"
  - "reports/draft-*.csv"
  - "**/*.env"
  - ".github/**"
```

### 4.2 Config Fields

| Field | Required | Description |
|---|---|---|
| `site.title` | Yes | Displayed in the browser tab and top nav |
| `site.description` | No | Subtitle shown on the home/index page |
| `source.repo` | Yes | `owner/repo` string identifying the docs repo |
| `source.branch` | No | Defaults to `main` |
| `auth.sessionDurationDays` | No | Session lifetime in days after a successful passphrase login. Defaults to `7`. |
| `include` | Yes | Glob patterns. Only matching paths are exposed. Evaluated before `exclude`. |
| `exclude` | No | Glob patterns. Matching paths are hidden even if they matched `include`. |

### 4.3 Path Resolution Rules

1. Patterns are standard glob patterns (same syntax as `.gitignore`).
2. `include` is evaluated first; a file must match at least one `include` pattern to be considered.
3. `exclude` is then applied; any file matching an `exclude` pattern is removed regardless of `include`.
4. The resulting set of paths forms the complete visible file tree.
5. Empty directories (after filtering) are not shown in the sidebar.

---

## 5. Authentication

### 5.1 Provider

**Shared passphrase** via NextAuth.js `Credentials` provider. Google OAuth is deferred to a future version.

Any visitor who enters the correct passphrase is granted a session. There is no per-user identity — all authenticated users are treated equally.

### 5.2 Passphrase Storage

The passphrase is stored in the `AUTH_PASSPHRASE` environment variable on Vercel. It is **never** stored in the docs repo or in `vaimopages.config`.

Comparison is done server-side only, inside the NextAuth credentials handler. The passphrase is never sent to the client.

### 5.3 Session Duration

Session lifetime is read from `vaimopages.config`:

```yaml
auth:
  sessionDurationDays: 14   # how long a successful login lasts
```

If omitted, defaults to 7 days. The value is applied to the NextAuth `session.maxAge` option (in seconds) at startup.

### 5.4 Session Storage

Sessions use the JWT strategy (no database required). The token is stored in a secure, HTTP-only cookie.

### 5.5 Protected Routes

All routes except `/api/auth/**` and `/auth/error` require a valid session. Unauthenticated requests are redirected to `/auth/signin`, which shows a single passphrase input form.

---

## 6. Content Rendering

### 6.1 File Types and Rendering

| Extension | Rendering |
|---|---|
| `.md`, `.mdx` | Rendered as HTML via `remark` + `rehype` pipeline. Supports GFM (tables, task lists, strikethrough). Code blocks get syntax highlighting. |
| `.csv` | Rendered as a sortable, filterable table (client-side, via TanStack Table). All columns sortable. A search input filters rows client-side. |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` | Displayed inline as a full-width image with a download button below. |
| All other types | Shown as a file detail page with file metadata (name, size, last commit message, last updated date) and a prominent download button. No preview. |

### 6.2 File Metadata

Each file page shows:
- File name and path (breadcrumb)
- Last commit message that touched this file
- Last updated date (from GitHub commit history)
- Author of the last commit
- File size
- Download button

### 6.3 Markdown Rendering Details

- Headings in the rendered markdown automatically generate anchor links.
- External links open in a new tab.
- Images referenced in markdown are proxied through a Next.js API route so they respect the GitHub token (for private repos).
- Footnote-style comment references (see Section 8.3) are injected at render time when comments exist.

---

## 7. Navigation

### 7.1 Layout

The application uses a two-column layout:

```
┌─────────────────────────────────────────────────────┐
│  [Vaimo Logo]   Site Title                [User avatar / Sign out] │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  Sidebar     │  Content Area                        │
│  (nav tree)  │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### 7.2 Sidebar Navigation

- Built from the filtered file tree returned by the config's `include`/`exclude` rules.
- Folder names are shown as collapsible groups.
- Files are listed as links within their group.
- The currently active file is highlighted.
- On mobile, the sidebar collapses to a hamburger menu.

### 7.3 Home / Index Page

If the docs repo contains a `README.md` or an `index.md` at the root (or within the included paths), it is rendered as the landing page. Otherwise, the landing page shows a list of all exposed top-level folders and files as cards.

---

## 8. Commenting System

### 8.1 Storage

Comments are stored in **Supabase** (PostgreSQL, free tier). The Supabase project is managed separately and its credentials are stored in Vercel environment variables.

### 8.2 Data Model

```sql
-- Files are identified by their path within the docs repo
-- No foreign-key to a files table; file identity is a string path

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path   TEXT NOT NULL,          -- e.g. "docs/overview.md"
  anchor      TEXT,                   -- paragraph/line anchor (see 8.4)
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,          -- from Google profile
  author_email TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON comments(file_path);
CREATE INDEX ON comments(parent_id);
```

`parent_id IS NULL` means a top-level comment. `parent_id` set to another comment's `id` means it is a reply (one level of threading is sufficient for v1; deeper nesting is stored but rendered flat).

### 8.3 Comment Anchors

Comments are anchored to a specific block in the document:

- **Markdown files**: anchored to a heading ID or a paragraph index (e.g. `p-3` for the third paragraph).
- **CSV files**: anchored to a row number (e.g. `row-12`).
- **Image / binary files**: no anchor (comments attach to the file as a whole).

Users select the anchor by highlighting or clicking a paragraph/heading/row before clicking "Add comment". The anchor is stored as a string in `comments.anchor`.

### 8.4 Comment UI

- Comments appear in a panel on the right side of the content area (desktop) or below the content (mobile).
- Top-level comments are grouped by anchor. Each group shows which paragraph/row they belong to.
- Replies are indented under their parent.
- Signed-in users may post new top-level comments or reply to any existing comment.
- A user may edit or delete their own comments.

### 8.5 Download Document with Comments

Every file page has a **"Download with comments"** button. When clicked, the API generates a download of the file with comments embedded as footnotes:

**Markdown files** — the rendered output is:

```
# Document Title

Some content here.[¹] Another paragraph.[²]

---

## Comments

¹ **Comment on:** "Some content here"
  **John Doe** — 2026-01-15
  This is John's observation about this paragraph.

  ↳ **Jane Smith** — 2026-01-16
    Reply to John's comment.

  ↳ **John Doe** — 2026-01-17
    John's response to Jane.

² **Comment on:** row / paragraph identifier
  **Alice Cooper** — 2026-01-20
  Alice's remark.
```

**CSV files** — downloaded as CSV with an appended sheet (or, since CSV is a single table, as a second section after a blank row separator) listing row number, author, date, and comment body.

**Images / other files** — downloaded as-is with a separate `.comments.md` sidecar file in the same ZIP archive.

The download is generated server-side by a Next.js API route. No file is stored; it is streamed on the fly.

---

## 9. File Downloads

Every file in the application has a download button regardless of type. Downloads are proxied through a Next.js API route (`/api/download?path=...`) that:

1. Verifies the user has a valid session.
2. Verifies the requested path is within the allowed set (i.e. not excluded by config).
3. Fetches the raw file content from the GitHub API using the server-side token.
4. Streams it to the browser with the correct `Content-Disposition` and `Content-Type` headers.

This ensures that:
- The GitHub token is never exposed to the browser.
- Excluded files cannot be downloaded even if their path is known.

---

## 10. API Routes

All API routes are implemented as Next.js Route Handlers under `/app/api/`. All routes except auth callbacks require a valid NextAuth session.

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handler (Google OAuth) |
| `/api/content/tree` | GET | Returns the filtered file tree from the docs repo |
| `/api/content/file` | GET | `?path=` Returns file metadata + content from GitHub |
| `/api/download` | GET | `?path=` Streams raw file from GitHub |
| `/api/download/with-comments` | GET | `?path=` Streams file + embedded comments |
| `/api/comments` | GET | `?path=` Returns all comments for a file |
| `/api/comments` | POST | Creates a new comment |
| `/api/comments/[id]` | PATCH | Updates own comment |
| `/api/comments/[id]` | DELETE | Deletes own comment |
| `/api/webhook/github` | POST | Receives GitHub push event, triggers Vercel redeploy |

### 10.1 GitHub Webhook Handler

The `/api/webhook/github` route:

1. Validates the `X-Hub-Signature-256` header using the webhook secret stored in env vars.
2. On a valid `push` event targeting the `main` branch, calls the Vercel Deploy Hook URL (also stored in env vars).
3. Returns `200 OK` immediately.

---

## 11. Environment Variables

All secrets are stored in Vercel project environment variables. Never committed to source control.

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Personal access token with `repo` (read) scope for the docs repo |
| `GITHUB_WEBHOOK_SECRET` | Secret shared with the GitHub webhook for signature validation |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | Production URL of the Vaimo Pages deployment (e.g. `https://vaimopages.vercel.app`) |
| `AUTH_PASSPHRASE` | Shared passphrase granting access to the site (Google OAuth deferred to v2) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never exposed to browser) |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel deploy hook URL, called when docs repo receives a push |
| `DOCS_REPO` | `owner/repo` of the documentation repository (e.g. `vaimo/my-docs`) |

---

## 12. Branding & Design

### 12.1 Vaimo Brand Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-grey-900` | `#1a1a1a` | Body text (never pure black) |
| `--color-grey-700` | `#404040` | Secondary text, labels |
| `--color-grey-300` | `#c8c8c8` | Borders, dividers |
| `--color-grey-100` | `#f2f2f2` | Page background, sidebar background |
| `--color-yellow` | `#f5c400` | Accent — CTAs, active nav item indicator, highlights |
| `--color-white` | `#ffffff` | Content area background, card backgrounds |

### 12.2 Typography

- **Font family**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) unless the Vaimo brand font is available. Apply the brand font if licensed.
- **Base size**: 16px.
- **Headings**: Semi-bold, dark grey (`--color-grey-900`).
- **Body**: Regular, `--color-grey-900`.
- **Code**: Monospace (`ui-monospace, 'Cascadia Code', 'Fira Mono', monospace`), displayed on a light grey background.

### 12.3 Layout Principles

- Generous whitespace; no cramped layouts.
- Max content width: 800px for text-heavy pages, full-width for CSV tables.
- Sidebar: 260px fixed width on desktop, full-screen overlay on mobile.
- No drop shadows; use borders (`1px solid --color-grey-300`) for separation.
- Yellow accent used **sparingly**: active nav link left border, primary button background, focus ring.

### 12.4 Logo

The Vaimo logo (SVG) is served as a static asset from `/public/vaimo-logo.svg`. Both a full-colour and a white variant are included. The header uses the full-colour variant on light backgrounds.

---

## 13. Deployment

### 13.1 Vercel Project Setup

1. Connect the `vaimo/vaimo-pages` GitHub repo to a Vercel project.
2. Set all environment variables listed in Section 11.
3. The app builds on every push to `main` of the Vaimo Pages repo.
4. It also builds when the docs repo pushes to its `main` branch (via the Vercel deploy hook triggered by the webhook handler).

### 13.2 Vercel Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "regions": ["arn1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### 13.3 Content Caching

GitHub API responses for file content are cached using Next.js `fetch` cache with a short revalidation period (e.g. 60 seconds) as a safety net. The primary update mechanism is the webhook-triggered redeploy, which clears all caches.

---

## 14. Project Structure

```
vaimo-pages/
├── app/
│   ├── layout.tsx              # Root layout with sidebar + top nav
│   ├── page.tsx                # Home / index page
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── error/page.tsx
│   ├── view/
│   │   └── [...path]/page.tsx  # Dynamic route for any file path
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── content/
│       │   ├── tree/route.ts
│       │   └── file/route.ts
│       ├── download/
│       │   ├── route.ts
│       │   └── with-comments/route.ts
│       ├── comments/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── webhook/
│           └── github/route.ts
├── components/
│   ├── Sidebar.tsx
│   ├── TopNav.tsx
│   ├── FileView/
│   │   ├── MarkdownView.tsx
│   │   ├── CsvView.tsx
│   │   └── ImageView.tsx
│   ├── Comments/
│   │   ├── CommentPanel.tsx
│   │   ├── CommentThread.tsx
│   │   └── CommentForm.tsx
│   └── DownloadButton.tsx
├── lib/
│   ├── github.ts               # GitHub API client + config loader
│   ├── supabase.ts             # Supabase server client
│   ├── config.ts               # vaimopages.config parser + glob filter
│   └── auth.ts                 # NextAuth config
├── styles/
│   └── globals.css             # CSS custom properties (brand tokens)
├── public/
│   ├── vaimo-logo.svg
│   └── vaimo-logo-white.svg
├── SPEC.md                     # This document
├── .env.local.example
├── vercel.json
└── package.json
```

---

## 15. Key Dependencies

| Package | Purpose |
|---|---|
| `next` | Framework |
| `next-auth` | Google OAuth + session management |
| `@octokit/rest` | GitHub REST API client |
| `@supabase/supabase-js` | Supabase client |
| `remark` + `rehype` | Markdown → HTML pipeline |
| `rehype-highlight` | Syntax highlighting in code blocks |
| `remark-gfm` | GitHub Flavored Markdown support |
| `@tanstack/react-table` | CSV sortable/filterable table |
| `micromatch` | Glob pattern matching for config include/exclude |
| `js-yaml` | YAML parsing for `vaimopages.config` |
| `gray-matter` | Front-matter parsing (optional, for future per-file metadata) |

---

## 16. Open Questions / Future Considerations

These are out of scope for v1 but should be kept in mind during implementation to avoid painted-in corners:

- **Multiple docs repos**: The architecture supports pointing at only one docs repo. If multiple repos are needed, the simplest path is multiple Vaimo Pages deployments, each with its own `DOCS_REPO` env var.
- **Per-file access control**: The current design is all-or-nothing per domain. Fine-grained file-level permissions could be added to `vaimopages.config` later.
- **Comment reactions**: Emoji reactions on comments (👍 etc.) are a natural v2 addition to Supabase without schema changes beyond a `reactions` table.
- **Full-text search**: Client-side search over the exposed file tree using a library like `flexsearch` — excluded from v1.
- **Netlify support**: The Next.js app is framework-agnostic. Netlify compatibility requires replacing the Vercel deploy hook with a Netlify build hook, and ensuring no Vercel-specific features are used.
- **Custom navigation ordering**: The config could be extended with an explicit `nav` section allowing manual ordering and renaming of sidebar items without renaming files.
