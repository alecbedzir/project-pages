# Vaimo Pages

A Next.js portal that turns a private GitHub repository into a clean, branded documentation site. Content is fetched live via the GitHub API. Access is controlled by passphrases — each passphrase maps to a Git branch, so different audiences see different content from the same repository.

---

## How it works

1. You define Git branches in your docs repo (e.g. `master`, `client`), one per audience.
2. Each branch gets a passphrase in `vaimopages.config`.
3. A visitor enters their passphrase → the app resolves the matching branch → that branch's content is shown for the lifetime of their session.
4. Push to any branch → GitHub webhook fires → Vercel rebuilds → content is fresh.

```
docs-repo (GitHub)
  ├── master            ← full internal content
  ├── client            ← curated for the client
  └── vaimopages.config ← declares branches, passphrases, file filters

Vaimo Pages (Vercel)
  └── reads config → authenticates → serves the right branch per session
      └── Supabase: per-branch inline comments (optional)
```

---

## Quick start

```bash
cp .env.local.example .env.local
# fill in DOCS_REPO, GITHUB_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL,
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VERCEL_DEPLOY_HOOK_URL,
# GITHUB_WEBHOOK_SECRET
npm install
npm run dev
```

Then add a `vaimopages.config` to your docs repository — copy [`vaimopages.config.example`](./vaimopages.config.example) as a starting point.

---

## Documentation

| Topic | Description |
|---|---|
| [Architecture](./docs/architecture.md) | System diagram, repository relationship, branch-based content model, request flow |
| [Configuration](./docs/configuration.md) | `vaimopages.config` field reference with examples |
| [Authentication](./docs/authentication.md) | Passphrase → branch resolution, JWT sessions, security notes |
| [Content Rendering](./docs/content-rendering.md) | File types, Markdown rendering, navigation layout |
| [Comments](./docs/comments.md) | Per-branch commenting, data model, download with comments |
| [API Routes](./docs/api.md) | All API endpoints with descriptions |
| [Deployment](./docs/deployment.md) | Vercel setup, environment variables, GitHub webhook, Supabase migrations, troubleshooting |
| [Design](./docs/design.md) | Vaimo brand tokens, typography, layout principles |
| [Project Structure](./docs/project-structure.md) | Directory layout and key file descriptions |
