# Architecture

## System Overview

```
┌─────────────────────────────────┐        ┌────────────────────────────┐
│   Documentation Repository      │        │   Project Pages (Next.js)    │
│   (private GitHub repo)         │        │   (separate GitHub repo)   │
│                                 │        │                            │
│   /docs/                        │  GitHub│   /app/                    │
│   /reports/                     │  API   │   /components/             │
│   /images/                      │◄──────►│   /lib/github.ts           │
│   projectpages.config           │        │   /lib/supabase.ts         │
│                                 │  Push  │   /app/api/                │
│   (multiple branches)           │ event  │                            │
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

## Key Design Decisions

- **Next.js App Router** — Server Components for content rendering, Client Components only where interactivity is required (comments, table sorting).
- **GitHub API (REST)** — all file content is fetched via the GitHub API using a personal access token stored in Vercel environment variables. No `git clone`.
- **Supabase** — stores comments. The client is initialised only in API routes (never in browser code) to keep the service role key server-side.
- **NextAuth.js** — handles passphrase authentication. The matched branch name is stored in the JWT session, so subsequent requests know which branch to fetch content from.
- **Config resolution** — `projectpages.config` is fetched from the docs repo's default branch on every request (with a 60-second in-memory cache). Its `branches` list controls authentication and what content is exposed.

## Repository Relationship

| Repository | Contents | Who owns it |
|---|---|---|
| `vaimo/project-pages` | The Next.js application code | Project Pages developers |
| `vaimo/<docs-repo>` | Documentation files and `projectpages.config` | Documentation team |

The two repos are completely independent. The only coupling is:

1. A GitHub personal access token in Project Pages' Vercel env vars that grants read access to the docs repo.
2. A GitHub webhook in the docs repo that points at the Project Pages Vercel deploy hook URL.

## Branch-Based Content Model

The docs repository can have multiple Git branches, each representing a different audience:

```
docs-repo/
├── master       ← full internal content
├── client       ← curated content for the client
└── external     ← content for external partners
```

Each branch is protected by a passphrase defined in `projectpages.config`. When a user authenticates, the matching branch name is stored in their session. All subsequent content requests (file tree, file content, downloads, comments) are scoped to that branch.

`projectpages.config` itself is always read from the repository's default branch (GitHub API default, no ref specified).

## Request Flow

```
User enters passphrase
  └──▶ POST /api/auth/...nextauth
         ├── reads projectpages.config from docs repo default branch
         ├── finds matching branch by passphrase
         └── stores branchName in JWT session cookie

Authenticated request (e.g. file view)
  └──▶ GET /api/content/file?path=docs/overview.md
         ├── reads branchName from session JWT
         ├── calls GitHub API: GET /repos/.../contents/... ?ref=<branchName>
         └── returns file content
```
