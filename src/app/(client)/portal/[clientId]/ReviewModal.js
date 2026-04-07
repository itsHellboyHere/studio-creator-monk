"use client";
import styles from "./portal.module.css";
import MediaViewer from "./MediaViewer";

const STATUS_META = {
  DRAFT:             { label: "Draft",          bg: "#f3f4f6", color: "#6b7280" },
  PENDING_REVIEW:    { label: "Pending Review", bg: "#fef9c3", color: "#854d0e" },
  APPROVED:          { label: "Approved",       bg: "#dcfce7", color: "#166534" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b" },
};

export default function ReviewModal({ post, feedback, onFeedbackChange, onClose, onApprove, onReject, submitting }) {
  const slideCount = post?.mediaUrls?.length || 1;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.reviewModal}>

        {/* Header */}
        <div className={styles.modalHead}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className={styles.modalEyebrow}>
              {post.targetPlatform} · {post.contentType}
              {slideCount > 1 && (
                <span style={{ marginLeft: 8, background: "rgba(212,81,26,0.1)", color: "var(--orange)", fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                  {slideCount} SLIDES
                </span>
              )}
            </p>
            <h2 className={styles.modalTitle}>{post.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.reviewBody}>
          {/* Media panel */}
          <div className={styles.mediaPanel}>
            <MediaViewer post={post} />
          </div>

          {/* Feedback panel */}
          <div className={styles.feedbackPanel}>
            {post.caption && (
              <div className={styles.captionBox}>
                <span className={styles.captionLabel}>Proposed Caption</span>
                <p className={styles.captionText}>{post.caption}</p>
              </div>
            )}

            {post.status === "PENDING_REVIEW" ? (
              <div className={styles.feedbackBox}>
                <label className={styles.feedbackLabel}>Your Feedback</label>
                <textarea
                  value={feedback}
                  onChange={e => onFeedbackChange(e.target.value)}
                  placeholder="Looks great! OR Please change slide 2…"
                  className={styles.feedbackInput}
                  rows={4}
                />
                <div className={styles.reviewActions}>
                  <button className={styles.rejectBtn} onClick={onReject} disabled={submitting}>
                    Request Changes
                  </button>
                  <button className={styles.approveBtn} onClick={onApprove} disabled={submitting}>
                    {submitting ? "Saving…" : "✓ Approve"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.readOnlyBox}>
                <div className={styles.readOnlyHeader}>
                  <span className={styles.readOnlyStatus} style={{ color: STATUS_META[post.status]?.color, backgroundColor: STATUS_META[post.status]?.bg }}>
                    {STATUS_META[post.status]?.label}
                  </span>
                </div>
                {post.clientNote
                  ? <div className={styles.readOnlyNote}><span className={styles.readOnlyNoteLabel}>Your Feedback:</span><p>{post.clientNote}</p></div>
                  : <p className={styles.readOnlyNoteEmpty}>This deliverable has been processed by your team.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}