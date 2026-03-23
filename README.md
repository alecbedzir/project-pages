# Vaimo Pages

An internal documentation portal that renders Markdown files from a private GitHub repository. Content is sourced live via the GitHub API, protected by passphrase authentication, and supports inline comments powered by Supabase.

---

## How it works

```
Docs repo (GitHub)
  └── vaimopages.config   ← portal configuration (title, source repo, file filters)
  └── docs/**/*.md        ← the actual content

GitHub webhook (push to main)
  └──▶ /api/webhook/github  (this app, on Vercel)
         ├── invalidates config cache
         └── calls Vercel Deploy Hook → triggers rebuild
```

1. On each request, the app reads `vaimopages.config` from the docs repository via the GitHub API and caches it for 60 seconds.
2. When you push to the `main` branch of the docs repo, GitHub sends a webhook to this app, which triggers a fresh Vercel deployment so the static content is rebuilt.
3. Users must enter a shared passphrase to access any page. Sessions are managed with NextAuth and stored as JWTs.
4. Comments are stored in a Supabase `comments` table and scoped to each file path.

---

## Local development

```bash
cp .env.local.example .env.local
# fill in .env.local — see Configuration below
npm install
npm run dev
```

---

## Configuration

All configuration is done through environment variables. In local development these live in `.env.local` (never committed). In Vercel they are set via **Project → Settings → Environment Variables**.

### 1. Copy the example file

```bash
cp .env.local.example .env.local
```

### 2. Fill in each variable

---

#### `DOCS_REPO`

The GitHub repository that holds your documentation, in `owner/repo` format.

```
DOCS_REPO=myorg/my-docs-repo
```

This repository must contain a `vaimopages.config` file at its root — see [vaimopages.config reference](#vaimo-pagesconfig-reference) below.

---

#### `GITHUB_TOKEN`

A GitHub Personal Access Token used to read files from `DOCS_REPO` via the GitHub API.

**How to create one:**

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Set **Resource owner** to the org or user that owns the docs repo.
3. Under **Repository access**, select the docs repository only.
4. Under **Repository permissions**, grant **Contents: Read-only**.
5. Click **Generate token** and copy the value immediately (it is only shown once).

```
GITHUB_TOKEN=github_pat_...
```

> The token only needs read access. Do not grant write permissions.

---

#### `GITHUB_WEBHOOK_SECRET`

A secret string shared between GitHub and this app. GitHub signs every webhook payload with it, and the app verifies the signature before acting on it. This prevents anyone from spoofing webhook calls.

**How to generate one:**

```bash
openssl rand -hex 32
```

Paste the output here and also into the GitHub webhook settings (see [GitHub webhook setup](#github-webhook-setup) below).

```
GITHUB_WEBHOOK_SECRET=<your generated secret>
```

---

#### `NEXTAUTH_SECRET`

A random string used by NextAuth to sign and encrypt JWT session tokens. If this value changes, all existing sessions are invalidated.

**How to generate one:**

```bash
openssl rand -base64 32
```

```
NEXTAUTH_SECRET=<your generated secret>
```

---

#### `NEXTAUTH_URL`

The canonical URL of this deployment, with no trailing slash. NextAuth uses this to construct redirect URLs after sign-in.

- Local development: `http://localhost:3000`
- Vercel deployment: `https://<your-vercel-domain>`

```
NEXTAUTH_URL=https://project-pages-chi.vercel.app
```

---

#### `AUTH_PASSPHRASE`

The shared passphrase users must enter to access the portal. Anyone who knows this string can sign in.

```
AUTH_PASSPHRASE=your-secret-passphrase
```

Choose something strong — treat it like a password.

---

#### `SUPABASE_URL`

The URL of your Supabase project, found in **Supabase → Project Settings → API → Project URL**.

```
SUPABASE_URL=https://<project-ref>.supabase.co
```

---

#### `SUPABASE_SERVICE_ROLE_KEY`

The service role key for your Supabase project, found in **Supabase → Project Settings → API → Project API keys → service_role**.

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> This key bypasses Row Level Security. Keep it secret and never expose it client-side.

---

#### `VERCEL_DEPLOY_HOOK_URL`

A Vercel Deploy Hook URL. When the GitHub webhook fires, this app calls this URL to trigger a fresh deployment so rebuilt static pages pick up content changes.

**How to create one:**

1. Open your project in Vercel.
2. Go to **Settings → Git → Deploy Hooks**.
3. Click **Create Hook**, give it a name (e.g. `github-content-update`), and select the `master` branch.
4. Copy the generated URL.

```
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

---

### GitHub webhook setup

The webhook tells this app whenever you push to the docs repository so it can trigger a rebuild.

1. Go to the **docs repository** on GitHub (the one in `DOCS_REPO`).
2. Navigate to **Settings → Webhooks → Add webhook**.
3. Fill in the fields:

   | Field | Value |
   |---|---|
   | **Payload URL** | `https://<your-vercel-domain>/api/webhook/github` |
   | **Content type** | `application/json` |
   | **Secret** | The same value you set in `GITHUB_WEBHOOK_SECRET` |
   | **Which events?** | Just the push event |

4. Click **Add webhook**. GitHub will send a ping event — you should see a green tick in the webhook's delivery history.

> The webhook only reacts to pushes on the `main` branch of the docs repo. Pushes to other branches are acknowledged but ignored.

---

## `vaimopages.config` reference

This YAML file must exist at the root of your docs repository. The app reads it on every request (with a 60-second cache).

```yaml
site:
  title: My Docs Portal          # required — shown in the page header
  description: Internal docs     # optional

source:
  repo: myorg/my-docs-repo       # required — the repo being rendered (can be the same repo)
  branch: main                   # optional, defaults to "main"

auth:
  sessionDurationDays: 7         # optional, defaults to 7

include:
  - "docs/**/*.md"               # required — glob patterns for files to show
  - "*.md"

exclude:                         # optional — glob patterns to hide
  - "docs/internal/**"
```

`include` and `exclude` support full glob syntax (e.g. `**/*.md`, `docs/drafts/**`).

---

## Troubleshooting

### Build fails: `useSearchParams() should be wrapped in a suspense boundary`

Next.js 15 requires any component calling `useSearchParams()` to be a child of `<Suspense>`. Make sure `app/auth/signin/page.tsx` wraps the form component in `<Suspense>`.

### Sign-in redirects loop or sessions expire immediately

- Check that `NEXTAUTH_URL` exactly matches the URL you are accessing (including `https://` vs `http://`).
- Check that `NEXTAUTH_SECRET` is set and non-empty. If it was recently rotated, all previous sessions are invalid and users need to sign in again.

### Content not updating after a push

1. Check the webhook delivery log in GitHub (**Settings → Webhooks → Recent Deliveries**). Look for a non-2xx response code.
2. Verify `GITHUB_WEBHOOK_SECRET` is identical in both GitHub and your Vercel environment variables.
3. Verify `VERCEL_DEPLOY_HOOK_URL` is set in Vercel environment variables (not just locally).
4. Check Vercel function logs (**Vercel → Deployments → Functions**) for errors from `/api/webhook/github`.

### GitHub API returns 401 or 404

- The `GITHUB_TOKEN` has expired or was revoked. Generate a new one.
- The token does not have read access to the `DOCS_REPO` repository.
- The `DOCS_REPO` value is incorrect or the repository does not exist.

### `vaimopages.config` errors

- The file must be named exactly `vaimopages.config` (no extension) and live at the repository root.
- `site.title`, `source.repo`, and at least one `include` pattern are required.
- The file is parsed as YAML — check indentation and quoting if you see parse errors in Vercel logs.

### Supabase comments not loading

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.
- Ensure the `comments` table exists in your Supabase project with the expected schema.
- Check the Supabase dashboard logs for query errors.
