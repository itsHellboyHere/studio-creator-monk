"use client";
import { useState, useEffect, useRef, useCallback ,useMemo} from "react";
import { signOut } from "next-auth/react";
import { updateClientProfile, submitPostReview } from "./actions";
import styles from "./portal.module.css";
import PortalCalendar from "./PortalCalendar";
import MediaViewer from "./MediaViewer";
import QuotaProgress from "./QuotaProgress";
import ReviewModal from "./ReviewModal";
import FestiveCalendar from "./FestiveCaledar";

// ── constants ──
const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "calendar", label: "Calendar" },
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

export default function PortalDashboard({ client, isAdminOrTeam, holidays, festiveRequests }) {
  const [activeNav, setActiveNav] = useState("overview");
  const [reviewPost, setReviewPost] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  // ── Scroll lock (iOS Safari) ──
  useEffect(() => {
    const isOpen = !!(reviewPost || editOpen || mobileNavOpen);
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.top = "";
      document.body.style.position = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
      delete document.body.dataset.scrollY;
    }
    return () => {
      if (document.body.dataset.scrollY) {
        const scrollY = parseInt(document.body.dataset.scrollY, 10);
        document.body.style.top = document.body.style.position = document.body.style.left = document.body.style.right = document.body.style.overflow = "";
        window.scrollTo({ top: scrollY, behavior: "instant" });
        delete document.body.dataset.scrollY;
      }
    };
  }, [reviewPost, editOpen, mobileNavOpen]);

  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setMobileNavOpen(false); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.id); }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const allPosts = client.posts || [];
  const pending = allPosts.filter(p => p.status === "PENDING_REVIEW");
  const approved = allPosts.filter(p => p.status === "APPROVED");
  const totalQ = client.quotas?.reduce((s, q) => s + q.amount, 0) || 0;
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const pagedPosts = allPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

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

  // ── scrollTo: close drawer first, then scroll after body unlock ──
  const scrollTo = useCallback((id) => {
    setMobileNavOpen(false);
    setActiveNav(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
      });
    });
  }, []);

  const getThumb = (post) => post.mediaUrls?.length ? post.mediaUrls[0] : (post.driveLink || null);
  const getSlideCount = (post) => post.mediaUrls?.length || 1;
  // Upcoming festivals in next 14 days that haven't been requested yet
  const unrequestedUpcoming = useMemo(() => {
    const requestedKeys = new Set(
      (client.festiveRequests || []).map(r =>
        `${new Date(r.festivalDate).toISOString().slice(0, 10)}__${r.festivalName}`
      )
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 14);
    return (holidays || []).filter(h => {
      const d = new Date(h.date?.iso);
      const key = `${h.date?.iso?.slice(0, 10)}__${h.name}`;
      return d >= new Date() && d <= cutoff && !requestedKeys.has(key);
    }).slice(0, 3);
  }, [holidays, client.festiveRequests]);


  return (
    <div className={styles.portal}>

      {/* ── NAV ── */}
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
              {isAdminOrTeam && <a href="/dashboard" className={styles.backLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>Dashboard</a>}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutNavBtn} title="Sign Out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
            <button className={styles.hamburger} onClick={() => setMobileNavOpen(v => !v)} aria-label="Toggle navigation">
              {mobileNavOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>}
              {pending.length > 0 && !mobileNavOpen && <span className={styles.hamburgerBadge}>{pending.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {mobileNavOpen && (
        <div className={styles.mobileNavBackdrop} onClick={() => setMobileNavOpen(false)}>
          <div className={styles.mobileNavDrawer} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileNavHeader}>
              <span className={styles.mobileNavTitle}>Navigation</span>
              {pending.length > 0
                ? <span className={styles.pendingPill} style={{ pointerEvents: "none" }}><span className={styles.pingDot} />{pending.length} pending</span>
                : <span className={styles.allGoodPill}>✓ All clear</span>}
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
              {isAdminOrTeam && <a href="/dashboard" className={styles.mobileBackLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>Back to Dashboard</a>}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.mobileLogoutBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className={styles.main}>

        {/* OVERVIEW */}
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
          {unrequestedUpcoming.length > 0 && (
            <div className={styles.festiveBanner}>
              <div className={styles.festiveBannerLeft}>
                <span className={styles.festiveBannerEmoji}>🪔</span>
                <div>
                  <p className={styles.festiveBannerTitle}>
                    {unrequestedUpcoming.length === 1
                      ? `${unrequestedUpcoming[0].name} is coming up`
                      : `${unrequestedUpcoming.length} festivals coming up`}
                  </p>
                  <p className={styles.festiveBannerSub}>
                    {unrequestedUpcoming.map(h => h.name).join(", ")} — do you want posts for these?
                  </p>
                </div>
              </div>
              <button className={styles.festiveBannerCta} onClick={() => scrollTo("calendar")}>
                Select Now →
              </button>
            </div>
          )}
          {client.quotas?.length > 0 && <QuotaProgress quotas={client.quotas} posts={allPosts} />}
        </section>

        {/* CONTENT */}
        <section id="content" className={styles.section} ref={contentRef}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Content Pipeline</h2>
              <p className={styles.sectionSub}>Review and approve posts before they go live.{allPosts.length > 0 && <span className={styles.postCount}> · {allPosts.length} total</span>}</p>
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
                  const pc = PLATFORM_COLORS[post.targetPlatform] || PLATFORM_COLORS.OTHER;
                  const sm = STATUS_META[post.status] || STATUS_META.DRAFT;
                  const isPending = post.status === "PENDING_REVIEW";
                  const slideCount = getSlideCount(post);
                  const thumbUrl = getThumb(post);
                  const isImgThumb = thumbUrl && !thumbUrl.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i) && !thumbUrl.includes("drive.google.com");
                  return (
                    <div key={post.id} className={`${styles.card} ${isPending ? styles.cardPending : ""}`}
                      onClick={() => setReviewPost(post)} role="button" tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setReviewPost(post)}>
                      {isPending && <div className={styles.pendingEyebrow}><span className={styles.pendingEyebrowDot} />Action Needed — Awaiting Your Review</div>}
                      <div className={styles.cardTop}>
                        <div className={styles.cardThumb} style={{ background: pc.bg, overflow: "hidden", position: "relative" }}>
                          {isImgThumb
                            ? <img src={thumbUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pc.dot} strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
                          {slideCount > 1 && (
                            <div style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "8px", fontWeight: 700, padding: "1px 4px", borderRadius: 4, lineHeight: 1.4 }}>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    <span className={styles.pageBtnLabel}>Prev</span>
                  </button>
                  <div className={styles.pageNumbers}>
                    {getPageNumbers().map((p, i) => p === "…"
                      ? <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
                      : <button key={p} className={`${styles.pageNum} ${currentPage === p ? styles.pageNumActive : ""}`} onClick={() => goToPage(p)}>{p}</button>)}
                  </div>
                  <button className={styles.pageBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <span className={styles.pageBtnLabel}>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* CALENDAR */}
        <section id="calendar" className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2 className={styles.sectionTitle}>Content Calendar</h2><p className={styles.sectionSub}>See what&apos;s scheduled across all platforms.</p></div>
          </div>
          <FestiveCalendar
  posts={client.posts}
  holidays={holidays || []}
  festiveRequests={client.festiveRequests || []}
  clientId={client.id}
/>
        </section>

        {/* PLAN */}
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

        {/* PROFILE */}
        <section id="profile" className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2 className={styles.sectionTitle}>Brand Profile</h2><p className={styles.sectionSub}>Your social links and brand information.</p></div>
            <button className={styles.editBtn} onClick={() => setEditOpen(true)}>Edit Profile</button>
          </div>
          <div className={styles.profileCard}>
            {client.brandDescription && <div className={styles.bioSection}><span className={styles.bioLabel}>About</span><p className={styles.bioText}>{client.brandDescription}</p></div>}
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
                  {s.val
                    ? <a href={s.val.startsWith("http") ? s.val : `https://${s.val}`} target="_blank" rel="noreferrer" className={styles.socialLink}>{s.val}</a>
                    : <span className={styles.socialEmpty}>Not connected</span>}
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

      <button className={`${styles.scrollTopBtn} ${showScrollTop ? styles.scrollTopVisible : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>

      {/* ── REVIEW MODAL ── */}
      {reviewPost && (
        <ReviewModal
          post={reviewPost}
          feedback={feedback}
          onFeedbackChange={setFeedback}
          onClose={() => { setReviewPost(null); setFeedback(""); }}
          onApprove={() => handleReview("APPROVE")}
          onReject={() => handleReview("REJECT")}
          submitting={submitting}
        />
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {editOpen && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}>
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