"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { signOut } from "next-auth/react";
import { submitPostReview } from "./actions";
import styles from "./styles/portal.module.css";
import ReviewModal from "./ReviewModal";
import FestiveCalendar from "./FestiveCaledar";
import HeroSection from "./sections/HeroSection";
import ContentSection from "./sections/ContentSecions";
import PlanSection from "./sections/PlanSection";
import ProfileSection from "./sections/ProfileSection";
import { initPostHog, posthog } from "@/lib/posthog";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "content",  label: "Content" },
  { id: "calendar", label: "Calendar" },
  { id: "plan",     label: "Plan" },
  { id: "profile",  label: "Profile" },
];

export default function PortalDashboard({ client, isAdminOrTeam, holidays }) {
  const [activeNav, setActiveNav]         = useState("overview");
  const [reviewPost, setReviewPost]       = useState(null);
  const [feedback, setFeedback]           = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const savedScrollY = useRef(0);

  // Scroll lock
  useEffect(() => {
    const isOpen = !!(reviewPost || mobileNavOpen);
    if (isOpen) {
      savedScrollY.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = "0"; document.body.style.right = "0"; document.body.style.overflow = "hidden";
    } else {
      const wasLocked = document.body.style.position === "fixed";
      document.body.style.top = document.body.style.position = document.body.style.left = document.body.style.right = document.body.style.overflow = "";
      if (wasLocked) window.scrollTo(0, savedScrollY.current);
    }
    return () => {
      if (document.body.style.position === "fixed") {
        document.body.style.top = document.body.style.position = document.body.style.left = document.body.style.right = document.body.style.overflow = "";
        window.scrollTo(0, savedScrollY.current);
      }
    };
  }, [reviewPost, mobileNavOpen]);

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


    // PostHog tracking
useEffect(() => {
  initPostHog();

  // Identify client
  posthog.identify(client.id, {
    name: client.name,
    type: "client",
    industry: client.brandDescription || "unknown",
  });

  // Track portal open
  posthog.capture("portal_opened", {
    clientId: client.id,
    clientName: client.name,
    pendingPosts: pending.length,
    approvedPosts: approved.length,
  });

  // Notify team via push
  fetch("/api/portal-live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: client.id, clientName: client.name }),
  }).catch(() => {});

  return () => {
    posthog.capture("portal_closed", { clientId: client.id });
  };
}, [client.id]);


  const allPosts = client.posts || [];
  const pending  = allPosts.filter(p => p.status === "PENDING_REVIEW");
  const approved = allPosts.filter(p => p.status === "APPROVED");
  const totalQ   = client.quotas?.reduce((s, q) => s + q.amount, 0) || 0;

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

  const handleReview = async (action) => {
    if (action === "REJECT" && !feedback.trim()) { alert("Please provide feedback before requesting changes."); return; }
    setSubmitting(true);
    try { await submitPostReview(reviewPost.id, client.id, action, feedback); }
    finally { setReviewPost(null); setFeedback(""); setSubmitting(false); }
  };

  const scrollTo = useCallback((id) => {
    setMobileNavOpen(false);
    setActiveNav(id);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
    }));
  }, []);




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
              {isAdminOrTeam && <a href="/clients" className={styles.backLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>Dashboard</a>}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutNavBtn} title="Sign Out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
            <button className={styles.hamburger} onClick={() => setMobileNavOpen(v => !v)}>
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
                ? <span className={styles.pendingPill}><span className={styles.pingDot} />{pending.length} pending</span>
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
              {isAdminOrTeam && <a href="/clients" className={styles.mobileBackLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>Back to Dashboard</a>}
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
        <HeroSection
          client={client}
          pending={pending}
          approved={approved}
          totalQ={totalQ}
          unrequestedUpcoming={unrequestedUpcoming}
          scrollTo={scrollTo}
        />

        <ContentSection
          allPosts={allPosts}
          pending={pending}
          setReviewPost={setReviewPost}
        />

        {/* Calendar */}
        <section id="calendar" style={{ scrollMarginTop: 78 }}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Content Calendar</h2>
              <p className={styles.sectionSub}>See what's scheduled across all platforms.</p>
            </div>
          </div>
          <FestiveCalendar
            posts={client.posts}
            holidays={holidays || []}
            festiveRequests={client.festiveRequests || []}
            clientId={client.id}
          />
        </section>

        <PlanSection client={client} totalQ={totalQ} />

        <ProfileSection client={client} />

        <div className={styles.pageFooter}>
          <p>© {new Date().getFullYear()} CreatorMonk</p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.footerLogoutBtn}>Sign Out</button>
        </div>
      </main>

      <button
        className={`${styles.scrollTopBtn} ${showScrollTop ? styles.scrollTopVisible : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>

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
    </div>
  );
}