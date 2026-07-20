"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./portal.module.css";

// 👇 SET THIS to your presigned-upload route path
const UPLOAD_ENDPOINT = "/api/upload";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MIME_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_FILE_MB = 10;
const MAX_FILES = 10;
let _uid = 0;

export default function FeedbackImageUploader({ clientId, onImagesChange, onUploadingChange, disabled }) {
  const [items, setItems] = useState([]); // { id, status, url, preview, name, file, error }
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const inputRef = useRef(null);
  const startedRef = useRef(new Set());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Push committed URLs + uploading state up to parent
  useEffect(() => {
    onImagesChange?.(items.filter((i) => i.status === "done").map((i) => i.url));
    onUploadingChange?.(items.some((i) => i.status === "uploading"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Revoke object URLs on unmount
  useEffect(
    () => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)),
    []
  );

  const doUpload = useCallback(
    async (item) => {
      try {
        const ext = MIME_EXT[item.file.type] || "png";
        const safeName = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // 1. Ask backend for a presigned URL
        const presignRes = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: safeName, fileType: item.file.type, clientId }),
        });
        if (!presignRes.ok) {
          const msg = (await presignRes.json().catch(() => ({})))?.error || "Could not get upload URL";
          throw new Error(msg);
        }
        const { signedUrl, fileUrl } = await presignRes.json();
        if (!signedUrl || !fileUrl) throw new Error("Invalid upload URL");

        // 2. PUT the file straight to S3 (Content-Type MUST match what was signed)
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done", url: fileUrl } : i)));
      } catch (e) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: e.message } : i))
        );
      }
    },
    [clientId]
  );

  // Kick off uploads for newly-added items
  useEffect(() => {
    items.forEach((it) => {
      if (it.status === "uploading" && !startedRef.current.has(it.id)) {
        startedRef.current.add(it.id);
        doUpload(it);
      }
    });
  }, [items, doUpload]);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []).filter(Boolean);
    if (!incoming.length) return;
    const errs = [];
    const valid = [];
    for (const f of incoming) {
      if (!ALLOWED.includes(f.type)) { errs.push(`${f.name || "image"}: only JPG, PNG, WebP`); continue; }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { errs.push(`${f.name || "image"}: over ${MAX_FILE_MB}MB`); continue; }
      valid.push(f);
    }
    setError(errs.join(" · "));
    if (!valid.length) return;
    setItems((prev) => {
      const room = Math.max(0, MAX_FILES - prev.length);
      if (valid.length > room) {
        setError(
          prev.length >= MAX_FILES
            ? `Max ${MAX_FILES} images reached.`
            : `Only ${room} more allowed (max ${MAX_FILES}).`
        );
      }
      return [
        ...prev,
        ...valid.slice(0, room).map((f) => ({
          id: ++_uid,
          status: "uploading",
          url: null,
          error: null,
          preview: URL.createObjectURL(f),
          name: f.name || "pasted image",
          file: f,
        })),
      ];
    });
  }, []);

  // Paste anywhere while the modal is open
  useEffect(() => {
    const onPaste = (e) => {
      const imgs = [];
      for (const it of e.clipboardData?.items || []) {
        if (it.type?.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) imgs.push(f);
        }
      }
      if (imgs.length) {
        e.preventDefault();
        addFiles(imgs);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const remove = (id) => {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      startedRef.current.delete(id);
      return prev.filter((i) => i.id !== id);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className={styles.fbUpload}>
      <button
        type="button"
        className={`${styles.fbDrop} ${dragOver ? styles.fbDropActive : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={disabled}
      >
        <span className={styles.fbDropIcon}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </span>
        <span className={styles.fbDropText}>
          <span className={styles.fbDropTitle}>Attach a screenshot</span>
          <span className={styles.fbDropHint}>Paste (Ctrl/Cmd+V), drag &amp; drop, or tap · JPG/PNG/WebP</span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {error && <div className={styles.fbError}>{error}</div>}

      {items.length > 0 && (
        <div className={styles.fbThumbs}>
          {items.map((it) => (
            <div key={it.id} className={styles.fbThumb}>
              <img
                src={it.preview}
                alt={it.name}
                className={styles.fbThumbImg}
                onClick={() => it.status === "done" && setLightbox(it.url)}
              />
              {it.status === "uploading" && (
                <div className={styles.fbThumbOverlay}><span className={styles.fbSpinner} /></div>
              )}
              {it.status === "error" && (
                <div className={styles.fbThumbError} title={it.error}>Failed</div>
              )}
              <button type="button" className={styles.fbThumbRemove} onClick={() => remove(it.id)} aria-label="Remove">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className={styles.fbLightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Feedback attachment" />
        </div>
      )}
    </div>
  );
}