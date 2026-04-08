# `projectpages.config` Reference

This YAML file must exist at the root of your documentation repository. It must be present in **every Git branch** that Project Pages serves. The app reads it on every request (with a 60-second in-memory cache), always from the repository's default branch.

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

branches:
  - name: master
    passphrase: "replace-with-secret"
    comments:
      enabled: false

  - name: client
    passphrase: "replace-with-another-secret"
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

### `branches`

A list of Git branches that Project Pages can serve. At least one entry is required.

| Field | Required | Description |
|---|---|---|
| `branches[].name` | Yes | The Git branch name (must exist in the repository) |
| `branches[].passphrase` | Yes | Plain-text passphrase that grants access to this branch |
| `branches[].comments.enabled` | No | Whether inline comments are enabled for this branch. Defaults to `false`. |

**How it works:** When a user enters a passphrase, the app finds the matching branch and stores its name in the session JWT. All subsequent content requests use that branch.

### `include`

Required. A list of glob patterns. Only files matching at least one pattern are shown. Image files (`.png`, `.jpg`, etc.) and subtitle files (`.vtt`, `.srt`) are automatically included regardless of these patterns when `features.images` is enabled.

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
- `site.title`, at least one `include` pattern, and at least one `branches` entry are required.
- The file is parsed as YAML — check indentation and quoting if you see parse errors in Vercel logs.
- Passphrases are compared exactly (case-sensitive, whitespace-sensitive).
- The repository being read is determined entirely by the `DOCS_REPO` env var in the app — there is no `source.repo` field in this config.
