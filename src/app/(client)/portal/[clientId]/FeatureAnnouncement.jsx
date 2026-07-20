

"use client";
import { useState, useEffect } from "react";
import styles from "../[clientId]/FeatureAnnouncement.module.css";

// ── Config: bas ye object badlo har naye announcement ke liye ──
const FEATURE = {
  id: "feedback-images-v1",          // unique key — badalne se modal dobara dikhega
  liveUntil: "2026-07-27",           // is date ke baad kisi ko nahi dikhega (7-day window)
  title: "Attach screenshots to your feedback",
  body: "Ab aap draft posts pe feedback dete waqt screenshot bhi laga sakte hain. Spelling ya layout ki galti ho — image pe mark karke paste, drag, ya tap karke attach kar dein. A picture is worth a thousand words!",
};

export default function FeatureAnnouncement() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 1. Date window check — cutoff nikal gaya to kabhi mat dikhao
    const today = new Date();
    const cutoff = new Date(FEATURE.liveUntil + "T23:59:59");
    if (today > cutoff) return;

    // 2. localStorage check — client ne pehle dismiss kiya?
    try {
      const seen = localStorage.getItem(`feature_seen_${FEATURE.id}`);
      if (seen) return;
    } catch {
      // localStorage blocked (rare) — dikha do, koi harm nahi
    }

    // Thoda delay taaki portal load hone ke baad smoothly aaye
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(`feature_seen_${FEATURE.id}`, Date.now().toString());
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className={styles.faOverlay} onClick={dismiss}>
      <div className={styles.faModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.faClose} onClick={dismiss} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.faIcon}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        <span className={styles.faBadge}>✨ New Feature</span>
        <h2 className={styles.faTitle}>{FEATURE.title}</h2>
        <p className={styles.faBody}>{FEATURE.body}</p>

        <button className={styles.faCta} onClick={dismiss}>Got it</button>
      </div>
    </div>
  );
}