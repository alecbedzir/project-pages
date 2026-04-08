# API Routes

All routes are Next.js Route Handlers under `/app/api/`. All routes except auth callbacks require a valid NextAuth session.

## Content

| Route | Method | Description |
|---|---|---|
| `/api/content/tree` | GET | Returns the filtered file tree and site metadata for the authenticated branch |
| `/api/content/file` | GET | `?path=` Returns file metadata + base64 content from the authenticated branch |

## Downloads

| Route | Method | Description |
|---|---|---|
| `/api/download` | GET | `?path=` Streams raw file from GitHub |
| `/api/download/with-comments` | GET | `?path=` Streams file with embedded comments (requires comments enabled on branch) |
| `/api/download/with-media` | GET | `?path=` Streams a ZIP of a Markdown file plus all its referenced images |
| `/api/raw` | GET | `?path=` Streams image files inline (used for Markdown image proxying) |

## Comments

| Route | Method | Description |
|---|---|---|
| `/api/comments` | GET | `?path=` Returns all comments for a file on the authenticated branch |
| `/api/comments` | POST | Creates a new comment scoped to the authenticated branch |
| `/api/comments/[id]` | PATCH | Updates own comment (ownership verified by `author_email`) |
| `/api/comments/[id]` | DELETE | Deletes own comment (ownership verified by `author_email`) |

## Auth

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handler |

## Webhook

| Route | Method | Description |
|---|---|---|
| `/api/webhook/github` | POST | Receives GitHub push events, invalidates config cache, triggers Vercel redeploy |

### Webhook Behaviour

The handler:
1. Validates the `X-Hub-Signature-256` header using `GITHUB_WEBHOOK_SECRET`.
2. On any valid `push` event, invalidates the in-memory config cache.
3. Calls the `VERCEL_DEPLOY_HOOK_URL` to trigger a fresh deployment.
4. Returns `200 OK` immediately.

Pushes from any branch trigger a redeploy, since content may have changed on any of the configured branches.
