"use client";
import styles from "../styles/plan.module.css";
import portalStyles from "../styles/portal.module.css";

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d" },
  FACEBOOK:  { bg: "#eff6ff", color: "#1d4ed8" },
  YOUTUBE:   { bg: "#fef2f2", color: "#b91c1c" },
  LINKEDIN:  { bg: "#eff6ff", color: "#1e40af" },
  TWITTER_X: { bg: "#f9fafb", color: "#111827" },
  OTHER:     { bg: "#f3f4f6", color: "#374151" },
};

export default function PlanSection({ client, totalQ }) {
  return (
    <section id="plan" className={styles.planSection}>
      <div className={portalStyles.sectionHead}>
        <div>
          <h2 className={portalStyles.sectionTitle}>Monthly Plan</h2>
          <p className={portalStyles.sectionSub}>Your agreed deliverables per platform.</p>
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
  );
}