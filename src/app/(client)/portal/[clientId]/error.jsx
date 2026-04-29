"use client";
import { useEffect } from "react";

export default function PortalError({ error, reset }) {
  useEffect(() => {
    console.error("Portal error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#faf9f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "2rem",
    }}>
      <div style={{
        background: "white",
        border: "1px solid #e8e4dd",
        borderRadius: 16,
        padding: "2.5rem",
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "rgba(212,81,26,0.08)",
          border: "1px solid rgba(212,81,26,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
          fontSize: 24,
        }}>
          ☕
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "1.5rem", fontWeight: 400,
          color: "#1a1714", margin: "0 0 0.5rem",
          letterSpacing: "-0.02em",
        }}>
          Taking a quick nap
        </h1>
        <p style={{
          fontSize: "0.875rem", color: "#57534e",
          lineHeight: 1.6, margin: "0 0 1.75rem",
        }}>
          Our server was resting due to inactivity. It's waking up now — this usually takes 10–15 seconds.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#d4511a", color: "white", border: "none",
            padding: "0.75rem 1.75rem", borderRadius: 10,
            fontSize: "0.875rem", fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", width: "100%",
            marginBottom: "0.75rem",
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "transparent", color: "#a8a29e",
            border: "1px solid #e8e4dd",
            padding: "0.75rem 1.75rem", borderRadius: 10,
            fontSize: "0.875rem", fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", width: "100%",
          }}
        >
          Refresh Page
        </button>
        <p style={{
          fontSize: "0.72rem", color: "#a8a29e",
          marginTop: "1.25rem", lineHeight: 1.5,
        }}>
          Powered by CreatorMonk · If this persists, contact your team
        </p>
      </div>
    </div>
  );
}