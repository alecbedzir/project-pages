# Content Rendering

## File Types

| Extension | Rendering |
|---|---|
| `.md`, `.mdx` | HTML via `remark` + `rehype` pipeline. Supports GFM (tables, task lists, strikethrough). Code blocks get syntax highlighting. |
| `.csv` | Sortable, filterable table (client-side, via TanStack Table). All columns sortable. A search input filters rows client-side. |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` | Displayed inline as a full-width image with a download button. |
| `.docx`, `.vtt`, `.srt`, and all others | File detail page with metadata (name, size, last commit, last updated date) and a prominent download button. No preview. |

## File Metadata

Each file page shows:
- File name and path (breadcrumb)
- Last commit message that touched this file
- Last updated date (from GitHub commit history)
- Author of the last commit
- File size
- Download button

## Markdown Rendering Details

- Headings automatically generate anchor links.
- External links open in a new tab.
- Images referenced in Markdown are proxied through `/api/raw?path=...` so they respect the GitHub token for private repos.
- Comment references are injected at render time when comments exist (see [Comments](./comments.md)).

## Navigation

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Vaimo Logo]   Site Title          [Sign out]       │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  Sidebar     │  Content Area                        │
│  (nav tree)  │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Sidebar

- Built from the filtered file tree (config `include`/`exclude` rules applied to the authenticated branch).
- Folder names are collapsible groups.
- Files are listed as links within their group.
- The active file is highlighted.
- On mobile, the sidebar collapses to a hamburger menu.

### Home / Index Page

If the docs repo contains a `README.md` or `index.md` at the root (within the included paths), it is rendered as the landing page. Otherwise, the landing page shows cards for all exposed top-level folders and files.
