import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import type { Comment } from "./supabase";

export async function renderMarkdown(raw: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(raw);

  return result.toString();
}

/**
 * Generates a plain-text / markdown version of a file with comments
 * appended as footnotes. Used for the "Download with comments" endpoint.
 */
export function buildAnnotatedMarkdown(rawContent: string, comments: Comment[]): string {
  if (!comments.length) return rawContent;

  // Group top-level comments and their replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => !!c.parent_id);

  const threads = topLevel.map((c, idx) => ({
    ref: idx + 1,
    comment: c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }));

  const footnotes = threads
    .map(({ ref, comment, replies: rs }) => {
      const anchor = comment.anchor ? `**On:** \`${comment.anchor}\`` : "**On:** (whole file)";
      const date = new Date(comment.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const header = `[${ref}] ${anchor}\n    **${comment.author_name}** — ${date}\n    ${comment.body}`;
      const replyLines = rs
        .map((r) => {
          const rDate = new Date(r.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return `\n\n    ↳ **${r.author_name}** — ${rDate}\n      ${r.body}`;
        })
        .join("");
      return header + replyLines;
    })
    .join("\n\n");

  return `${rawContent}\n\n---\n\n## Comments\n\n${footnotes}\n`;
}
