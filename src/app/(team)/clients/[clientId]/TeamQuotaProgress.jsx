"use client";
import { useMemo } from "react";
import styles from "./clientPage.module.css";

const PLATFORM_META = {
  INSTAGRAM: { label: "Instagram", color: "#e1306c", bg: "rgba(225,48,108,0.08)" },
  FACEBOOK:  { label: "Facebook",  color: "#1877f2", bg: "rgba(24,119,242,0.08)" },
  YOUTUBE:   { label: "YouTube",   color: "#ff0000", bg: "rgba(255,0,0,0.08)" },
  LINKEDIN:  { label: "LinkedIn",  color: "#0a66c2", bg: "rgba(10,102,194,0.08)" },
  TWITTER_X: { label: "Twitter/X", color: "#000000", bg: "rgba(0,0,0,0.06)" },
  OTHER:     { label: "Other",     color: "#9ca3af", bg: "rgba(156,163,175,0.08)" },
};
const CONTENT_TYPE_LABELS = { REEL: "Reel", POST: "Post", STORY: "Story", VIDEO_LONG: "Long Video" };

export default function TeamQuotaProgress({ quotas, posts }) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const approvedCounts = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if (p.status !== "APPROVED") return;
      const key = `${p.targetPlatform}__${p.contentType}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [posts]);

  const totalPlanned  = quotas.reduce((s, q) => s + q.amount, 0);
  const totalApproved = quotas.reduce((s, q) => s + Math.min(approvedCounts[`${q.platform}__${q.contentType}`] || 0, q.amount), 0);
  const overallPct    = totalPlanned > 0 ? (totalApproved / totalPlanned) * 100 : 0;

  const byPlatform = {};
  quotas.forEach(q => {
    if (!byPlatform[q.platform]) byPlatform[q.platform] = [];
    byPlatform[q.platform].push(q);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--s2)" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted2)", marginBottom: 4 }}>
            {monthLabel} Progress
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted2)" }}>
            {totalApproved === totalPlanned && totalPlanned > 0
              ? "🎉 All done for this month!"
              : `${totalApproved} of ${totalPlanned} approved`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "var(--mono)" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{totalApproved}</span>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>/{totalPlanned}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent2))", transition: "width 600ms ease", borderRadius: "0 2px 2px 0" }} />
      </div>

      {/* Platform rows */}
      <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(byPlatform).map(([platform, rows]) => {
          const pm       = PLATFORM_META[platform] || PLATFORM_META.OTHER;
          const platTotal = rows.reduce((s, q) => s + q.amount, 0);
          const platDone  = rows.reduce((s, q) => s + Math.min(approvedCounts[`${q.platform}__${q.contentType}`] || 0, q.amount), 0);
          const platLeft  = platTotal - platDone;
          return (
            <div key={platform}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: pm.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{pm.label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: platLeft === 0 ? "#16a34a" : "var(--muted2)", marginLeft: "auto", fontWeight: platLeft === 0 ? 700 : 400 }}>
                  {platLeft === 0 ? "All done ✓" : `${platDone}/${platTotal} · ${platLeft} left`}
                </span>
              </div>
              {rows.map(q => {
                const key      = `${q.platform}__${q.contentType}`;
                const done     = Math.min(approvedCounts[key] || 0, q.amount);
                const left     = q.amount - done;
                const pct      = q.amount > 0 ? (done / q.amount) * 100 : 0;
                const complete = left === 0;
                return (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: pm.bg, color: pm.color, flexShrink: 0 }}>
                      {CONTENT_TYPE_LABELS[q.contentType] || q.contentType}
                    </span>
                    <div style={{ flex: 1, height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: complete ? "#16a34a" : pm.color, borderRadius: 99, transition: "width 500ms ease" }} />
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: complete ? "#16a34a" : "var(--text)", flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                      {done}<span style={{ fontWeight: 400, color: "var(--muted)" }}>/{q.amount}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}