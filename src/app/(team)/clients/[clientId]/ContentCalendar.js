"use client";

import { useState, useEffect, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { getPostsForMonth } from "./actions";
import styles from "./calendar.module.css";

const PLATFORM_COLORS = {
  INSTAGRAM: "#e1306c",
  FACEBOOK:  "#1877f2",
  YOUTUBE:   "#ff0000",
  LINKEDIN:  "#0a66c2",
  TWITTER_X: "#000000",
  OTHER:     "#9ca3af",
};

const STATUS_STYLES = {
  DRAFT:             { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
  PENDING_REVIEW:    { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  CHANGES_REQUESTED: { bg: "#fee2e2", color: "#991b1b", label: "Changes" },
  APPROVED:          { bg: "#dcfce7", color: "#166534", label: "Approved" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  
  const cells = [];
  // Prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false, date: new Date(year, month - 1, daysInPrev - i) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  // Next month fill to complete last row
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  }
  return cells;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ContentCalendar({ clientId, onEditPost }) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // { date, posts }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPostsForMonth(clientId, year, month);
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }, [clientId, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Group posts by date key
  const postsByDay = {};
  posts.forEach(p => {
    const key = toDateKey(new Date(p.scheduledDate));
    if (!postsByDay[key]) postsByDay[key] = [];
    postsByDay[key].push(p);
  });

  const cells = buildCalendarGrid(year, month);
  const todayKey = toDateKey(today);

  const handleDayClick = (cell) => {
    if (!cell.current) return;
    const key = toDateKey(cell.date);
    const dayPosts = postsByDay[key] || [];
    setSelectedDay({ date: cell.date, posts: dayPosts, key });
  };

  return (
    <div className={styles.calendarWrap}>
      {/* ── Header ── */}
      <div className={styles.calHeader}>
        <div className={styles.calHeaderLeft}>
          <FiCalendar size={16} className={styles.calIcon} />
          <span className={styles.calTitle}>{MONTHS[month]} {year}</span>
          {loading && <span className={styles.calLoading}>Loading…</span>}
        </div>
        <div className={styles.calNav}>
          <button className={styles.calNavBtn} onClick={prevMonth} aria-label="Previous month">
            <FiChevronLeft size={16} />
          </button>
          <button
            className={styles.calTodayBtn}
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(null); }}
          >
            Today
          </button>
          <button className={styles.calNavBtn} onClick={nextMonth} aria-label="Next month">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Day Labels ── */}
      <div className={styles.calDays}>
        {DAYS.map(d => (
          <div key={d} className={styles.calDayLabel}>{d}</div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className={`${styles.calGrid} ${loading ? styles.calGridLoading : ""}`}>
        {cells.map((cell, i) => {
          const key = toDateKey(cell.date);
          const dayPosts = postsByDay[key] || [];
          const isToday = cell.current && key === todayKey;
          const isSelected = selectedDay?.key === key && cell.current;

          return (
            <div
              key={i}
              className={[
                styles.calCell,
                !cell.current && styles.calCellOtherMonth,
                isToday && styles.calCellToday,
                isSelected && styles.calCellSelected,
                cell.current && styles.calCellClickable,
              ].filter(Boolean).join(" ")}
              onClick={() => handleDayClick(cell)}
            >
              <span className={styles.calDayNum}>{cell.day}</span>

              {/* Post dots — max 3 shown, rest as +N */}
              {dayPosts.length > 0 && (
                <div className={styles.calDots}>
                  {dayPosts.slice(0, 3).map(p => (
                    <span
                      key={p.id}
                      className={styles.calDot}
                      style={{ background: PLATFORM_COLORS[p.targetPlatform] || PLATFORM_COLORS.OTHER }}
                      title={`${p.title} · ${p.targetPlatform}`}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className={styles.calDotMore}>+{dayPosts.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Day Detail Panel ── */}
      {selectedDay && (
        <div className={styles.dayPanel}>
          <div className={styles.dayPanelHeader}>
            <span className={styles.dayPanelTitle}>
              {selectedDay.date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <button className={styles.dayPanelClose} onClick={() => setSelectedDay(null)}>✕</button>
          </div>

          {selectedDay.posts.length === 0 ? (
            <div className={styles.dayPanelEmpty}>
              <span>No posts scheduled for this day.</span>
            </div>
          ) : (
            <div className={styles.dayPanelList}>
              {selectedDay.posts.map(p => {
                const sm = STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT;
                return (
                  <button
                    key={p.id}
                    className={styles.dayPost}
                    onClick={() => onEditPost(p)}
                    title="Click to edit"
                  >
                    <span
                      className={styles.dayPostPlatformDot}
                      style={{ background: PLATFORM_COLORS[p.targetPlatform] || PLATFORM_COLORS.OTHER }}
                    />
                    <div className={styles.dayPostBody}>
                      <span className={styles.dayPostTitle}>{p.title}</span>
                      <span className={styles.dayPostMeta}>
                        {p.targetPlatform} · {p.contentType?.replace("_", " ")}
                      </span>
                    </div>
                    <span className={styles.dayPostStatus} style={{ background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div className={styles.calLegend}>
        {Object.entries(PLATFORM_COLORS).filter(([k]) => k !== "OTHER").map(([platform, color]) => (
          <span key={platform} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            {platform.charAt(0) + platform.slice(1).toLowerCase().replace("_x", " / X")}
          </span>
        ))}
      </div>
    </div>
  );
}