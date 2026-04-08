# Deployment

## Prerequisites

- A Vercel account connected to the `vaimo/project-pages` GitHub repository.
- A Supabase project (free tier is sufficient).
- A GitHub Personal Access Token with read access to the docs repository.

## Local Development

```bash
cp .env.local.example .env.local
# fill in .env.local — see Environment Variables below
npm install
npm run dev
```

## Vercel Setup

1. Connect the `vaimo/project-pages` GitHub repo to a Vercel project.
2. Set all environment variables listed below under **Project → Settings → Environment Variables**.
3. The app builds on every push to `master` of the Project Pages repo.
4. It also builds when the docs repo receives a push (via the GitHub webhook → Vercel deploy hook).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DOCS_REPO` | Yes | `owner/repo` of the documentation repository (e.g. `vaimo/my-docs`). See below. |
| `GITHUB_TOKEN` | Yes | Personal access token with read access to `DOCS_REPO` |
| `GITHUB_WEBHOOK_SECRET` | Yes | Secret shared with the GitHub webhook for signature validation |
| `NEXTAUTH_SECRET` | Yes | Random string for NextAuth JWT signing. Rotate to invalidate all sessions. |
| `NEXTAUTH_URL` | Yes | Canonical URL of the deployment (e.g. `https://vaimopages.vercel.app`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never exposed to browser) |
| `VERCEL_DEPLOY_HOOK_URL` | Yes | Vercel deploy hook URL, called when docs repo receives a push |

> `AUTH_PASSPHRASE` is no longer used. Passphrases are defined in `projectpages.config` inside the docs repository.

---

### `DOCS_REPO`

This is the most important environment variable. It tells the app **which GitHub repository to use for all content**.

```
DOCS_REPO=vaimo/my-docs-repo
```

The value must be in `owner/repo` format. It controls three things:

1. **Where `projectpages.config` is read from** — the app fetches `projectpages.config` from this repository's default branch on every request (cached for 60 seconds).
2. **Where all file content is fetched from** — every file tree request, file view, image, and download is served from this repository, on the branch that matches the user's passphrase.
3. **What the `GITHUB_TOKEN` needs access to** — the token must have Contents: Read-only access to this exact repository.

If `DOCS_REPO` is not set when the app starts, all content requests will fail immediately. The app will render an error page and log a clear message to the server console. There is nothing inside `projectpages.config` that can override or substitute this value.

**One deployment = one repository.** If you need to serve a different knowledge-base repository, deploy a separate instance of the app with a different `DOCS_REPO` value.

---

### Generating secrets

```bash
# GITHUB_WEBHOOK_SECRET
openssl rand -hex 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

### GitHub token setup

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Set **Resource owner** to the org/user that owns the docs repo.
3. Under **Repository access**, select the docs repository only.
4. Under **Repository permissions**, grant **Contents: Read-only**.
5. Copy the value immediately (shown only once).

## GitHub Webhook Setup

The webhook tells this app whenever the docs repository is pushed so it can trigger a rebuild.

1. Go to the **docs repository** on GitHub.
2. Navigate to **Settings → Webhooks → Add webhook**.
3. Fill in each field as follows:

#### Payload URL

```
https://<your-vercel-domain>/api/webhook/github
```

Replace `<your-vercel-domain>` with the actual URL of your Project Pages deployment on Vercel (e.g. `https://project-pages-chi.vercel.app`). You can find this in your Vercel project dashboard.

#### Content type

Change the dropdown from the default `application/x-www-form-urlencoded` to **`application/json`**. This is required — the webhook handler parses the body as JSON and will reject payloads in any other format.

#### Secret

Paste the value of `GITHUB_WEBHOOK_SECRET` from your Vercel environment variables. If you haven't created one yet, generate it now:

```bash
openssl rand -hex 32
```

Set that value in two places: here in the GitHub webhook form, and as `GITHUB_WEBHOOK_SECRET` in **Vercel → Project → Settings → Environment Variables**. They must match exactly. The app uses this to verify every incoming request is genuinely from GitHub.

#### SSL verification

Leave **Enable SSL verification** selected (the default). Do not disable it.

#### Which events would you like to trigger this webhook?

Select **Just the push event**. The app reacts to pushes on any branch of the docs repository — it invalidates the config cache and triggers a Vercel redeploy so content stays fresh.

#### Active

Leave the **Active** checkbox ticked.

4. Click **Add webhook**. GitHub immediately sends a ping request — go to the webhook's **Recent Deliveries** tab and confirm there is a green tick. If you see a red cross, check that `GITHUB_WEBHOOK_SECRET` matches on both sides and that your Vercel deployment is live.

## Supabase Setup

Run the migrations in order in the **Supabase SQL editor**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_add_branch_to_comments.sql`

Credentials are in **Supabase → Project Settings → API**.

## Content Caching

GitHub API responses are cached in-memory for 60 seconds as a safety net between webhook-triggered rebuilds. The primary update mechanism is the webhook → Vercel redeploy, which clears all caches.

## Troubleshooting

### Build fails: `useSearchParams() should be wrapped in a suspense boundary`

Next.js 15 requires any component calling `useSearchParams()` to be a child of `<Suspense>`. Ensure `app/auth/signin/page.tsx` wraps the form component in `<Suspense>`.

### Sign-in redirects loop or sessions expire immediately

- Check that `NEXTAUTH_URL` exactly matches the URL being accessed (including `https://`).
- Check that `NEXTAUTH_SECRET` is set and non-empty. If rotated, all previous sessions are invalid.

### Content not updating after a push

1. Check the webhook delivery log in GitHub (**Settings → Webhooks → Recent Deliveries**).
2. Verify `GITHUB_WEBHOOK_SECRET` is identical in GitHub and Vercel.
3. Verify `VERCEL_DEPLOY_HOOK_URL` is set in Vercel (not just locally).
4. Check Vercel function logs (**Deployments → Functions**) for errors from `/api/webhook/github`.

### App shows "Unable to load content"

- Check server logs for a `[projectpages]` prefixed message — it will say exactly what is wrong.
- Most commonly: `DOCS_REPO` is not set, is set to an invalid format, or `GITHUB_TOKEN` lacks access.

### GitHub API returns 401 or 404

- `GITHUB_TOKEN` has expired or was revoked. Generate a new one.
- Token does not have read access to `DOCS_REPO`.
- `DOCS_REPO` value is incorrect or the repository does not exist.

### Supabase comments not loading

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.
- Ensure both migrations have been run.
- Check the Supabase dashboard logs for query errors.

### Passphrase accepted but wrong content shown

- Verify the `name` in `projectpages.config` exactly matches the Git branch name.
- Verify the branch exists in the docs repository.
- Check Vercel logs for GitHub API errors when fetching the tree.
