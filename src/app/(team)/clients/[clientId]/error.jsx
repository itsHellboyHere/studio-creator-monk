"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ClientPageError({ error, reset }) {
  useEffect(() => {
    console.error("Client page error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f6fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora', sans-serif",
      padding: "2rem",
    }}>
      <div style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: "2.5rem",
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: "rgba(74,124,16,0.06)",
          border: "1px solid rgba(74,124,16,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem", fontSize: 22,
        }}>
          ☕
        </div>
        <h2 style={{
          fontSize: "1.25rem", fontWeight: 700,
          color: "#111318", margin: "0 0 0.5rem",
          letterSpacing: "-0.02em",
        }}>
          Database is waking up
        </h2>
        <p style={{
          fontSize: "0.85rem", color: "#5a5f78",
          lineHeight: 1.6, margin: "0 0 1.75rem",
        }}>
          Neon DB went to sleep due to inactivity. It usually wakes up in 10–15 seconds.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#4a7c10", color: "white", border: "none",
            padding: "0.7rem 1.5rem", borderRadius: 10,
            fontSize: "0.85rem", fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            cursor: "pointer", width: "100%",
            marginBottom: "0.75rem",
          }}
        >
          Try Again
        </button>
        <Link
          href="/clients"
          style={{
            display: "block", color: "#9499b0",
            fontSize: "0.8rem", fontWeight: 500,
            textDecoration: "none", marginTop: "0.5rem",
          }}
        >
          ← Back to Clients
        </Link>
      </div>
    </div>
  );
}