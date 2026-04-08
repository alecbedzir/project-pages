# Project Structure

```
vaimo-pages/
├── app/
│   ├── layout.tsx                     # Root layout: sidebar + top nav
│   ├── page.tsx                       # Home / index page
│   ├── auth/
│   │   ├── signin/page.tsx            # Passphrase login form
│   │   └── error/page.tsx             # Auth error page
│   ├── view/
│   │   └── [...path]/page.tsx         # Dynamic route for any file path
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── content/
│       │   ├── tree/route.ts          # Filtered file tree for the session branch
│       │   └── file/route.ts          # File metadata + content
│       ├── download/
│       │   ├── route.ts               # Raw file download
│       │   ├── with-comments/route.ts # File + embedded comments
│       │   └── with-media/route.ts    # Markdown + images as ZIP
│       ├── raw/route.ts               # Image proxy (for Markdown inline images)
│       ├── comments/
│       │   ├── route.ts               # GET + POST comments
│       │   └── [id]/route.ts          # PATCH + DELETE comments
│       └── webhook/
│           └── github/route.ts        # GitHub push webhook handler
│
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
│
├── lib/
│   ├── github.ts          # GitHub API client, config loader, file fetching
│   ├── supabase.ts        # Supabase client, comment CRUD
│   ├── config.ts          # vaimopages.config parser + glob filter
│   ├── auth.ts            # NextAuth options (branch-based passphrase auth)
│   ├── nav.ts             # File tree → sidebar nav builder
│   ├── markdown.ts        # Markdown rendering + comment annotation
│   └── docx.ts            # DOCX preview support
│
├── types/
│   └── next-auth.d.ts     # Session type extension (branchName)
│
├── styles/
│   └── globals.css        # CSS custom properties (brand tokens)
│
├── public/
│   ├── vaimo-logo.webp
│   └── vaimo-logo-white.svg
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_branch_to_comments.sql
│
├── docs/                  # This documentation
│
├── vaimopages.config.example   # Config template for knowledge-base repos
├── .env.local.example
├── vercel.json
└── package.json
```

## Key Files

| File | Purpose |
|---|---|
| `lib/config.ts` | Parses `vaimopages.config` YAML; defines `ParsedConfig`, `ParsedBranch` types |
| `lib/github.ts` | All GitHub API calls; accepts `branch` param for per-branch content fetching |
| `lib/auth.ts` | NextAuth options; matches passphrase → branch; stores `branchName` in JWT |
| `lib/supabase.ts` | Comment CRUD; all queries are scoped by `(file_path, branch)` |
| `types/next-auth.d.ts` | Extends `Session` with `branchName: string` |
