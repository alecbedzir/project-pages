# `vaimopages.config` Reference

This YAML file must exist at the root of your documentation repository. It must be present in **every Git branch** that Vaimo Pages serves. The app reads it on every request (with a 60-second in-memory cache), always from the repository's default branch.

A ready-to-copy template is provided at [`vaimopages.config.example`](../vaimopages.config.example) in this repository.

---

## Full Example

```yaml
site:
  title: "My Project Docs"
  description: "Internal docs"

source:
  repo: "myorg/my-docs-repo"

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

### `source`

| Field | Required | Description |
|---|---|---|
| `source.repo` | Yes | `owner/repo` string identifying the docs repository on GitHub |

### `auth`

| Field | Required | Description |
|---|---|---|
| `auth.sessionDurationDays` | No | Session lifetime in days after a successful passphrase login. Defaults to `7`. |

### `branches`

A list of Git branches that Vaimo Pages can serve. At least one entry is required.

| Field | Required | Description |
|---|---|---|
| `branches[].name` | Yes | The Git branch name (must exist in the source repo) |
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

- The file must be named exactly `vaimopages.config` (no extension) and live at the repository root.
- `site.title`, `source.repo`, at least one `include` pattern, and at least one `branches` entry are required.
- The file is parsed as YAML — check indentation and quoting if you see parse errors in Vercel logs.
- Passphrases are compared exactly (case-sensitive, whitespace-sensitive).
