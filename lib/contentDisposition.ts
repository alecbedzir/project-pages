/**
 * Build an RFC 6266 `Content-Disposition` value that safely handles non-ASCII
 * filenames.
 *
 * HTTP header values must be Latin-1 (bytes 0–255). A raw UTF-8 filename — e.g.
 * one containing an en-dash "–" (U+2013) — throws when the `Response` is
 * constructed ("character 8211 is greater than 255"), which previously turned a
 * valid download into a 500 that the browser saved as "download.json".
 *
 * We emit an ASCII-sanitised `filename=` fallback (for very old clients) plus a
 * UTF-8 `filename*=` (RFC 5987) that modern browsers use to recover the real
 * name.
 */
export function attachmentHeader(name: string): string {
  const asciiFallback = name
    .replace(/[\r\n"\\]/g, "") // strip chars that would break the header/quoting
    .replace(/[^\x20-\x7E]/g, "_"); // replace any non-ASCII byte with underscore
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
