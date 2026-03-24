import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Comment } from "./supabase";

/**
 * Rehype plugin: transforms ```mermaid code blocks into
 * <div class="mermaid-placeholder" data-mermaid="...urlencoded...">
 * BEFORE rehype-highlight sees them, so they are never syntax-highlighted
 * and are easy to detect client-side.
 */
function rehypeMermaid() {
  return (tree: any) => {
    visit(tree, "element", (node: any, index: any, parent: any) => {
      if (!parent || index == null) return;
      if (node.tagName !== "pre" || node.children?.length !== 1) return;

      const codeEl = node.children[0];
      if (codeEl?.tagName !== "code") return;

      const classes: string[] = (codeEl.properties?.className as string[]) ?? [];
      if (!classes.includes("language-mermaid")) return;

      const code: string = (codeEl.children ?? [])
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.value as string)
        .join("");

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["mermaid-placeholder"],
          "data-mermaid": encodeURIComponent(code),
        },
        children: [],
      };
    });
  };
}

export async function renderMarkdown(raw: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMermaid)
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
