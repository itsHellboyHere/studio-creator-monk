import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.shell}>
      {/* Nav skeleton */}
      <div className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <div className={`${styles.bone} ${styles.navLogo}`} />
            <div className={styles.navMeta}>
              <div className={`${styles.bone} ${styles.navName}`} />
              <div className={`${styles.bone} ${styles.navSub}`} />
            </div>
          </div>
          <div className={styles.navLinks}>
            {[80, 64, 48, 60].map((w, i) => (
              <div key={i} className={`${styles.bone} ${styles.navLink}`} style={{ width: w }} />
            ))}
          </div>
          <div className={`${styles.bone} ${styles.navPill}`} />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={`${styles.bone} ${styles.eyebrow}`} />
            <div className={`${styles.bone} ${styles.heroTitle}`} />
            <div className={`${styles.bone} ${styles.heroTitle2}`} />
            <div className={`${styles.bone} ${styles.heroDesc}`} />
          </div>
          <div className={`${styles.bone} ${styles.statsBlock}`} />
        </div>

        {/* Section */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.headLeft}>
              <div className={`${styles.bone} ${styles.sectionTitle}`} />
              <div className={`${styles.bone} ${styles.sectionSub}`} />
            </div>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.card} style={{ animationDelay: `${i * 60}ms` }}>
                <div className={styles.cardTop}>
                  <div className={`${styles.bone} ${styles.cardThumb}`} />
                  <div className={`${styles.bone} ${styles.cardTag}`} />
                </div>
                <div className={`${styles.bone} ${styles.cardTitle}`} />
                <div className={`${styles.bone} ${styles.cardCaption}`} />
                <div className={`${styles.bone} ${styles.cardCaption2}`} />
                <div className={styles.cardFooter}>
                  <div className={`${styles.bone} ${styles.cardStatus}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}