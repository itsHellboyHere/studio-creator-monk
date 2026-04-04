"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react"; // <-- Import signOut
import { updateClientProfile, submitPostReview } from "./actions";
import styles from "./portal.module.css";

// --- SUB-COMPONENT: Smart Media Viewer ---
function MediaViewer({ url }) {
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className={styles.noMedia}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>No media attached</span>
      </div>
    );
  }

  // File was deleted from S3 after 7 days
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

  // Legacy support: If it's a Google Drive link, use the iframe
  if (url.includes("drive.google.com")) {
    const embedUrl = url.replace(/\/view.*/, "/preview");
    return <iframe src={embedUrl} className={styles.mediaPlayer} allow="autoplay" title="Content preview" />;
  }

  // New S3 Links: Native Video Player
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
  if (isVideo) {
    return (
      <video
        controls
        playsInline
        controlsList="nodownload"
        className={styles.mediaPlayer}
        onError={() => setHasError(true)} // Catches the AWS deletion
      >
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Native Image Viewer
  return (
    <img
      src={url}
      alt="Deliverable Preview"
      className={styles.mediaPlayer}
      onError={() => setHasError(true)} // Catches the AWS deletion
    />
  );
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "plan", label: "Plan" },
  { id: "profile", label: "Profile" },
];

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d", dot: "#ec4899" },
  FACEBOOK: { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  YOUTUBE: { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
  LINKEDIN: { bg: "#eff6ff", color: "#1e40af", dot: "#6366f1" },
  TWITTER_X: { bg: "#f9fafb", color: "#111827", dot: "#6b7280" },
  OTHER: { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

const STATUS_META = {
  DRAFT: { label: "Draft", bg: "#f3f4f6", color: "#6b7280" },
  PENDING_REVIEW: { label: "Pending Review", bg: "#fef9c3", color: "#854d0e" },
  APPROVED: { label: "Approved", bg: "#dcfce7", color: "#166534" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b" },
};

const POSTS_PER_PAGE = 9;

export default function PortalDashboard({ client, isAdminOrTeam }) {
  const [activeNav, setActiveNav] = useState("overview");
  const [reviewPost, setReviewPost] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const overlayRef = useRef(null);
  const editOverlayRef = useRef(null);
  const contentRef = useRef(null);

  // Lock body scroll when modal / mobile nav open
  useEffect(() => {
    document.body.style.overflow = (reviewPost || editOpen || mobileNavOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [reviewPost, editOpen, mobileNavOpen]);

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileNavOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Scroll-to-top button visibility — appears after 300 px
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Active section tracking
  useEffect(() => {
    const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id); }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const allPosts = client.posts || [];
  const pending = allPosts.filter(p => p.status === "PENDING_REVIEW");
  const approved = allPosts.filter(p => p.status === "APPROVED");
  const totalQ = client.quotas?.reduce((s, q) => s + q.amount, 0) || 0;

  // Pagination
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const pagedPosts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  // Page number array with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  const handleReview = async (action) => {
    if (action === "REJECT" && !feedback.trim()) {
      alert("Please provide feedback before requesting changes.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPostReview(reviewPost.id, client.id, action, feedback);
    } finally {
      setReviewPost(null);
      setFeedback("");
      setSubmitting(false);
    }
  };

  const scrollTo = (id) => {
    window.location.hash = id;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
    setMobileNavOpen(false);
  };

  return (
    <div className={styles.portal}>

      {/* ── TOP NAV ── */}
      <nav className={styles.topNav}>
        <div className={styles.navInner}>

          <div className={styles.navLeft}>
            <div className={styles.navBrand}>
              <div className={styles.navLogo}>
                {client.logoUrl ? (
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "7px" }}
                  />
                ) : (
                  client.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className={styles.navBrandInfo}>
                <span className={styles.navClientName}>{client.name}</span>
                <span className={styles.navSub}>Client Portal</span>
              </div>
            </div>
          </div>

          <div className={styles.navLinks}>
            {NAV_ITEMS.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`${styles.navLink} ${activeNav === item.id ? styles.navLinkActive : ""}`}
                onClick={(e) => { e.preventDefault(); scrollTo(item.id); }}
              >
                {item.label}
                {item.id === "content" && pending.length > 0 && (
                  <span className={styles.navBadge}>{pending.length}</span>
                )}
              </a>
            ))}
          </div>

          <div className={styles.navRight}>
            {pending.length > 0 ? (
              <button className={`${styles.pendingPill} ${styles.hideMobile}`} onClick={() => scrollTo("content")}>
                <span className={styles.pingDot} />
                {pending.length} awaiting review
              </button>
            ) : (
              <span className={`${styles.allGoodPill} ${styles.hideMobile}`}>✓ All clear</span>
            )}

            {/* Desktop Log Out / Dashboard Buttons */}
            <div className={styles.hideMobile} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)' }}>
              {isAdminOrTeam && (
                <a href="/dashboard" className={styles.backLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Dashboard
                </a>
              )}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutNavBtn} title="Sign Out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>

            <button
              className={styles.hamburger}
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              )}
              {pending.length > 0 && !mobileNavOpen && (
                <span className={styles.hamburgerBadge}>{pending.length}</span>
              )}
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
              {pending.length > 0 ? (
                <span className={styles.pendingPill} style={{ pointerEvents: "none" }}>
                  <span className={styles.pingDot} />
                  {pending.length} pending
                </span>
              ) : (
                <span className={styles.allGoodPill}>✓ All clear</span>
              )}
            </div>
            <div className={styles.mobileNavLinks}>
              {NAV_ITEMS.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`${styles.mobileNavLink} ${activeNav === item.id ? styles.mobileNavLinkActive : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(item.id); }}
                >
                  <span>{item.label}</span>
                  {item.id === "content" && pending.length > 0 && (
                    <span className={styles.navBadge}>{pending.length}</span>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", opacity: 0.35 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              ))}
            </div>

            <div className={styles.mobileNavFooter}>
              {isAdminOrTeam && (
                <a href="/dashboard" className={styles.mobileBackLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to Dashboard
                </a>
              )}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.mobileLogoutBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
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
              <h1 className={styles.heroTitle}>
                Welcome back,<br />
                <span className={styles.heroName}>{client.name}</span>
              </h1>
              <p className={styles.heroDesc}>
                Review your content, track deliverables, and manage your brand.
              </p>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{pending.length}</span>
                <span className={styles.statLabel}>Pending Review</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statNum}>{approved.length}</span>
                <span className={styles.statLabel}>Approved</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statNum}>{totalQ}</span>
                <span className={styles.statLabel}>Monthly Posts</span>
              </div>
            </div>
          </div>

          {pending.length > 0 && (
            <button className={styles.mobilePendingCta} onClick={() => scrollTo("content")}>
              <span className={styles.pingDot} />
              {pending.length} piece{pending.length > 1 ? "s" : ""} waiting for approval — Review Now →
            </button>
          )}
        </section>

        {/* ── CONTENT ── */}
        <section id="content" className={styles.section} ref={contentRef}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Content Pipeline</h2>
              <p className={styles.sectionSub}>
                Review and approve posts before they go live.
                {allPosts.length > 0 && (
                  <span className={styles.postCount}> · {allPosts.length} total post{allPosts.length !== 1 ? "s" : ""}</span>
                )}
              </p>
            </div>
            {totalPages > 1 && (
              <div className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div className={styles.alertBanner}>
              <div className={styles.alertIcon}>
                <span className={styles.pingDot} />
              </div>
              <span>
                <strong>{pending.length} piece{pending.length > 1 ? "s" : ""}</strong> waiting for your approval
              </span>
              <button className={styles.alertCta} onClick={() => setReviewPost(pending[0])}>
                Review Now →
              </button>
            </div>
          )}

          {!allPosts.length ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📭</div>
              <p>No content yet — your team is on it.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {pagedPosts.map(post => {
                  const pc = PLATFORM_COLORS[post.targetPlatform] || PLATFORM_COLORS.OTHER;
                  const sm = STATUS_META[post.status] || STATUS_META.DRAFT;
                  const isPending = post.status === "PENDING_REVIEW";

                  return (
                    <div
                      key={post.id}
                      className={`${styles.card} ${isPending ? styles.cardPending : ""}`}
                      onClick={() => setReviewPost(post)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setReviewPost(post)}
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.cardThumb} style={{ background: pc.bg }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pc.dot} strokeWidth="1.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                        <span className={styles.platformTag} style={{ background: pc.bg, color: pc.color }}>
                          {post.targetPlatform}
                        </span>
                      </div>
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      {post.caption && (
                        <p className={styles.cardCaption}>{post.caption.slice(0, 90)}…</p>
                      )}
                      <div className={styles.cardFooter}>
                        <span className={styles.statusTag} style={{ background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                        {isPending && <span className={styles.reviewHint}>Tap to review →</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── PAGINATION ── */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span className={styles.pageBtnLabel}>Prev</span>
                  </button>

                  <div className={styles.pageNumbers}>
                    {getPageNumbers().map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                      ) : (
                        <button
                          key={p}
                          className={`${styles.pageNum} ${currentPage === p ? styles.pageNumActive : ""}`}
                          onClick={() => goToPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={currentPage === p ? "page" : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className={styles.pageBtn}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <span className={styles.pageBtnLabel}>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── PLAN ── */}
        <section id="plan" className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Monthly Plan</h2>
              <p className={styles.sectionSub}>Your agreed deliverables per platform.</p>
            </div>
            <div className={styles.totalBadge}>
              <span className={styles.totalNum}>{totalQ}</span>
              <span className={styles.totalLabel}>posts / mo</span>
            </div>
          </div>

          {!client.quotas?.length ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <p>No plan configured yet.</p>
            </div>
          ) : (
            <div className={styles.quotaGrid}>
              {client.quotas.map(q => {
                const pc = PLATFORM_COLORS[q.platform] || PLATFORM_COLORS.OTHER;
                return (
                  <div key={q.id} className={styles.quotaCard}>
                    <div className={styles.quotaLeft} style={{ background: pc.bg }}>
                      <span className={styles.quotaNum}>{q.amount}</span>
                    </div>
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
            <div>
              <h2 className={styles.sectionTitle}>Brand Profile</h2>
              <p className={styles.sectionSub}>Your social links and brand information.</p>
            </div>
            <button className={styles.editBtn} onClick={() => setEditOpen(true)}>
              Edit Profile
            </button>
          </div>

          <div className={styles.profileCard}>
            {client.brandDescription && (
              <div className={styles.bioSection}>
                <span className={styles.bioLabel}>About</span>
                <p className={styles.bioText}>{client.brandDescription}</p>
              </div>
            )}
            <div className={styles.socialList}>
              {[
                { label: "Website", val: client.websiteUrl },
                { label: "Instagram", val: client.instagramUrl },
                { label: "Facebook", val: client.facebookUrl },
                { label: "YouTube", val: client.youtubeUrl },
                { label: "LinkedIn", val: client.linkedinUrl },
                { label: "WhatsApp", val: client.whatsappNumber },
                { label: "Twitter / X", val: client.twitterXUrl },
                { label: "Other", val: client.otherSocialUrl },
              ].map(s => (
                <div key={s.label} className={styles.socialRow}>
                  <span className={styles.socialLabel}>{s.label}</span>
                  {s.val ? (
                    <a
                      href={s.val.startsWith("http") ? s.val : `https://${s.val}`}
                      target="_blank" rel="noreferrer"
                      className={styles.socialLink}
                    >
                      {s.val}
                    </a>
                  ) : (
                    <span className={styles.socialEmpty}>Not connected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Simple Page Footer with Logout */}
        <div className={styles.pageFooter}>
          <p>© {new Date().getFullYear()} CreatorMonk</p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.footerLogoutBtn}>
            Sign Out
          </button>
        </div>

      </main>

      {/* ── SCROLL TO TOP ── */}
      <button
        className={`${styles.scrollTopBtn} ${showScrollTop ? styles.scrollTopVisible : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* ── REVIEW MODAL ── */}
      {reviewPost && (
        <div
          className={styles.overlay}
          ref={overlayRef}
          onClick={(e) => e.target === overlayRef.current && (setReviewPost(null), setFeedback(""))}
        >
          <div className={styles.reviewModal}>
            <div className={styles.modalHead}>
              <div>
                <p className={styles.modalEyebrow}>{reviewPost.targetPlatform} · {reviewPost.contentType}</p>
                <h2 className={styles.modalTitle}>{reviewPost.title}</h2>
              </div>
              <button className={styles.closeBtn} onClick={() => { setReviewPost(null); setFeedback(""); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.reviewBody}>
              {/* NATIVE S3 MEDIA VIEWER */}
              <div className={styles.mediaPanel}>
                <MediaViewer url={reviewPost.driveLink} />

                {/* S3 7-DAY DELETION NOTICE */}
                <div className={styles.expiryNotice}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  For security, media auto-deletes 7 days after upload.
                </div>
              </div>

              <div className={styles.feedbackPanel}>
                {reviewPost.caption && (
                  <div className={styles.captionBox}>
                    <span className={styles.captionLabel}>Proposed Caption</span>
                    <p className={styles.captionText}>{reviewPost.caption}</p>
                  </div>
                )}

                {/* Conditional Rendering: Pending vs Processed */}
                {reviewPost.status === "PENDING_REVIEW" ? (
                  <div className={styles.feedbackBox}>
                    <label className={styles.feedbackLabel}>Your Feedback</label>
                    <textarea
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Looks great! OR Please change the music at 0:05..."
                      className={styles.feedbackInput}
                      rows={5}
                    />
                    <div className={styles.reviewActions}>
                      <button className={styles.rejectBtn} onClick={() => handleReview("REJECT")} disabled={submitting}>
                        Request Changes
                      </button>
                      <button className={styles.approveBtn} onClick={() => handleReview("APPROVE")} disabled={submitting}>
                        {submitting ? "Saving…" : "✓ Approve"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-Only State for Approved or Rejected Posts */
                  <div className={styles.readOnlyBox}>
                    <div className={styles.readOnlyHeader}>
                      <span className={styles.readOnlyStatus} style={{ color: STATUS_META[reviewPost.status].color, backgroundColor: STATUS_META[reviewPost.status].bg }}>
                        Status: {STATUS_META[reviewPost.status].label}
                      </span>
                    </div>
                    {reviewPost.clientNote ? (
                      <div className={styles.readOnlyNote}>
                        <span className={styles.readOnlyNoteLabel}>Your Feedback:</span>
                        <p>{reviewPost.clientNote}</p>
                      </div>
                    ) : (
                      <p className={styles.readOnlyNoteEmpty}>This deliverable has been processed by your team.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div
          className={styles.overlay}
          ref={editOverlayRef}
          onClick={(e) => e.target === editOverlayRef.current && setEditOpen(false)}
        >
          <div className={styles.editModal}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Update Brand Profile</h3>
              <button className={styles.closeBtn} onClick={() => setEditOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form
              action={async (fd) => {
                await updateClientProfile(client.id, fd);
                setEditOpen(false);
              }}
              className={styles.editForm}
            >
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Brand Bio</span>
                <textarea name="brandDescription" defaultValue={client.brandDescription || ""} rows={3} placeholder="Describe your brand…" className={styles.fieldTextarea} />
              </div>
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
                  <div key={f.name} className={styles.field}>
                    <span className={styles.fieldLabel}>{f.label}</span>
                    <input name={f.name} defaultValue={f.val || ""} placeholder="https://…" className={styles.fieldInput} />
                  </div>
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