# Deployment

## Prerequisites

- A Vercel account connected to the `vaimo/vaimo-pages` GitHub repository.
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

1. Connect the `vaimo/vaimo-pages` GitHub repo to a Vercel project.
2. Set all environment variables listed below under **Project → Settings → Environment Variables**.
3. The app builds on every push to `master` of the Vaimo Pages repo.
4. It also builds when the docs repo receives a push (via the GitHub webhook → Vercel deploy hook).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DOCS_REPO` | Yes | `owner/repo` of the documentation repository (e.g. `vaimo/my-docs`) |
| `GITHUB_TOKEN` | Yes | Personal access token with read access to `DOCS_REPO` |
| `GITHUB_WEBHOOK_SECRET` | Yes | Secret shared with the GitHub webhook for signature validation |
| `NEXTAUTH_SECRET` | Yes | Random string for NextAuth JWT signing. Rotate to invalidate all sessions. |
| `NEXTAUTH_URL` | Yes | Canonical URL of the deployment (e.g. `https://vaimopages.vercel.app`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never exposed to browser) |
| `VERCEL_DEPLOY_HOOK_URL` | Yes | Vercel deploy hook URL, called when docs repo receives a push |

> `AUTH_PASSPHRASE` is no longer used. Passphrases are defined in `vaimopages.config` inside the docs repository.

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
3. Fill in:

   | Field | Value |
   |---|---|
   | **Payload URL** | `https://<your-vercel-domain>/api/webhook/github` |
   | **Content type** | `application/json` |
   | **Secret** | Same value as `GITHUB_WEBHOOK_SECRET` |
   | **Which events?** | Just the push event |

4. Click **Add webhook**. GitHub sends a ping — a green tick in delivery history confirms it worked.

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

### GitHub API returns 401 or 404

- `GITHUB_TOKEN` has expired or was revoked. Generate a new one.
- Token does not have read access to `DOCS_REPO`.
- `DOCS_REPO` value is incorrect or the repository does not exist.

### Supabase comments not loading

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.
- Ensure both migrations have been run.
- Check the Supabase dashboard logs for query errors.

### Passphrase accepted but wrong content shown

- Verify the `name` in `vaimopages.config` exactly matches the Git branch name.
- Verify the branch exists in the docs repository.
- Check Vercel logs for GitHub API errors when fetching the tree.
