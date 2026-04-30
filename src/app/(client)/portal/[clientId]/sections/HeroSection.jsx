"use client";
import { useMemo } from "react";
import QuotaProgress from "../QuotaProgress";
import styles from "../styles/hero.module.css";

export default function HeroSection({ client, pending, approved, totalQ, unrequestedUpcoming, scrollTo }) {
  return (
    <section id="overview" className={styles.section} style={{ scrollMarginTop: 78 }}>

      {/* Hero Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroCardTop}>
          <div className={styles.heroCardLeft}>
            <div className={styles.heroBrand}>
              <div className={styles.heroBrandLogo}>
                {client.logoUrl
                  ? <img src={client.logoUrl} alt={client.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} />
                  : <span>{client.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div>
                <p className={styles.eyebrow}>Client Portal</p>
                <h1 className={styles.heroTitle}>{client.name}</h1>
              </div>
            </div>
            <p className={styles.heroDesc}>
              {client.brandDescription || "Review your content, track deliverables, and manage your brand."}
            </p>
          </div>
          <div className={styles.heroCardRight}>
            {pending.length > 0 ? (
              <button className={styles.heroPendingBtn} onClick={() => scrollTo("content")}>
                <span className={styles.pingDot} />
                <span>{pending.length} pending review</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ) : (
              <span className={styles.allGoodPill}>✓ All clear</span>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum} style={{ color: pending.length > 0 ? "#d97706" : "var(--text1)" }}>
              {pending.length}
            </span>
            <span className={styles.heroStatLabel}>Needs Review</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum} style={{ color: "#16a34a" }}>
              {client.posts?.filter(p => p.status === "APPROVED").length || 0}
            </span>
            <span className={styles.heroStatLabel}>Total Approved</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{totalQ}</span>
            <span className={styles.heroStatLabel}>Monthly Plan</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{client.posts?.length || 0}</span>
            <span className={styles.heroStatLabel}>Total Posts</span>
          </div>
        </div>
      </div>

      {/* Festive Banner */}
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

      {/* Mobile pending CTA */}
      {pending.length > 0 && (
        <button className={styles.mobilePendingCta} onClick={() => scrollTo("content")}>
          <span className={styles.pingDot} />
          {pending.length} piece{pending.length > 1 ? "s" : ""} waiting for approval — Review Now →
        </button>
      )}

      {/* Quota Progress */}
      {client.quotas?.length > 0 && (
        <QuotaProgress quotas={client.quotas} posts={client.posts} />
      )}
    </section>
  );
}