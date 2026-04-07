"use client";

import { useState, useMemo } from "react";
import styles from "./portalCalendar.module.css";

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d", dot: "#ec4899", light: "#fce7f3", label: "Instagram" },
  FACEBOOK:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", light: "#dbeafe", label: "Facebook" },
  YOUTUBE:   { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", light: "#fee2e2", label: "YouTube" },
  LINKEDIN:  { bg: "#eff6ff", color: "#1e40af", dot: "#6366f1", light: "#e0e7ff", label: "LinkedIn" },
  TWITTER_X: { bg: "#f9fafb", color: "#111827", dot: "#6b7280", light: "#f3f4f6", label: "Twitter / X" },
  OTHER:     { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", light: "#f3f4f6", label: "Other" },
};

const STATUS_META = {
  DRAFT:             { label: "Draft",          bg: "#f3f4f6", color: "#6b7280", icon: "○" },
  PENDING_REVIEW:    { label: "Pending Review", bg: "#fef9c3", color: "#854d0e", icon: "◐" },
  APPROVED:          { label: "Approved",       bg: "#dcfce7", color: "#166534", icon: "✓" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b", icon: "!" },
};

const CONTENT_TYPE_ICONS  = { REEL: "🎬", POST: "🖼️", STORY: "⚡", VIDEO_LONG: "📹" };
const CONTENT_TYPE_LABELS = { REEL: "Reel", POST: "Post", STORY: "Story", VIDEO_LONG: "Long Video" };

const DAYS_SHORT  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildGrid(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, current: false, date: new Date(year, month - 1, daysInPrev - i) });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  return cells;
}

function toKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function PortalCalendar({ posts }) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const scheduledPosts = useMemo(() => posts.filter(p => p.scheduledDate), [posts]);

  const postsByDay = useMemo(() => {
    const map = {};
    scheduledPosts.forEach(p => {
      const key = toKey(new Date(p.scheduledDate));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [scheduledPosts]);

  const cells    = buildGrid(year, month);
  const todayKey = toKey(today);

  const prevMonth = () => {
    setSelected(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const handleDayClick = (cell) => {
    if (!cell.current) return;
    const key = toKey(cell.date);
    if (selected?.key === key) { setSelected(null); return; }
    setSelected({ date: cell.date, posts: postsByDay[key] || [], key });
  };

  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);
  const monthCount = scheduledPosts.filter(p => {
    const d = new Date(p.scheduledDate);
    return d >= monthStart && d <= monthEnd;
  }).length;

  return (
    <div className={styles.wrap}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.monthTitle}>
            {MONTHS_FULL[month]}
            <span className={styles.yearLabel}>{year}</span>
          </h3>
          <span className={styles.monthCount}>
            {monthCount > 0
              ? `${monthCount} post${monthCount !== 1 ? "s" : ""} scheduled this month`
              : "Nothing scheduled yet"}
          </span>
        </div>
        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className={styles.todayBtn} onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}>Today</button>
          <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* ── Day labels ── */}
      <div className={styles.dayLabels}>
        {DAYS_SHORT.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {cells.map((cell, i) => {
          const key      = toKey(cell.date);
          const dayPosts = postsByDay[key] || [];
          const isToday  = cell.current && key === todayKey;
          const isSel    = selected?.key === key && cell.current;
          const hasPosts = dayPosts.length > 0 && cell.current;
          const dominantPc = hasPosts ? (PLATFORM_COLORS[dayPosts[0].targetPlatform] || PLATFORM_COLORS.OTHER) : null;

          return (
            <div
              key={i}
              className={[
                styles.cell,
                !cell.current && styles.cellOther,
                isToday       && styles.cellToday,
                isSel         && styles.cellSelected,
                cell.current  && styles.cellActive,
                hasPosts      && styles.cellHasPosts,
              ].filter(Boolean).join(" ")}
              style={hasPosts && !isSel ? { background: dominantPc.light } : undefined}
              onClick={() => handleDayClick(cell)}
            >
              <span className={styles.dayNum}>{cell.day}</span>

              {hasPosts && (
                <div className={styles.pillList}>
                  {dayPosts.slice(0, 2).map(p => {
                    const pc   = PLATFORM_COLORS[p.targetPlatform] || PLATFORM_COLORS.OTHER;
                    const icon = CONTENT_TYPE_ICONS[p.contentType] || "📄";
                    return (
                      <div key={p.id} className={styles.pill} style={{ background: pc.bg, borderColor: pc.dot + "50", color: pc.color }}>
                        <span className={styles.pillDot} style={{ background: pc.dot }} />
                        <span className={styles.pillIcon}>{icon}</span>
                        <span className={styles.pillText}>{p.title}</span>
                      </div>
                    );
                  })}
                  {dayPosts.length > 2 && (
                    <div className={styles.pillMore}>+{dayPosts.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Day Detail Panel ── */}
      {selected && (
        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <div className={styles.detailDate}>
              <span className={styles.detailDayName}>
                {selected.date.toLocaleDateString("en-IN", { weekday: "long" })}
              </span>
              <span className={styles.detailFullDate}>
                {selected.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {selected.posts.length > 0 && (
                <span className={styles.detailCount}>{selected.posts.length} post{selected.posts.length !== 1 ? "s" : ""}</span>
              )}
              <button className={styles.detailClose} onClick={() => setSelected(null)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {selected.posts.length === 0 ? (
            <div className={styles.detailEmpty}>
              <span className={styles.detailEmptyIcon}>📅</span>
              <p>Nothing scheduled for this day</p>
            </div>
          ) : (
            <div className={styles.detailList}>
              {selected.posts.map(p => {
                const pc        = PLATFORM_COLORS[p.targetPlatform] || PLATFORM_COLORS.OTHER;
                const sm        = STATUS_META[p.status] || STATUS_META.DRAFT;
                const icon      = CONTENT_TYPE_ICONS[p.contentType] || "📄";
                const typeLabel = CONTENT_TYPE_LABELS[p.contentType] || "Post";
                return (
                  <div key={p.id} className={styles.postCard}>
                    <div className={styles.postCardStripe} style={{ background: pc.dot }} />
                    <div className={styles.postCardLeft} style={{ background: pc.light }}>
                      <span className={styles.postCardIcon}>{icon}</span>
                    </div>
                    <div className={styles.postCardBody}>
                      <span className={styles.postCardTitle}>{p.title}</span>
                      <div className={styles.postCardMeta}>
                        <span className={styles.postCardPlatformChip} style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                        <span className={styles.postCardTypeBadge}>{typeLabel}</span>
                      </div>
                    </div>
                    <div className={styles.postCardStatusWrap}>
                      <span className={styles.postCardStatus} style={{ background: sm.bg, color: sm.color }}>
                        {sm.icon} {sm.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Platforms</span>
        {Object.entries(PLATFORM_COLORS).filter(([k]) => k !== "OTHER").map(([key, val]) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: val.dot }} />
            {val.label}
          </span>
        ))}
        <span className={styles.legendDivider} />
        <span className={styles.legendTitle}>Status</span>
        {Object.entries(STATUS_META).map(([key, val]) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.legendStatusChip} style={{ background: val.bg, color: val.color }}>{val.icon}</span>
            {val.label}
          </span>
        ))}
      </div>
    </div>
  );
}