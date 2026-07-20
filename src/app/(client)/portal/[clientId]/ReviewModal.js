"use client";
import { useState } from "react";
import styles from "./portal.module.css";
import MediaViewer from "./MediaViewer";
import FeedbackImageUploader from "./FeedbackImageUploader";

const STATUS_META = {
  DRAFT:             { label: "Draft",          bg: "#f3f4f6", color: "#6b7280" },
  PENDING_REVIEW:    { label: "Pending Review", bg: "#fef9c3", color: "#854d0e" },
  APPROVED:          { label: "Approved",       bg: "#dcfce7", color: "#166534" },
  CHANGES_REQUESTED: { label: "Changes Needed", bg: "#fee2e2", color: "#991b1b" },
};

export default function ReviewModal({
  post,
  feedback,
  onFeedbackChange,
  onImagesChange,        // (urls[]) => void
  onUploadingChange,     // (bool)   => void
  uploadingImages,       // bool
  clientId,
  onClose,
  onApprove,
  onReject,
  submitting,
}) {
  const slideCount = post?.mediaUrls?.length || 1;
  const busy = submitting || uploadingImages;
  const [lightbox, setLightbox] = useState(null);

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
                <div className={styles.feedbackLabelRow}>
                  <label className={styles.feedbackLabel}>Your Feedback</label>
                  <span className={styles.newFeaturePill}>
                    <span className={styles.newFeatureDot} />
                    New
                  </span>
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => onFeedbackChange(e.target.value)}
                  placeholder="Looks great! OR Please fix the Hindi spelling in slide 2 (see attached)…"
                  className={styles.feedbackInput}
                  rows={4}
                />

                {/* Helper hint — tells client about the new attach ability */}
                <div className={styles.attachHint}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>You can now attach a screenshot to point out spelling or layout fixes — paste, drag, or tap below.</span>
                </div>

                {/* 👇 Image attach — paste / drag / tap */}
                <FeedbackImageUploader
                  clientId={clientId}
                  onImagesChange={onImagesChange}
                  onUploadingChange={onUploadingChange}
                  disabled={submitting}
                />

                <div className={styles.reviewActions}>
                  <button className={styles.rejectBtn} onClick={onReject} disabled={busy}>
                    Request Changes
                  </button>
                  <button className={styles.approveBtn} onClick={onApprove} disabled={busy}>
                    {submitting ? "Saving…" : uploadingImages ? "Uploading…" : "✓ Approve"}
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

                {post.clientNote ? (
                  <div className={styles.readOnlyNote}>
                    <span className={styles.readOnlyNoteLabel}>Your Feedback:</span>
                    <p>{post.clientNote}</p>
                  </div>
                ) : (
                  <p className={styles.readOnlyNoteEmpty}>This deliverable has been processed by your team.</p>
                )}

                {/* 👇 Client re-views their attached annotations */}
                {post.feedbackImages?.length > 0 && (
                  <div>
                    <span className={styles.readOnlyNoteLabel}>Attached ({post.feedbackImages.length})</span>
                    <div className={styles.roImages}>
                      {post.feedbackImages.map((url, i) => (
                        <div key={i} className={styles.roImage} onClick={() => setLightbox(url)}>
                          <img src={url} alt={`Feedback attachment ${i + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className={styles.fbLightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Feedback attachment" />
        </div>
      )}
    </div>
  );
}