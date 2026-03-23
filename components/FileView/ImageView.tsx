interface ImageViewProps {
  src: string;   // /api/download?path=... (proxied)
  alt: string;
}

export default function ImageView({ src, alt }: ImageViewProps) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "100%",
          borderRadius: "4px",
          border: "1px solid var(--color-grey-300)",
          display: "block",
        }}
      />
    </div>
  );
}
