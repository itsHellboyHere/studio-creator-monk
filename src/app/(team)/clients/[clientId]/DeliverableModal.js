"use client";

import { useState } from "react";
import { FiX, FiMessageSquare, FiImage, FiClock, FiCalendar } from "react-icons/fi";
import FileUploader from "./FileUploader";
import { createDeliverable, updateDeliverable } from "./actions";
import styles from "./clientPage.module.css";

// Media Viewer for the left side of the split screen
function MediaViewer({ url }) {
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className={styles.noMedia}>
        <FiImage size={32} />
        <span>No media</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.noMedia} style={{ color: "#b45309", backgroundColor: "#fffbeb", padding: "20px" }}>
        <FiClock size={32} style={{ marginBottom: "8px" }} />
        <span style={{ color: "#78350f", fontWeight: "600", fontSize: "14px" }}>Media Expired</span>
        <p style={{ fontSize: "11px", marginTop: "6px", maxWidth: "220px", textAlign: "center", color: "#92400e", lineHeight: "1.4" }}>
          For brand security, raw media assets are automatically deleted from our servers after 7 days.
        </p>
      </div>
    );
  }

  const isVideo = url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
  
  if (isVideo) {
    return (
      <video 
        controls 
        autoPlay 
        loop 
        muted 
        playsInline 
        className={styles.mediaPlayer}
        onError={() => setHasError(true)}
      >
        <source src={url} />
      </video>
    );
  }
  
  return (
    <img 
      src={url} 
      alt="Deliverable Asset" 
      className={styles.mediaPlayer} 
      onError={() => setHasError(true)}
    />
  );
}

export default function DeliverableModal({ post, clientId, onClose, onSuccess }) {
  const isEdit = !!post;
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Format scheduledDate for the date input (YYYY-MM-DD)
  const defaultScheduledDate = post?.scheduledDate
    ? new Date(post.scheduledDate).toISOString().split("T")[0]
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    const formData = new FormData(e.target);
    let finalS3Url = post?.driveLink || ""; 

    try {
      if (selectedFile) {
        setUploadStatus("Generating secure link...");
        
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            clientId: clientId,
          }),
        });
        
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { signedUrl, fileUrl } = await res.json();

        setUploadStatus("Uploading to S3...");
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });

        if (!uploadRes.ok) throw new Error("Failed to upload to S3");
        
        finalS3Url = fileUrl;
      }

      setUploadStatus("Saving to database...");
      formData.set("driveLink", finalS3Url);

      if (isEdit) {
        await updateDeliverable(post.id, clientId, formData);
      } else {
        await createDeliverable(clientId, formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Error uploading file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${styles.splitModalContent}`}>
        
        {/* Left Side: Media Preview (Only if Editing an existing post) */}
        {isEdit && (
          <div className={styles.mediaSide}>
            <MediaViewer url={post.driveLink} />
          </div>
        )}

        {/* Right Side: Form */}
        <div className={styles.formSide}>
          <div className={styles.modalHeader}>
            <h2>{isEdit ? "Edit Deliverable" : "Upload Deliverable"}</h2>
            <button type="button" onClick={onClose} disabled={isUploading} className={styles.closeBtn}><FiX size={20}/></button>
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
              <input name="title" defaultValue={post?.title || ""} placeholder="e.g. Testimonial Reel" required className={styles.inputField} />
            </div>

            {/* THE DRAG AND DROP UPLOADER */}
            <div className={styles.inputGroup}>
              <label>Media Asset (Upload to S3)</label>
              <FileUploader 
                currentFileUrl={post?.driveLink} 
                onFileSelect={(file) => setSelectedFile(file)} 
              />
            </div>

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

            {/* ── SCHEDULE DATE — NEW FIELD ── */}
            <div className={styles.inputGroup}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <FiCalendar size={11} /> Schedule Date <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "10px" }}>(optional)</span>
              </label>
              <input
                name="scheduledDate"
                type="date"
                defaultValue={defaultScheduledDate}
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Caption (Optional)</label>
              <textarea name="caption" rows={4} defaultValue={post?.caption || ""} placeholder="Draft the caption..." className={styles.inputField} />
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
              <button type="submit" disabled={isUploading || (!selectedFile && !post?.driveLink)} className={styles.saveBtn}>
                {isUploading ? uploadStatus : (isEdit ? "Save Updates" : "Upload to Pipeline")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}