export default function AuthErrorPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-grey-100)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Access Denied</h1>
        <p style={{ color: "var(--color-grey-700)" }}>
          You do not have permission to access this site.
        </p>
        <a
          href="/auth/signin"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.6rem 1.5rem",
            background: "var(--color-yellow)",
            color: "var(--color-grey-900)",
            borderRadius: "4px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try again
        </a>
      </div>
    </div>
  );
}
