"use client";

export default function GlobalError({ reset }) {
  return (
    <html>
      <body style={{
        margin: 0,
        minHeight: "100vh",
        background: "#faf9f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "2rem",
      }}>
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "2.5rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 32, marginBottom: "1rem" }}>⚡</div>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem", color: "#1a1714" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#57534e", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            Our server may be waking up from sleep. Please try again in a few seconds.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#d4511a", color: "white", border: "none",
              padding: "0.75rem 1.5rem", borderRadius: 10,
              fontSize: "0.875rem", fontWeight: 700,
              cursor: "pointer", width: "100%",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}