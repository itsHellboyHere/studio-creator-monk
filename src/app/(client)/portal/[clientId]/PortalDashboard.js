"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { signOut } from "next-auth/react";
import { updateClientProfile, submitPostReview } from "./actions";
import styles from "./portal.module.css";
import PortalCalendar from "./PortalCalendar";

// ── CAROUSEL MEDIA VIEWER ──
// Handles both old single-URL posts and new mediaUrls[] carousel posts
function MediaViewer({ post }) {
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState({});

  // Support both old driveLink (string) and new mediaUrls (array)
  const urls = useMemo(() => {
    if (post?.mediaUrls?.length) return post.mediaUrls.filter(Boolean);
    if (post?.driveLink) return [post.driveLink]; // legacy fallback
    return [];
  }, [post]);

  if (!urls.length) {
    return (
      <div className={styles.noMedia}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>No media attached</span>
      </div>
    );
  }

  const url = urls[index];
  const hasError = errors[url];

  if (hasError) {
    return (
      <div className={styles.noMedia} style={{ color: "#b45309", backgroundColor: "#fffbeb", padding: "20px" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "8px" }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span style={{ color: "#78350f", fontWeight: "600", fontSize: "14px" }}>Media Expired</span>
        <p style={{ fontSize: "11px", marginTop: "6px", maxWidth: "220px", textAlign: "center", color: "#92400e", lineHeight: "1.4", margin: "6px 0 0 0" }}>
          For brand security, raw media assets are automatically deleted from our servers after 7 days.
        </p>
      </div>
    );
  }

  const isGDrive = url?.includes("drive.google.com");
  const isVideo  = url?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);

  const renderMedia = () => {
    if (isGDrive) {
      const embedUrl = url.replace(/\/view.*/, "/preview");
      return <iframe src={embedUrl} className={styles.mediaPlayer} allow="autoplay" title="Content preview" />;
    }
    if (isVideo) {
      return (
        <video key={url} controls playsInline controlsList="nodownload" className={styles.mediaPlayer} onError={() => setErrors(e => ({ ...e, [url]: true }))}>
          <source src={url} />
        </video>
      );
    }
    return <img key={url} src={url} alt={`Slide ${index + 1}`} className={styles.mediaPlayer} onError={() => setErrors(e => ({ ...e, [url]: true }))} />;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0a09" }}>
      {renderMedia()}

      {/* Carousel controls — only shown for multi-slide posts */}
      {urls.length > 1 && (
        <>
          {/* Prev arrow */}
          <button
            type="button"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", display: "grid", placeItems: "center",
              cursor: "pointer", opacity: index === 0 ? 0.3 : 1,
              transition: "opacity 150ms", zIndex: 10,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            type="button"
            onClick={() => setIndex(i => Math.min(urls.length - 1, i + 1))}
            disabled={index === urls.length - 1}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", display: "grid", placeItems: "center",
              cursor: "pointer", opacity: index === urls.length - 1 ? 0.3 : 1,
              transition: "opacity 150ms", zIndex: 10,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Slide counter badge */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 700,
            padding: "4px 10px", borderRadius: 99, zIndex: 10,
            display: "flex", alignItems: "center", gap: 4,
            pointerEvents: "none",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {index + 1} / {urls.length}
          </div>

          {/* Dot indicators */}
          <div style={{
            position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, zIndex: 10,
          }}>
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6, borderRadius: 99,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.4)",
                  border: "none", padding: 0, cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Expiry notice — sits at bottom */}
      <div className={styles.expiryNotice}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        For security, media auto-deletes 7 days after upload.
      </div>
    </div>
  );
}

// ── PLATFORM & CONTENT META ──
const PLATFORM_META = {
  INSTAGRAM: { label: "Instagram", color: "#ec4899", bg: "#fdf2f8" },
  FACEBOOK:  { label: "Facebook",  color: "#3b82f6", bg: "#eff6ff" },
  YOUTUBE:   { label: "YouTube",   color: "#ef4444", bg: "#fef2f2" },
  LINKEDIN:  { label: "LinkedIn",  color: "#6366f1", bg: "#eff6ff" },
  TWITTER_X: { label: "Twitter/X", color: "#6b7280", bg: "#f9fafb" },
  OTHER:     { label: "Other",     color: "#9ca3af", bg: "#f3f4f6" },
};
const CONTENT_TYPE_LABELS = { REEL: "Reel", POST: "Post", STORY: "Story", VIDEO_LONG: "Long Video" };

// ── QUOTA PROGRESS WIDGET ──
function QuotaProgress({ quotas, posts }) {
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
            {totalRemaining === 0 && totalPlanned > 0
              ? "🎉 All posts approved — month complete!"
              : totalApproved === 0
              ? `${totalPlanned} posts planned for this month — none approved yet`
              : `${totalApproved} approved · ${totalRemaining} still to go this month`}
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
          const pm       = PLATFORM_META[platform] || PLATFORM_META.OTHER;
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
                    : <span>{platDone}/{platTotal} approved · <strong>{platLeft} remaining</strong></span>}
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
                        {complete
                          ? <span className={styles.qpComplete}>All {q.amount} approved ✓</span>
                          : done === 0
                          ? <span className={styles.qpZero}>{q.amount} posts planned — none approved yet</span>
                          : <span className={styles.qpPartial}>{done} approved · {left} more to go</span>}
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

// ── NAV ──
const NAV_ITEMS = [
  { id: "overview",  label: "Overview" },
  { id: "content",   label: "Content" },
  { id: "calendar",  label: "Calendar" },
  { id: "plan",      label: "Plan" },
  { id: "profile",   label: "Profile" },
];

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d", dot: "#ec4899" },
  FACEBOOK:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  YOUTUBE:   { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
  LINKEDIN:  { bg: "#eff6ff", color: "#1e40af", dot: "#6366f1" },
  TWITTER_X: { bg: "#f9fafb", color: "#111827", dot: "#6b7280" },
  OTHER:     { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

const STATUS_META = {
  DRAFT:             { label: "Draft",           bg: "#f3f4f6", color: "#6b7280" },
  PENDING_REVIEW:    { label: "Pending Review",  bg: "#fef9c3", color: "#854d0e" },
  APPROVED:          { label: "Approved",        bg: "#dcfce7", color: "#166534" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b" },
};

const POSTS_PER_PAGE = 9;

export default function PortalDashboard({ client, isAdminOrTeam }) {
  const [activeNav, setActiveNav]         = useState("overview");
  const [reviewPost, setReviewPost]       = useState(null);
  const [editOpen, setEditOpen]           = useState(false);
  const [feedback, setFeedback]           = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const overlayRef     = useRef(null);
  const editOverlayRef = useRef(null);
  const contentRef     = useRef(null);

// ── REPLACE THIS USEEFFECT in PortalDashboard.js ──
// Find the one that says:
//   document.body.style.overflow = (reviewPost || editOpen || mobileNavOpen) ? "hidden" : "";
// Replace the entire useEffect with this:

  useEffect(() => {
    const isOpen = !!(reviewPost || editOpen || mobileNavOpen);
    if (isOpen) {
      // Save current scroll position and freeze body in place
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY;
    } else {
      // Restore scroll position when modal closes
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      delete document.body.dataset.scrollY;
      window.scrollTo(0, scrollY);
    }
    return () => {
      // Cleanup on unmount
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (document.body.dataset.scrollY) {
        delete document.body.dataset.scrollY;
        window.scrollTo(0, scrollY);
      }
    };
  }, [reviewPost, editOpen, mobileNavOpen]);

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileNavOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id); }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const allPosts     = client.posts || [];
  const pending      = allPosts.filter(p => p.status === "PENDING_REVIEW");
  const approved     = allPosts.filter(p => p.status === "APPROVED");
  const totalQ       = client.quotas?.reduce((s, q) => s + q.amount, 0) || 0;
  const totalPages   = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const pagedPosts   = allPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  const handleReview = async (action) => {
    if (action === "REJECT" && !feedback.trim()) { alert("Please provide feedback before requesting changes."); return; }
    setSubmitting(true);
    try { await submitPostReview(reviewPost.id, client.id, action, feedback); }
    finally { setReviewPost(null); setFeedback(""); setSubmitting(false); }
  };

  const scrollTo = (id) => {
    window.location.hash = id;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
    setMobileNavOpen(false);
  };

  // Helper: get thumbnail URL for a post (first mediaUrl or legacy driveLink)
  const getThumb = (post) => {
    if (post.mediaUrls?.length) return post.mediaUrls[0];
    return post.driveLink || null;
  };

  // Helper: get slide count for badge
  const getSlideCount = (post) => post.mediaUrls?.length || 1;

  return (
    <div className={styles.portal}>

      {/* ── TOP NAV ── */}
      <nav className={styles.topNav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <div className={styles.navBrand}>
              <div className={styles.navLogo}>
                {client.logoUrl
                  ? <img src={client.logoUrl} alt={client.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "7px" }} />
                  : client.name.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.navBrandInfo}>
                <span className={styles.navClientName}>{client.name}</span>
                <span className={styles.navSub}>Client Portal</span>
              </div>
            </div>
          </div>

          <div className={styles.navLinks}>
            {NAV_ITEMS.map(item => (
              <a key={item.id} href={`#${item.id}`}
                className={`${styles.navLink} ${activeNav === item.id ? styles.navLinkActive : ""}`}
                onClick={(e) => { e.preventDefault(); scrollTo(item.id); }}>
                {item.label}
                {item.id === "content" && pending.length > 0 && <span className={styles.navBadge}>{pending.length}</span>}
              </a>
            ))}
          </div>

          <div className={styles.navRight}>
            {pending.length > 0
              ? <button className={`${styles.pendingPill} ${styles.hideMobile}`} onClick={() => scrollTo("content")}><span className={styles.pingDot} />{pending.length} awaiting review</button>
              : <span className={`${styles.allGoodPill} ${styles.hideMobile}`}>✓ All clear</span>}
            <div className={styles.hideMobile} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.5rem", paddingLeft: "0.75rem", borderLeft: "1px solid var(--border)" }}>
              {isAdminOrTeam && <a href="/dashboard" className={styles.backLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>Dashboard</a>}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutNavBtn} title="Sign Out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
            <button className={styles.hamburger} onClick={() => setMobileNavOpen(v => !v)} aria-label="Toggle navigation" aria-expanded={mobileNavOpen}>
              {mobileNavOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>}
              {pending.length > 0 && !mobileNavOpen && <span className={styles.hamburgerBadge}>{pending.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE NAV DRAWER ── */}
      {mobileNavOpen && (
        <div className={styles.mobileNavBackdrop} onClick={() => setMobileNavOpen(false)}>
          <div className={styles.mobileNavDrawer} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileNavHeader}>
              <span className={styles.mobileNavTitle}>Navigation</span>
              {pending.length > 0 ? <span className={styles.pendingPill} style={{ pointerEvents: "none" }}><span className={styles.pingDot} />{pending.length} pending</span> : <span className={styles.allGoodPill}>✓ All clear</span>}
            </div>
            <div className={styles.mobileNavLinks}>
              {NAV_ITEMS.map(item => (
                <a key={item.id} href={`#${item.id}`}
                  className={`${styles.mobileNavLink} ${activeNav === item.id ? styles.mobileNavLinkActive : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(item.id); }}>
                  <span>{item.label}</span>
                  {item.id === "content" && pending.length > 0 && <span className={styles.navBadge}>{pending.length}</span>}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", opacity: 0.35 }}><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              ))}
            </div>
            <div className={styles.mobileNavFooter}>
              {isAdminOrTeam && <a href="/dashboard" className={styles.mobileBackLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>Back to Dashboard</a>}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.mobileLogoutBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className={styles.main}>

        {/* ── OVERVIEW ── */}
        <section id="overview" className={styles.section}>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <p className={styles.eyebrow}>Client Portal</p>
              <h1 className={styles.heroTitle}>Welcome back,<br /><span className={styles.heroName}>{client.name}</span></h1>
              <p className={styles.heroDesc}>Review your content, track deliverables, and manage your brand.</p>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statBox}><span className={styles.statNum}>{pending.length}</span><span className={styles.statLabel}>Pending Review</span></div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}><span className={styles.statNum}>{approved.length}</span><span className={styles.statLabel}>Approved</span></div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}><span className={styles.statNum}>{totalQ}</span><span className={styles.statLabel}>Monthly Posts</span></div>
            </div>
          </div>

          {pending.length > 0 && (
            <button className={styles.mobilePendingCta} onClick={() => scrollTo("content")}>
              <span className={styles.pingDot} />{pending.length} piece{pending.length > 1 ? "s" : ""} waiting for approval — Review Now →
            </button>
          )}

          {client.quotas?.length > 0 && <QuotaProgress quotas={client.quotas} posts={allPosts} />}
        </section>

        {/* ── CONTENT ── */}
        <section id="content" className={styles.section} ref={contentRef}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Content Pipeline</h2>
              <p className={styles.sectionSub}>Review and approve posts before they go live.{allPosts.length > 0 && <span className={styles.postCount}> · {allPosts.length} total post{allPosts.length !== 1 ? "s" : ""}</span>}</p>
            </div>
            {totalPages > 1 && <div className={styles.pageInfo}>Page {currentPage} of {totalPages}</div>}
          </div>

          {pending.length > 0 && (
            <div className={styles.alertBanner}>
              <div className={styles.alertIcon}><span className={styles.pingDot} /></div>
              <span><strong>{pending.length} piece{pending.length > 1 ? "s" : ""}</strong> waiting for your approval</span>
              <button className={styles.alertCta} onClick={() => setReviewPost(pending[0])}>Review Now →</button>
            </div>
          )}

          {!allPosts.length ? (
            <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><p>No content yet — your team is on it.</p></div>
          ) : (
            <>
              <div className={styles.grid}>
                {pagedPosts.map(post => {
                  const pc         = PLATFORM_COLORS[post.targetPlatform] || PLATFORM_COLORS.OTHER;
                  const sm         = STATUS_META[post.status] || STATUS_META.DRAFT;
                  const isPending  = post.status === "PENDING_REVIEW";
                  const slideCount = getSlideCount(post);
                  const thumbUrl   = getThumb(post);
                  const isImgThumb = thumbUrl && !thumbUrl.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i) && !thumbUrl.includes("drive.google.com");

                  return (
                    <div key={post.id} className={`${styles.card} ${isPending ? styles.cardPending : ""}`}
                      onClick={() => setReviewPost(post)} role="button" tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setReviewPost(post)}>
                      {isPending && <div className={styles.pendingEyebrow}><span className={styles.pendingEyebrowDot} />Action Needed — Awaiting Your Review</div>}

                      <div className={styles.cardTop}>
                        {/* Thumbnail — show actual image if available, else platform icon */}
                        <div className={styles.cardThumb} style={{ background: pc.bg, overflow: "hidden", position: "relative" }}>
                          {isImgThumb ? (
                            <img src={thumbUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pc.dot} strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          )}
                          {/* Carousel badge on thumb */}
                          {slideCount > 1 && (
                            <div style={{
                              position: "absolute", top: 2, right: 2,
                              background: "rgba(0,0,0,0.65)", color: "#fff",
                              fontSize: "8px", fontWeight: 700,
                              padding: "1px 4px", borderRadius: 4,
                              fontFamily: "'DM Sans', sans-serif",
                              lineHeight: 1.4,
                            }}>
                              {slideCount}
                            </div>
                          )}
                        </div>
                        <span className={styles.platformTag} style={{ background: pc.bg, color: pc.color }}>{post.targetPlatform}</span>
                      </div>

                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      {post.caption && <p className={styles.cardCaption}>{post.caption.slice(0, 90)}…</p>}
                      <div className={styles.cardFooter}>
                        <span className={styles.statusTag} style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        {isPending && <span className={styles.reviewHint}>Tap to review →</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    <span className={styles.pageBtnLabel}>Prev</span>
                  </button>
                  <div className={styles.pageNumbers}>
                    {getPageNumbers().map((p, i) => p === "…"
                      ? <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
                      : <button key={p} className={`${styles.pageNum} ${currentPage === p ? styles.pageNumActive : ""}`} onClick={() => goToPage(p)}>{p}</button>)}
                  </div>
                  <button className={styles.pageBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <span className={styles.pageBtnLabel}>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── CALENDAR ── */}
        <section id="calendar" className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2 className={styles.sectionTitle}>Content Calendar</h2><p className={styles.sectionSub}>See what&apos;s scheduled across all platforms.</p></div>
          </div>
          <PortalCalendar posts={client.posts} />
        </section>

        {/* ── PLAN ── */}
        <section id="plan" className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2 className={styles.sectionTitle}>Monthly Plan</h2><p className={styles.sectionSub}>Your agreed deliverables per platform.</p></div>
            <div className={styles.totalBadge}><span className={styles.totalNum}>{totalQ}</span><span className={styles.totalLabel}>posts / mo</span></div>
          </div>
          {!client.quotas?.length ? (
            <div className={styles.empty}><div className={styles.emptyIcon}>📋</div><p>No plan configured yet.</p></div>
          ) : (
            <div className={styles.quotaGrid}>
              {client.quotas.map(q => {
                const pc = PLATFORM_COLORS[q.platform] || PLATFORM_COLORS.OTHER;
                return (
                  <div key={q.id} className={styles.quotaCard}>
                    <div className={styles.quotaLeft} style={{ background: pc.bg }}><span className={styles.quotaNum}>{q.amount}</span></div>
                    <div className={styles.quotaRight}>
                      <span className={styles.quotaPlatform} style={{ color: pc.color }}>{q.platform}</span>
                      <span className={styles.quotaType}>{q.contentType?.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── PROFILE ── */}
        <section id="profile" className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2 className={styles.sectionTitle}>Brand Profile</h2><p className={styles.sectionSub}>Your social links and brand information.</p></div>
            <button className={styles.editBtn} onClick={() => setEditOpen(true)}>Edit Profile</button>
          </div>
          <div className={styles.profileCard}>
            {client.brandDescription && <div className={styles.bioSection}><span className={styles.bioLabel}>About</span><p className={styles.bioText}>{client.brandDescription}</p></div>}
            <div className={styles.socialList}>
              {[
                { label: "Website", val: client.websiteUrl }, { label: "Instagram", val: client.instagramUrl },
                { label: "Facebook", val: client.facebookUrl }, { label: "YouTube", val: client.youtubeUrl },
                { label: "LinkedIn", val: client.linkedinUrl }, { label: "WhatsApp", val: client.whatsappNumber },
                { label: "Twitter / X", val: client.twitterXUrl }, { label: "Other", val: client.otherSocialUrl },
              ].map(s => (
                <div key={s.label} className={styles.socialRow}>
                  <span className={styles.socialLabel}>{s.label}</span>
                  {s.val ? <a href={s.val.startsWith("http") ? s.val : `https://${s.val}`} target="_blank" rel="noreferrer" className={styles.socialLink}>{s.val}</a> : <span className={styles.socialEmpty}>Not connected</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.pageFooter}>
          <p>© {new Date().getFullYear()} CreatorMonk</p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.footerLogoutBtn}>Sign Out</button>
        </div>
      </main>

      <button className={`${styles.scrollTopBtn} ${showScrollTop ? styles.scrollTopVisible : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>

      {/* ── REVIEW MODAL — now with carousel MediaViewer ── */}
      {reviewPost && (
        <div className={styles.overlay} ref={overlayRef} onClick={(e) => e.target === overlayRef.current && (setReviewPost(null), setFeedback(""))}>
          <div className={styles.reviewModal}>
            <div className={styles.modalHead}>
              <div>
                <p className={styles.modalEyebrow}>
                  {reviewPost.targetPlatform} · {reviewPost.contentType}
                  {getSlideCount(reviewPost) > 1 && (
                    <span style={{ marginLeft: 8, background: "rgba(212,81,26,0.1)", color: "var(--orange)", fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>
                      {getSlideCount(reviewPost)} SLIDES
                    </span>
                  )}
                </p>
                <h2 className={styles.modalTitle}>{reviewPost.title}</h2>
              </div>
              <button className={styles.closeBtn} onClick={() => { setReviewPost(null); setFeedback(""); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className={styles.reviewBody}>
              {/* ── LEFT: Carousel Media Viewer ── */}
              <div className={styles.mediaPanel}>
                <MediaViewer post={reviewPost} />
              </div>

              {/* ── RIGHT: Feedback panel ── */}
              <div className={styles.feedbackPanel}>
                {reviewPost.caption && (
                  <div className={styles.captionBox}>
                    <span className={styles.captionLabel}>Proposed Caption</span>
                    <p className={styles.captionText}>{reviewPost.caption}</p>
                  </div>
                )}

                {reviewPost.status === "PENDING_REVIEW" ? (
                  <div className={styles.feedbackBox}>
                    <label className={styles.feedbackLabel}>Your Feedback</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                      placeholder="Looks great! OR Please change slide 2 caption…"
                      className={styles.feedbackInput} rows={5} />
                    <div className={styles.reviewActions}>
                      <button className={styles.rejectBtn} onClick={() => handleReview("REJECT")} disabled={submitting}>Request Changes</button>
                      <button className={styles.approveBtn} onClick={() => handleReview("APPROVE")} disabled={submitting}>{submitting ? "Saving…" : "✓ Approve"}</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.readOnlyBox}>
                    <div className={styles.readOnlyHeader}>
                      <span className={styles.readOnlyStatus} style={{ color: STATUS_META[reviewPost.status].color, backgroundColor: STATUS_META[reviewPost.status].bg }}>
                        Status: {STATUS_META[reviewPost.status].label}
                      </span>
                    </div>
                    {reviewPost.clientNote
                      ? <div className={styles.readOnlyNote}><span className={styles.readOnlyNoteLabel}>Your Feedback:</span><p>{reviewPost.clientNote}</p></div>
                      : <p className={styles.readOnlyNoteEmpty}>This deliverable has been processed by your team.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div className={styles.overlay} ref={editOverlayRef} onClick={(e) => e.target === editOverlayRef.current && setEditOpen(false)}>
          <div className={styles.editModal}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Update Brand Profile</h3>
              <button className={styles.closeBtn} onClick={() => setEditOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form action={async (fd) => { await updateClientProfile(client.id, fd); setEditOpen(false); }} className={styles.editForm}>
              <div className={styles.field}><span className={styles.fieldLabel}>Brand Bio</span><textarea name="brandDescription" defaultValue={client.brandDescription || ""} rows={3} placeholder="Describe your brand…" className={styles.fieldTextarea} /></div>
              <div className={styles.fieldGrid}>
                {[
                  { name: "websiteUrl", label: "Website URL", val: client.websiteUrl },
                  { name: "whatsappNumber", label: "WhatsApp", val: client.whatsappNumber },
                  { name: "instagramUrl", label: "Instagram URL", val: client.instagramUrl },
                  { name: "facebookUrl", label: "Facebook URL", val: client.facebookUrl },
                  { name: "youtubeUrl", label: "YouTube URL", val: client.youtubeUrl },
                  { name: "linkedinUrl", label: "LinkedIn URL", val: client.linkedinUrl },
                  { name: "twitterXUrl", label: "Twitter / X URL", val: client.twitterXUrl },
                  { name: "otherSocialUrl", label: "Other Link", val: client.otherSocialUrl },
                ].map(f => (
                  <div key={f.name} className={styles.field}><span className={styles.fieldLabel}>{f.label}</span><input name={f.name} defaultValue={f.val || ""} placeholder="https://…" className={styles.fieldInput} /></div>
                ))}
              </div>
              <div className={styles.editActions}>
                <button type="button" onClick={() => setEditOpen(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}