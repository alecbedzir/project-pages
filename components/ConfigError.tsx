export default function ConfigError() {
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
          Unable to load content
        </p>
        <p style={{ margin: "0 0 0.5rem", color: "var(--color-grey-700)", fontSize: "0.9375rem" }}>
          The application could not reach the content repository. This is usually a configuration
          issue — check the server logs for details.
        </p>
        <p style={{ margin: 0, color: "var(--color-grey-500)", fontSize: "0.875rem" }}>
          Make sure <code style={{ fontSize: "0.875em" }}>DOCS_REPO</code> is set in the environment
          and that a valid{" "}
          <code
            style={{
              background: "var(--color-grey-100)",
              padding: "0.1em 0.35em",
              borderRadius: "3px",
              fontSize: "0.875em",
            }}
          >
            projectpages.config
          </code>{" "}
          file exists at the root of that repository.
        </p>
      </div>
    </div>
  );
}
