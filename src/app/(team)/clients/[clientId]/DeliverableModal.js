"use client";

import { useState } from "react";
import { FiX, FiMessageSquare, FiClock, FiCalendar, FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";
import FileUploader from "./FileUploader";
import { createDeliverable, updateDeliverable } from "./actions";
import styles from "./clientPage.module.css";
import uploaderStyles from "./fileUploader.module.css";

// ── Media Viewer for left panel (supports carousel) ──
function MediaViewer({ urls = [] }) {
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState({});

  const validUrls = urls.filter(Boolean);
  if (!validUrls.length) {
    return (
      <div className={styles.noMedia}>
        <span style={{ fontSize: 28, opacity: 0.4 }}>📂</span>
        <span>No media</span>
      </div>
    );
  }

  const url = validUrls[index];
  const hasError = errors[url];
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>

      {hasError ? (
        <div className={styles.noMedia} style={{ color: "#b45309", backgroundColor: "#fffbeb", padding: "20px" }}>
          <FiClock size={28} style={{ marginBottom: "8px" }} />
          <span style={{ color: "#78350f", fontWeight: "600", fontSize: "13px" }}>Media Expired</span>
          <p style={{ fontSize: "11px", marginTop: "6px", maxWidth: "200px", textAlign: "center", color: "#92400e", lineHeight: "1.4" }}>
            Assets auto-delete after 7 days for security.
          </p>
        </div>
      ) : isVideo ? (
        <video key={url} controls autoPlay loop muted playsInline className={styles.mediaPlayer} onError={() => setErrors(e => ({ ...e, [url]: true }))}>
          <source src={url} />
        </video>
      ) : (
        <img key={url} src={url} alt={`Media ${index + 1}`} className={styles.mediaPlayer} onError={() => setErrors(e => ({ ...e, [url]: true }))} />
      )}

      {/* Carousel controls */}
      {validUrls.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === 0 ? 0.3 : 1 }}
          >
            <FiChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setIndex(i => Math.min(validUrls.length - 1, i + 1))}
            disabled={index === validUrls.length - 1}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === validUrls.length - 1 ? 0.3 : 1 }}
          >
            <FiChevronRight size={15} />
          </button>

          {/* Counter badge */}
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.9)", fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
            <FiGrid size={10} /> {index + 1}/{validUrls.length}
          </div>

          {/* Dots */}
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {validUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                style={{ width: 6, height: 6, borderRadius: "50%", background: i === index ? "#fff" : "rgba(255,255,255,0.35)", border: "none", padding: 0, cursor: "pointer", transition: "all 150ms" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DeliverableModal({ post, clientId, onClose, onSuccess }) {
  const isEdit = !!post;

  // currentMediaUrls — from existing post
  const currentUrls = post?.mediaUrls || [];

  // newFiles — FileUploader managed objects (includes existing + new)
  const [managedFiles, setManagedFiles] = useState(null); // null = not yet touched
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const defaultScheduledDate = post?.scheduledDate
    ? new Date(post.scheduledDate).toISOString().split("T")[0]
    : "";

  const handleFilesChange = (files) => {
    setManagedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.target);

    try {
      // Determine which files need uploading vs already have URLs
      const filesToProcess = managedFiles !== null ? managedFiles : currentUrls.map(url => ({ url, isExisting: true }));

      const newUrls = [];
      const toUpload = filesToProcess.filter(f => !f.isExisting && f.file);
      const existing = filesToProcess.filter(f => f.isExisting);

      setUploadProgress({ current: 0, total: toUpload.length });

      // Upload new files to S3
      for (let i = 0; i < toUpload.length; i++) {
        const f = toUpload[i];
        setUploadStatus(`Uploading file ${i + 1} of ${toUpload.length}…`);
        setUploadProgress({ current: i + 1, total: toUpload.length });

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: f.file.name, fileType: f.file.type, clientId }),
        });
        if (!res.ok) throw new Error(`Failed to get upload URL for ${f.file.name}`);
        const { signedUrl, fileUrl } = await res.json();

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: f.file,
          headers: { "Content-Type": f.file.type },
        });
        if (!uploadRes.ok) throw new Error(`Failed to upload ${f.file.name}`);

        newUrls.push(fileUrl);
      }

      // Reconstruct final ordered array preserving user's thumbnail order
      // filesToProcess order is the canonical order (user may have reordered)
      const finalUrls = filesToProcess.map(f => {
        if (f.isExisting) return f.url;
        // Find the uploaded URL for this new file
        const uploadedIdx = toUpload.findIndex(u => u.id === f.id);
        return newUrls[uploadedIdx] || null;
      }).filter(Boolean);

      if (!finalUrls.length && !isEdit) {
        throw new Error("Please add at least one media file.");
      }

      setUploadStatus("Saving…");
      formData.set("mediaUrls", JSON.stringify(finalUrls));

      if (isEdit) {
        await updateDeliverable(post.id, clientId, formData);
      } else {
        await createDeliverable(clientId, formData);
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      alert(error.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const hasMedia = currentUrls.length > 0;
  const isCarousel = currentUrls.length > 1;

  return (
    <div className={styles.modalOverlay}>
      {/* Wider modal for carousel editing */}
      <div className={`${styles.modalContent} ${styles.splitModalContent} ${styles.carouselModal}`}>

        {/* ── Left: Media Preview (edit only) ── */}
        {isEdit && (
          <div className={styles.mediaSide}>
            <MediaViewer urls={currentUrls} />
            {isCarousel && (
              <div style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.7)", fontSize: "10px", fontFamily: "var(--mono)", padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
                {currentUrls.length}-slide carousel
              </div>
            )}
          </div>
        )}

        {/* ── Right: Form ── */}
        <div className={styles.formSide}>
          <div className={styles.modalHeader}>
            <div>
              <h2 style={{ margin: 0 }}>{isEdit ? "Edit Deliverable" : "Upload Deliverable"}</h2>
              {isCarousel && (
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--muted2)", fontFamily: "var(--mono)" }}>
                  {currentUrls.length} slides · carousel post
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} disabled={isUploading} className={styles.closeBtn}><FiX size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalForm}>

            {/* Feedback Alert */}
            {isEdit && post.status === "CHANGES_REQUESTED" && post.clientNote && (
              <div className={styles.feedbackAlert}>
                <div className={styles.feedbackAlertHead}>
                  <FiMessageSquare size={14} /><strong>Client Requested Changes:</strong>
                </div>
                <p>{post.clientNote}</p>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>Content Title</label>
              <input name="title" defaultValue={post?.title || ""} placeholder="e.g. Product Launch Carousel" required className={styles.inputField} />
            </div>

            {/* Multi-file uploader */}
            <div className={styles.inputGroup}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Media Assets</span>
                <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "10px", fontFamily: "var(--mono)" }}>
                  Up to 10 files · drag to reorder
                </span>
              </label>
              <FileUploader
                currentMediaUrls={currentUrls}
                onFilesChange={handleFilesChange}
              />
            </div>

            {/* Upload progress bar */}
            {isUploading && uploadProgress.total > 1 && (
              <div style={{ background: "var(--s2)", borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted2)" }}>{uploadStatus}</span>
                  <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--accent)", fontWeight: 700 }}>
                    {uploadProgress.current}/{uploadProgress.total}
                  </span>
                </div>
                <div style={{ height: 3, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--accent)", borderRadius: 99, width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, transition: "width 300ms ease" }} />
                </div>
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Platform</label>
                <select name="targetPlatform" defaultValue={post?.targetPlatform || "INSTAGRAM"} className={styles.inputField}>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Format</label>
                <select name="contentType" defaultValue={post?.contentType || "REEL"} className={styles.inputField}>
                  <option value="REEL">Reel / Short</option>
                  <option value="POST">Static Post</option>
                  <option value="STORY">Story</option>
                  <option value="VIDEO_LONG">Long Form</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <FiCalendar size={11} /> Schedule Date
                <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "10px" }}>(optional)</span>
              </label>
              <input name="scheduledDate" type="date" defaultValue={defaultScheduledDate} className={styles.inputField} />
            </div>

            <div className={styles.inputGroup}>
              <label>Caption (Optional)</label>
              <textarea name="caption" rows={3} defaultValue={post?.caption || ""} placeholder="Draft the caption…" className={styles.inputField} />
            </div>

            <div className={styles.inputGroup}>
              <label>Status Pipeline</label>
              <select name="status" defaultValue={post?.status || "DRAFT"} className={styles.inputField}>
                <option value="DRAFT">Draft (Internal Only)</option>
                <option value="PENDING_REVIEW">Pending Review (Send to Client)</option>
                <option value="CHANGES_REQUESTED" disabled={!isEdit}>Changes Requested</option>
                <option value="APPROVED">Approved (Ready to Post)</option>
              </select>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={onClose} disabled={isUploading} className={styles.cancelBtn}>Cancel</button>
              <button
                type="submit"
                disabled={isUploading}
                className={styles.saveBtn}
              >
                {isUploading
                  ? uploadProgress.total > 1
                    ? `${uploadStatus}`
                    : "Uploading…"
                  : isEdit ? "Save Updates" : "Upload to Pipeline"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}