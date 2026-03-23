interface MarkdownViewProps {
  html: string;
}

export default function MarkdownView({ html }: MarkdownViewProps) {
  return (
    <article
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
