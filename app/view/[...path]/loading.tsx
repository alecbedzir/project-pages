export default function ViewLoading() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "3px solid var(--color-grey-300)",
          borderTopColor: "var(--color-grey-500)",
          animation: "vaimo-spin 0.75s linear infinite",
        }}
      />
    </main>
  );
}
