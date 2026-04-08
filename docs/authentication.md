# Authentication

## Provider

**Shared passphrase** via NextAuth.js `Credentials` provider. Any visitor who enters a correct passphrase is granted a session scoped to the corresponding Git branch. There is no per-user identity — all users who know the same passphrase share the same branch view.

## How It Works

Passphrases are defined in `projectpages.config` under the `branches` list — one passphrase per branch. The app reads this list at authentication time and matches the submitted passphrase.

```
User submits passphrase "abc123"
  └──▶ app reads projectpages.config
         └──▶ finds branch { name: "client", passphrase: "abc123" }
                └──▶ session JWT is issued with branchName = "client"
```

All subsequent requests read `branchName` from the JWT and fetch content from that Git branch.

## Session Storage

Sessions use the **JWT strategy** (no database required). The token is stored in a secure, HTTP-only cookie. The token contains the `branchName` that was resolved at sign-in.

## Session Duration

Configured in `projectpages.config`:

```yaml
auth:
  sessionDurationDays: 7
```

Defaults to 7 days if omitted.

## Protected Routes

All routes except `/api/auth/**` and `/auth/error` require a valid session. Unauthenticated requests are redirected to `/auth/signin`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random string used to sign and encrypt JWT tokens. Rotate this to invalidate all sessions. |
| `NEXTAUTH_URL` | Canonical URL of the deployment (e.g. `https://vaimopages.vercel.app`). Required by NextAuth for redirect construction. |

> The `AUTH_PASSPHRASE` environment variable used in earlier versions is no longer required. Passphrases are now defined entirely in `projectpages.config`.

## Security Notes

- Passphrases are compared server-side only, inside the NextAuth credentials handler. They are never sent to the client.
- Passphrases are stored as plain text in `projectpages.config`. Treat the config file as a secret and restrict access to the docs repository accordingly.
- Rotating a passphrase in the config takes effect immediately (within the 60-second config cache window). Existing sessions remain valid until they expire naturally.
- Rotating `NEXTAUTH_SECRET` invalidates **all** existing sessions immediately — users will need to re-enter their passphrase.
