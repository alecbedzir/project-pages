# Branding & Design

## Vaimo Brand Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-grey-900` | `#1a1a1a` | Body text (never pure black) |
| `--color-grey-700` | `#404040` | Secondary text, labels |
| `--color-grey-300` | `#c8c8c8` | Borders, dividers |
| `--color-grey-100` | `#f2f2f2` | Page background, sidebar background |
| `--color-yellow` | `#f5c400` | Accent — CTAs, active nav item indicator, highlights |
| `--color-white` | `#ffffff` | Content area background, card backgrounds |

## Typography

- **Font family**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`).
- **Base size**: 16px.
- **Headings**: Semi-bold, `--color-grey-900`.
- **Body**: Regular, `--color-grey-900`.
- **Code**: Monospace (`ui-monospace, 'Cascadia Code', 'Fira Mono', monospace`), on a light grey background.

## Layout Principles

- Generous whitespace; no cramped layouts.
- Max content width: 800px for text-heavy pages, full-width for CSV tables.
- Sidebar: 260px fixed on desktop, full-screen overlay on mobile.
- No drop shadows — use `1px solid --color-grey-300` borders for separation.
- Yellow accent used **sparingly**: active nav link left border, primary button background, focus ring.

## Logo

The Vaimo logo (SVG/WebP) is served as a static asset from `/public/`. Both full-colour and white variants are included. The header uses the full-colour variant on light backgrounds.
