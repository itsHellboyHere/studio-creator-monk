"use client";
import { useState, useMemo } from "react";
import { requestFestivePost, cancelFestiveRequest } from "./actions";
import styles from "../[clientId]/fesitveCalendar.module.css"

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d", dot: "#ec4899" },
  FACEBOOK:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  YOUTUBE:   { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
  LINKEDIN:  { bg: "#eff6ff", color: "#1e40af", dot: "#6366f1" },
  OTHER:     { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

const CONTENT_TYPE_ICONS = { REEL: "🎬", POST: "🖼️", STORY: "⚡", VIDEO_LONG: "📹" };

const DAYS_SHORT  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const FESTIVAL_META = {
  national:    { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", emoji: "🇮🇳" },
  religious:   { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", emoji: "🪔" },
  observance:  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", emoji: "📅" },
};

const REQUEST_STATUS = {
  PENDING:      { text: "✓ Requested",    bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0", canCancel: true  },
  ACKNOWLEDGED: { text: "👀 Being Reviewed", bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe", canCancel: false },
  IN_PROGRESS:  { text: "⚡ In Progress",  bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe", canCancel: false },
  DONE:         { text: "✅ Post Done!",   bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0", canCancel: false },
};

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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export default function FestiveCalendar({ posts, holidays, festiveRequests, clientId }) {
  const today = new Date();
  const [year, setYear]         = useState(today.getFullYear());
  const [month, setMonth]       = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null);

  const holidaysByDay = useMemo(() => {
    const map = {};
    holidays.forEach(h => {
      const d = h.date?.iso;
      if (!d) return;
      const key = d.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [holidays]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.filter(p => p.scheduledDate).forEach(p => {
      const key = toKey(new Date(p.scheduledDate));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  // Map festive requests by "date__name" → full request object
  const requestsByKey = useMemo(() => {
    const map = {};
    festiveRequests.forEach(r => {
      const key = `${toKey(new Date(r.festivalDate))}__${r.festivalName}`;
      map[key] = r;
    });
    return map;
  }, [festiveRequests]);

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
    const dayPosts    = postsByDay[key] || [];
    const dayHolidays = holidaysByDay[key] || [];
    if (!dayPosts.length && !dayHolidays.length) return;
    setSelected({ date: cell.date, posts: dayPosts, holidays: dayHolidays, key });
  };

  const handleRequest = async (festivalName, festivalDate, isRequested) => {
    const k = `${festivalDate}__${festivalName}`;
    setLoadingKey(k);
    try {
      if (isRequested) {
        await cancelFestiveRequest(clientId, festivalName, festivalDate);
      } else {
        await requestFestivePost(clientId, festivalName, festivalDate);
      }
    } finally {
      setLoadingKey(null);
    }
  };

  const upcomingFestivals = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd   = new Date(year, month + 1, 0);
    return Object.entries(holidaysByDay)
      .filter(([key]) => {
        const d = new Date(key);
        return d >= monthStart && d <= monthEnd && d >= today;
      })
      .flatMap(([key, hs]) => hs.map(h => ({ ...h, key })))
      .slice(0, 5);
  }, [holidaysByDay, year, month]);

  const monthPostCount = Object.entries(postsByDay)
    .filter(([key]) => {
      const d = new Date(key);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, [, ps]) => s + ps.length, 0);

  return (
    <div className={styles.wrap}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.monthTitle}>
            {MONTHS_FULL[month]}
            <span className={styles.yearLabel}>{year}</span>
          </h3>
          <div className={styles.headerMeta}>
            {monthPostCount > 0 && (
              <span className={styles.metaPill} style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                📅 {monthPostCount} post{monthPostCount !== 1 ? "s" : ""} scheduled
              </span>
            )}
            {upcomingFestivals.length > 0 && (
              <span className={styles.metaPill} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                🪔 {upcomingFestivals.length} festival{upcomingFestivals.length !== 1 ? "s" : ""} ahead
              </span>
            )}
          </div>
        </div>
        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={prevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className={styles.todayBtn} onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}>Today</button>
          <button className={styles.navBtn} onClick={nextMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* ── Upcoming festivals strip ── */}
      {upcomingFestivals.length > 0 && (
        <div className={styles.festivalStrip}>
          <span className={styles.stripLabel}>Upcoming</span>
          <div className={styles.stripItems}>
            {upcomingFestivals.map((h, i) => {
              const type   = h.type?.[0]?.toLowerCase() || "observance";
              const fm     = FESTIVAL_META[type] || FESTIVAL_META.observance;
              const reqKey = `${h.key}__${h.name}`;
              const req    = requestsByKey[reqKey];
              const rs     = req ? REQUEST_STATUS[req.status] : null;
              const isLoading = loadingKey === reqKey;

              return (
                <div key={i} className={styles.stripItem} style={{ background: fm.bg, border: `1px solid ${fm.border}` }}>
                  <span className={styles.stripEmoji}>{fm.emoji}</span>
                  <div className={styles.stripInfo}>
                    <span className={styles.stripName} style={{ color: fm.color }}>{h.name}</span>
                    <span className={styles.stripDate}>
                      {new Date(h.key).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {rs ? (
                    <button
                      className={styles.stripRequestBtn}
                      style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}
                      disabled={!rs.canCancel || isLoading}
                      onClick={() => rs.canCancel && handleRequest(h.name, h.key, true)}
                      title={rs.canCancel ? "Click to cancel" : "Your team is on it"}
                    >
                      {isLoading ? "…" : rs.text}
                    </button>
                  ) : (
                    <button
                      className={styles.stripRequestBtn}
                      disabled={isLoading}
                      onClick={() => handleRequest(h.name, h.key, false)}
                    >
                      {isLoading ? "…" : "+ Request Post"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day labels ── */}
      <div className={styles.dayLabels}>
        {DAYS_SHORT.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {cells.map((cell, i) => {
          const key      = toKey(cell.date);
          const dayPosts = cell.current ? (postsByDay[key] || []) : [];
          const dayHols  = cell.current ? (holidaysByDay[key] || []) : [];
          const isToday  = cell.current && key === todayKey;
          const isSel    = selected?.key === key && cell.current;
          const isPast   = cell.current && cell.date < today && key !== todayKey;

          return (
            <div
              key={i}
              className={[
                styles.cell,
                !cell.current && styles.cellOther,
                isToday       && styles.cellToday,
                isSel         && styles.cellSelected,
                cell.current  && styles.cellActive,
                isPast        && styles.cellPast,
                dayHols.length > 0 && cell.current && styles.cellFestive,
              ].filter(Boolean).join(" ")}
              onClick={() => handleDayClick(cell)}
            >
              <span className={styles.dayNum}>{cell.day}</span>

              {dayHols.length > 0 && (
                <div className={styles.holDots}>
                  {dayHols.slice(0, 2).map((h, j) => {
                    const type = h.type?.[0]?.toLowerCase() || "observance";
                    const fm   = FESTIVAL_META[type] || FESTIVAL_META.observance;
                    return <span key={j} className={styles.holDot} style={{ background: fm.color }} title={h.name} />;
                  })}
                </div>
              )}

              {dayPosts.length > 0 && (
                <div className={styles.pillList}>
                  {dayPosts.slice(0, 1).map(p => {
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
                  {dayPosts.length > 1 && <div className={styles.pillMore}>+{dayPosts.length - 1}</div>}
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
            <div>
              <span className={styles.detailDayName}>
                {selected.date.toLocaleDateString("en-IN", { weekday: "long" })}
              </span>
              <span className={styles.detailFullDate}>
                {selected.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <button className={styles.detailClose} onClick={() => setSelected(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {selected.holidays.length > 0 && (
            <div className={styles.detailFestivals}>
              <span className={styles.detailSectionLabel}>Festivals & Holidays</span>
              {selected.holidays.map((h, i) => {
                const type      = h.type?.[0]?.toLowerCase() || "observance";
                const fm        = FESTIVAL_META[type] || FESTIVAL_META.observance;
                const reqKey    = `${selected.key}__${h.name}`;
                const req       = requestsByKey[reqKey];
                const rs        = req ? REQUEST_STATUS[req.status] : null;
                const isLoading = loadingKey === reqKey;

                return (
                  <div key={i} className={styles.festivalRow} style={{ background: fm.bg, border: `1px solid ${fm.border}` }}>
                    <span className={styles.festivalEmoji}>{fm.emoji}</span>
                    <div className={styles.festivalInfo}>
                      <span className={styles.festivalName} style={{ color: fm.color }}>{h.name}</span>
                      {h.description && (
                        <span className={styles.festivalDesc}>{h.description.slice(0, 80)}…</span>
                      )}
                    </div>
                    <div className={styles.festivalActions}>
                      {rs ? (
                        <>
                          <span
                            className={styles.requestBtn}
                            style={{
                              background: rs.bg,
                              color: rs.color,
                              border: `1.5px solid ${rs.border}`,
                              cursor: rs.canCancel ? "pointer" : "default",
                            }}
                            onClick={() => rs.canCancel && handleRequest(h.name, selected.key, true)}
                          >
                            {isLoading ? "…" : rs.text}
                          </span>
                          {rs.canCancel && (
                            <button className={styles.cancelBtn} disabled={isLoading} onClick={() => handleRequest(h.name, selected.key, true)}>
                              Cancel
                            </button>
                          )}
                          {!rs.canCancel && (
                            <span style={{ fontSize: "0.68rem", color: "var(--text3)", fontStyle: "italic" }}>
                              Your team is on it
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          className={styles.requestBtn}
                          disabled={isLoading}
                          onClick={() => handleRequest(h.name, selected.key, false)}
                        >
                          {isLoading ? "…" : "Request Post"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selected.posts.length > 0 && (
            <div className={styles.detailPosts}>
              <span className={styles.detailSectionLabel}>Scheduled Posts</span>
              {selected.posts.map(p => {
                const pc   = PLATFORM_COLORS[p.targetPlatform] || PLATFORM_COLORS.OTHER;
                const icon = CONTENT_TYPE_ICONS[p.contentType] || "📄";
                return (
                  <div key={p.id} className={styles.detailPost}>
                    <div className={styles.detailPostIcon} style={{ background: pc.bg }}>
                      <span>{icon}</span>
                    </div>
                    <div className={styles.detailPostBody}>
                      <span className={styles.detailPostTitle}>{p.title}</span>
                      <span className={styles.detailPostPlatform} style={{ color: pc.color }}>{p.targetPlatform} · {p.contentType}</span>
                    </div>
                    <span className={styles.detailPostStatus} style={{
                      background: p.status === "APPROVED" ? "#dcfce7" : p.status === "PENDING_REVIEW" ? "#fef9c3" : "#f3f4f6",
                      color: p.status === "APPROVED" ? "#166534" : p.status === "PENDING_REVIEW" ? "#854d0e" : "#6b7280",
                    }}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {selected.holidays.length === 0 && selected.posts.length === 0 && (
            <div className={styles.detailEmpty}>
              <span>📅</span><p>Nothing on this day</p>
            </div>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Festivals</span>
        {Object.entries(FESTIVAL_META).map(([type, fm]) => (
          <span key={type} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: fm.color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
        <span className={styles.legendDivider} />
        <span className={styles.legendTitle}>Posts</span>
        {Object.entries(PLATFORM_COLORS).filter(([k]) => k !== "OTHER").map(([key, val]) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: val.dot }} />
            {key.charAt(0) + key.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}