type Props = { repo: string };

export default function ConfigError({ repo }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-grey-100)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "var(--color-white)",
          border: "1px solid var(--color-grey-300)",
          borderRadius: "8px",
          padding: "2.5rem",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <p
          style={{
            margin: "0 0 0.75rem",
            fontWeight: 600,
            fontSize: "1rem",
            color: "var(--color-grey-900)",
          }}
        >
          Unable to load configuration
        </p>
        <p style={{ margin: "0 0 0.5rem", color: "var(--color-grey-700)", fontSize: "0.9375rem" }}>
          We tried reaching <strong>{repo}</strong> but could not read the{" "}
          <code
            style={{
              background: "var(--color-grey-100)",
              padding: "0.1em 0.35em",
              borderRadius: "3px",
              fontSize: "0.875em",
            }}
          >
            vaimopages.config
          </code>{" "}
          file. It may be missing, inaccessible, or malformed.
        </p>
        <p style={{ margin: 0, color: "var(--color-grey-500)", fontSize: "0.875rem" }}>
          Make sure the file exists at the root of the repository and contains valid YAML with the
          required <code style={{ fontSize: "0.875em" }}>site.title</code>,{" "}
          <code style={{ fontSize: "0.875em" }}>source.repo</code>, and{" "}
          <code style={{ fontSize: "0.875em" }}>include</code> fields.
        </p>
      </div>
    </div>
  );
}
