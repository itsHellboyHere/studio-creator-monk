// src/app/(auth)/login/page.js
import styles from "./login.module.css";
import LoginForm from "./LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Sign In | CreatorMonk Portal",
};

export default function LoginPage() {
  return (
    <div className={styles.wrapper}>

      {/* ── Left Panel ── */}
      <div className={styles.leftPanel}>

        {/* Brand badge */}
        <div className={styles.brandBadge}>
          <span className={styles.brandDot} />
          <span className={styles.brandLabel}>CreatorMonk Studio</span>
        </div>

        {/* Monk image with sun aura — centered, pushed up */}
        <div className={styles.illustrationWrap}>
          {/* Sun rays ring */}
          <div className={styles.sunRing} />
          {/* Outer glow */}
          <div className={styles.sunGlow} />
          {/* Inner halo */}
          <div className={styles.sunHalo} />
          <Image
            src="/login-img2.png"
            alt="CreatorMonk"
            width={420}
            height={420}
            className={styles.illustration}
            priority
          />
        </div>

        {/* Hero copy — below the image */}
        <div className={styles.heroCopy}>
          <h1 className={styles.heroHeading}>
            Where brands get their<br />
            <span className={styles.heroAccent}>story told right.</span>
          </h1>
          <p className={styles.heroSub}>
            Your agency's command centre — manage clients, track deliverables,
            and keep every social campaign on point.
          </p>

          <div className={styles.pills}>
            <span className={styles.pill}><span className={styles.pillDot} />Client Portals</span>
            <span className={styles.pill}><span className={styles.pillDot} />Content Calendars</span>
            <span className={styles.pill}><span className={styles.pillDot} />Social Media Flows</span>
            <span className={styles.pill}><span className={styles.pillDot} />Deliverable Tracking</span>
          </div>
        </div>

      </div>

      {/* ── Divider ── */}
      <div className={styles.divider} />

      {/* ── Right Panel (form) ── */}
      <div className={styles.rightPanel}>
        <LoginForm />
      </div>

    </div>
  );
}