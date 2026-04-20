"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerPush() {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return "already_subscribed";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  return "subscribed";
}

export default function PushNotificationManager() {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setStatus("subscribed");
      })
    );
  }, []);

  useEffect(() => {
    const unlock = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume().then(() => ctx.close());
      } catch {}
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === "PUSH_RECEIVED") playSound();
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(() => {
        [880, 1100].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
      });
    } catch {}
  };

  const handleEnable = async () => {
    setStatus("loading");
    try {
      const result = await registerPush();
      setStatus(result === "denied" ? "denied" : "subscribed");
    } catch {
      setStatus("idle");
    }
  };

  if (status === "unsupported" || status === "subscribed") return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#1a1714", color: "#fff", borderRadius: "12px",
      padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 9999,
      fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 500,
      border: "1px solid rgba(255,255,255,0.1)",
      animation: "slideUp 0.3s ease",
    }}>
      <span>🔔</span>
      <span>Enable notifications to get client alerts</span>
      {status === "denied" ? (
        <span style={{ color: "#f87171", fontSize: "12px" }}>Blocked — allow in browser settings</span>
      ) : (
        <button
          onClick={handleEnable}
          disabled={status === "loading"}
          style={{
            background: "#f97316", color: "#fff", border: "none",
            padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {status === "loading" ? "Enabling…" : "Enable"}
        </button>
      )}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}