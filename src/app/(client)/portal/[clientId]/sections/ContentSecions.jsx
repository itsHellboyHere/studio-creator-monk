"use client";
import { useRef, useCallback, useState } from "react";
import styles from "../styles/content.module.css";

const PLATFORM_COLORS = {
  INSTAGRAM: { bg: "#fdf2f8", color: "#9d174d", dot: "#ec4899" },
  FACEBOOK:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  YOUTUBE:   { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
  LINKEDIN:  { bg: "#eff6ff", color: "#1e40af", dot: "#6366f1" },
  TWITTER_X: { bg: "#f9fafb", color: "#111827", dot: "#6b7280" },
  OTHER:     { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

const STATUS_META = {
  DRAFT:             { label: "Draft",          bg: "#f3f4f6", color: "#6b7280" },
  PENDING_REVIEW:    { label: "Pending Review", bg: "#fef9c3", color: "#854d0e" },
  APPROVED:          { label: "Approved",       bg: "#dcfce7", color: "#166534" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b" },
};

const POSTS_PER_PAGE = 9;

export default function ContentSection({ allPosts, pending, setReviewPost }) {
  const contentRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const getThumb = (post) => post.mediaUrls?.length ? post.mediaUrls[0] : (post.driveLink || null);
  const getSlideCount = (post) => post.mediaUrls?.length || 1;

  return (
    <section id="content" className={styles.contentSection} ref={contentRef}>
      <div className={styles.contentHead}>
        <div>
          <h2 className={styles.contentTitle}>Content Pipeline</h2>
          <p className={styles.contentSub}>
            Review and approve posts before they go live.
            {allPosts.length > 0 && <span className={styles.postCount}> · {allPosts.length} total</span>}
          </p>
        </div>
        {totalPages > 1 && <div className={styles.pageInfo}>Page {currentPage} of {totalPages}</div>}
      </div>

      {pending.length > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertIcon}>
            <span style={{ width: 7, height: 7, background: "#f59e0b", borderRadius: "50%", display: "block", animation: "ping 2s ease-in-out infinite" }} />
          </div>
          <span><strong>{pending.length} piece{pending.length > 1 ? "s" : ""}</strong> waiting for your approval</span>
          <button className={styles.alertCta} onClick={() => setReviewPost(pending[0])}>Review Now →</button>
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
              const pc        = PLATFORM_COLORS[post.targetPlatform] || PLATFORM_COLORS.OTHER;
              const sm        = STATUS_META[post.status] || STATUS_META.DRAFT;
              const isPending = post.status === "PENDING_REVIEW";
              const slideCount = getSlideCount(post);
              const thumbUrl   = getThumb(post);
              const isImgThumb = thumbUrl && !thumbUrl.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i) && !thumbUrl.includes("drive.google.com");

              return (
                <div
                  key={post.id}
                  className={`${styles.card} ${isPending ? styles.cardPending : ""}`}
                  onClick={() => setReviewPost(post)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setReviewPost(post)}
                >
                  {isPending && (
                    <div className={styles.pendingEyebrow}>
                      <span className={styles.pendingEyebrowDot} />
                      Action Needed — Awaiting Your Review
                    </div>
                  )}

                  {/* Media thumbnail */}
                  <div className={styles.cardMedia} style={{ background: pc.bg }}>
                    {isImgThumb
                      ? <img src={thumbUrl} alt={post.title} className={styles.cardMediaImg} />
                      : <svg className={styles.cardMediaIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={pc.dot} strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
                    {slideCount > 1 && (
                      <div className={styles.cardSlideCount}>⊞ {slideCount}</div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.platformTag} style={{ background: pc.bg, color: pc.color }}>
                        {post.targetPlatform}
                      </span>
                      <span className={styles.statusTag} style={{ background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    {post.caption && (
                      <p className={styles.cardCaption}>{post.caption.slice(0, 90)}…</p>
                    )}
                    <div className={styles.cardFooter}>
                      {isPending && <span className={styles.reviewHint}>Tap to review →</span>}
                    </div>
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
  );
}