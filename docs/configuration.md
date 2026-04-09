# `projectpages.config` Reference

This YAML file must exist at the root of your documentation repository in the branch(es) configured by `CONFIG_BRANCH` (default: `master,main`). It does **not** need to be present in every content branch — the app reads it from a single designated branch on every request (with a 60-second in-memory cache).

The repository itself is identified by the `DOCS_REPO` environment variable set in the Project Pages deployment — **not** by anything inside this config file. See [Deployment → DOCS_REPO](./deployment.md#docs_repo) for details.

A ready-to-copy template is provided at [`projectpages.config.example`](../projectpages.config.example) in this repository.

---

## Full Example

```yaml
site:
  title: "My Project Docs"
  description: "Internal docs"

auth:
  sessionDurationDays: 7

userGroups:
  - name: vaimo
    passphrase: "replace-with-secret"
  - name: client
    passphrase: "replace-with-another-secret"

branches:
  - name: master
    userGroups:
      - vaimo
      - client
    comments:
      enabled: false

  - name: client
    userGroups:
      - client
    comments:
      enabled: false

include:
  - "**/*.md"
  - "**/*.csv"
  - "**/*.docx"
  - "**/*.vtt"
  - "**/*.srt"

exclude:
  - "drafts/**"
  - ".github/**"
```

---

## Fields

### `site`

| Field | Required | Description |
|---|---|---|
| `site.title` | Yes | Displayed in the browser tab and top nav |
| `site.description` | No | Subtitle shown on the home/index page |

### `auth`

| Field | Required | Description |
|---|---|---|
| `auth.sessionDurationDays` | No | Session lifetime in days after a successful passphrase login. Defaults to `7`. |

### `userGroups`

Defines the audiences that can access this portal. At least one entry is required. Each group has a name and a passphrase — users who enter the passphrase are authenticated as that group.

| Field | Required | Description |
|---|---|---|
| `userGroups[].name` | Yes | Identifier for the group (referenced by branches) |
| `userGroups[].passphrase` | Yes | Plain-text passphrase that authenticates a user as this group |

Passphrases must be unique across all groups. Treat this file as a secret.

### `branches`

A list of Git branches that Project Pages can serve. At least one entry is required.

| Field | Required | Description |
|---|---|---|
| `branches[].name` | Yes | The Git branch name (must exist in the repository) |
| `branches[].userGroups` | Yes | List of user group names that can access this branch |
| `branches[].comments.enabled` | No | Whether inline comments are enabled for this branch. Defaults to `false`. |

**How it works:** When a user logs in, the app identifies their group by passphrase, then finds all branches that list that group. The user lands on the first accessible branch. If multiple branches are accessible, a branch switcher appears in the top nav so they can move between them without logging out.

### `include`

Required. A list of glob patterns. Only files matching at least one pattern are shown. Image files (`.png`, `.jpg`, etc.) and subtitle files (`.vtt`, `.srt`) are automatically included when `features.images` is enabled.

### `exclude`

Optional. A list of glob patterns. Files matching any pattern are hidden, even if they matched `include`. Evaluated after `include`.

### `features`

| Field | Required | Description |
|---|---|---|
| `features.images` | No | Auto-include image files in the file tree. Defaults to `true`. |

---

## Path Resolution Rules

1. Patterns use standard glob syntax (same as `.gitignore`).
2. `include` is evaluated first — a file must match at least one pattern to be considered.
3. `exclude` is applied next — matching files are removed regardless of `include`.
4. Empty directories (after filtering) are not shown in the sidebar.

---

## Troubleshooting

- The file must be named exactly `projectpages.config` (no extension) and live at the repository root.
- `site.title`, at least one `include` pattern, at least one `userGroups` entry, and at least one `branches` entry are required.
- The file is parsed as YAML — check indentation and quoting if you see parse errors in Vercel logs.
- Passphrases are compared exactly (case-sensitive, whitespace-sensitive).
- The repository being read is determined entirely by the `DOCS_REPO` env var in the app — there is no `source.repo` field in this config.
