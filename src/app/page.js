// src/app/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Small delay so the splash is visible before the push
    const t = setTimeout(() => router.replace("/clients"), 900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#faf7f2",
      fontFamily: "'DM Sans', sans-serif",
      gap: "1.25rem",
    }}>
      {/* Logo mark */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #ea580c, #c2410c)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.1rem",
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.03em",
        boxShadow: "0 8px 24px rgba(234,88,12,0.3)",
        animation: "pulse 1.4s ease-in-out infinite",
      }}>
        CM
      </div>

      {/* Shimmer bar */}
      <div style={{
        width: 120,
        height: 3,
        borderRadius: 99,
        background: "#f0e6dc",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent, #ea580c, transparent)",
          animation: "slide 1s ease-in-out infinite",
        }} />
      </div>

      <p style={{
        fontSize: "0.78rem",
        color: "#c4a98a",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 600,
        margin: 0,
      }}>
        Redirecting…
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1);     box-shadow: 0 8px 24px rgba(234,88,12,0.3); }
          50%       { transform: scale(1.07);  box-shadow: 0 12px 32px rgba(234,88,12,0.45); }
        }
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}