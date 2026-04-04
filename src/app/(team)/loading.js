import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.shell}>
      {/* Header skeleton */}
      <div className={styles.header}>
        <div className={styles.col}>
          <div className={`${styles.bone} ${styles.eyebrow}`} />
          <div className={`${styles.bone} ${styles.title}`} />
          <div className={`${styles.bone} ${styles.sub}`} />
        </div>
        <div className={`${styles.bone} ${styles.statBlock}`} />
      </div>

      {/* Section label */}
      <div className={styles.sectionRow}>
        <div className={`${styles.bone} ${styles.sectionLabel}`} />
        <div className={styles.sectionLine} />
      </div>

      {/* Card grid */}
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.card} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={styles.cardTop}>
              <div className={`${styles.bone} ${styles.cardLabel}`} />
              <div className={`${styles.bone} ${styles.cardNum}`} />
            </div>
            <div className={`${styles.bone} ${styles.cardValue}`} />
            <div className={`${styles.bone} ${styles.cardNote}`} />
            <div className={`${styles.bone} ${styles.cardBar}`} />
          </div>
        ))}
      </div>

      {/* Second grid */}
      <div className={styles.sectionRow} style={{ marginTop: "2.5rem" }}>
        <div className={`${styles.bone} ${styles.sectionLabel}`} />
        <div className={styles.sectionLine} />
      </div>
      <div className={`${styles.grid} ${styles.grid2}`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.card} style={{ animationDelay: `${(i + 4) * 80}ms` }}>
            <div className={styles.cardTop}>
              <div className={`${styles.bone} ${styles.cardLabel}`} />
              <div className={`${styles.bone} ${styles.cardNum}`} />
            </div>
            <div className={`${styles.bone} ${styles.cardValue}`} />
            <div className={`${styles.bone} ${styles.cardNote}`} />
            <div className={`${styles.bone} ${styles.cardBar}`} />
          </div>
        ))}
      </div>
    </div>
  );
}