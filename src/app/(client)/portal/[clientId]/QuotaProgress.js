"use client";
import { useMemo } from "react";
import styles from "./portal.module.css";

const PLATFORM_META = {
  INSTAGRAM: { label: "Instagram", color: "#ec4899", bg: "#fdf2f8" },
  FACEBOOK:  { label: "Facebook",  color: "#3b82f6", bg: "#eff6ff" },
  YOUTUBE:   { label: "YouTube",   color: "#ef4444", bg: "#fef2f2" },
  LINKEDIN:  { label: "LinkedIn",  color: "#6366f1", bg: "#eff6ff" },
  TWITTER_X: { label: "Twitter/X", color: "#6b7280", bg: "#f9fafb" },
  OTHER:     { label: "Other",     color: "#9ca3af", bg: "#f3f4f6" },
};
const CONTENT_TYPE_LABELS = { REEL: "Reel", POST: "Post", STORY: "Story", VIDEO_LONG: "Long Video" };

export default function QuotaProgress({ quotas, posts }) {
  const approvedCounts = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if (p.status !== "APPROVED") return;
      const key = `${p.targetPlatform}__${p.contentType}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [posts]);

  const totalPlanned   = quotas.reduce((s, q) => s + q.amount, 0);
  const totalApproved  = quotas.reduce((s, q) => s + Math.min(approvedCounts[`${q.platform}__${q.contentType}`] || 0, q.amount), 0);
  const totalRemaining = totalPlanned - totalApproved;
  const overallPct     = totalPlanned > 0 ? (totalApproved / totalPlanned) * 100 : 0;

  const byPlatform = {};
  quotas.forEach(q => {
    if (!byPlatform[q.platform]) byPlatform[q.platform] = [];
    byPlatform[q.platform].push(q);
  });

  return (
    <div className={styles.quotaProgress}>
      <div className={styles.qpHeader}>
        <div className={styles.qpHeaderLeft}>
          <span className={styles.qpTitle}>This Month&apos;s Deliverables</span>
          <span className={styles.qpSubtitle}>
            {totalRemaining === 0 && totalPlanned > 0 ? "🎉 All posts approved — month complete!"
              : totalApproved === 0 ? `${totalPlanned} posts planned — none approved yet`
              : `${totalApproved} approved · ${totalRemaining} still to go`}
          </span>
        </div>
        <div className={styles.qpHeaderRight}>
          <span className={styles.qpBigApproved}>{totalApproved}</span>
          <span className={styles.qpBigSep}>/</span>
          <span className={styles.qpBigTotal}>{totalPlanned}</span>
        </div>
      </div>
      <div className={styles.qpMainBar}>
        <div className={styles.qpMainFill} style={{ width: `${overallPct}%` }} />
      </div>
      <div className={styles.qpBody}>
        {Object.entries(byPlatform).map(([platform, rows]) => {
          const pm        = PLATFORM_META[platform] || PLATFORM_META.OTHER;
          const platTotal = rows.reduce((s, q) => s + q.amount, 0);
          const platDone  = rows.reduce((s, q) => s + Math.min(approvedCounts[`${q.platform}__${q.contentType}`] || 0, q.amount), 0);
          const platLeft  = platTotal - platDone;
          return (
            <div key={platform} className={styles.qpPlatform}>
              <div className={styles.qpPlatformHead}>
                <span className={styles.qpPlatformDot} style={{ background: pm.color }} />
                <span className={styles.qpPlatformName}>{pm.label}</span>
                <span className={styles.qpPlatformSummary}>
                  {platLeft === 0
                    ? <span style={{ color: "#16a34a", fontWeight: 700 }}>All done ✓</span>
                    : <span>{platDone}/{platTotal} · <strong>{platLeft} left</strong></span>}
                </span>
              </div>
              {rows.map(q => {
                const key      = `${q.platform}__${q.contentType}`;
                const done     = Math.min(approvedCounts[key] || 0, q.amount);
                const left     = q.amount - done;
                const pct      = q.amount > 0 ? (done / q.amount) * 100 : 0;
                const label    = CONTENT_TYPE_LABELS[q.contentType] || q.contentType;
                const complete = left === 0;
                return (
                  <div key={q.id} className={styles.qpTypeRow}>
                    <div className={styles.qpTypeLeft}>
                      <span className={styles.qpTypeLabel} style={{ background: pm.bg, color: pm.color }}>{label}</span>
                      <span className={styles.qpTypeStatus}>
                        {complete ? <span className={styles.qpComplete}>All {q.amount} ✓</span>
                          : done === 0 ? <span className={styles.qpZero}>{q.amount} planned</span>
                          : <span className={styles.qpPartial}>{done} done · {left} left</span>}
                      </span>
                    </div>
                    <div className={styles.qpTypeRight}>
                      <div className={styles.qpBar}>
                        <div className={styles.qpBarFill} style={{ width: `${pct}%`, background: complete ? "#16a34a" : pm.color }} />
                      </div>
                      <span className={styles.qpFraction}>{done}<span className={styles.qpFractionOf}>/{q.amount}</span></span>
                    </div>
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