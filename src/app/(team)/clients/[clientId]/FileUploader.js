"use client";

import { useState, useRef, useCallback } from "react";
import { FiUploadCloud, FiX, FiImage, FiVideo, FiPlus, FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";
import styles from "./fileUploader.module.css";

const MAX_FILES = 10;

function isVideoUrl(url) {
  return url && url.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i);
}

function FileThumb({ file, index, isActive, onClick, onRemove, isDraggingOver, onDragStart, onDragOver, onDrop }) {
  const isVideo = file.type ? file.type.startsWith("video/") : isVideoUrl(file.url);
  const preview = file.preview || file.url;

  return (
    <div
      className={`${styles.thumb} ${isActive ? styles.thumbActive : ""} ${isDraggingOver ? styles.thumbDragOver : ""}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      title={file.name || `File ${index + 1}`}
    >
      {isVideo ? (
        <div className={styles.thumbVideo}>
          <FiVideo size={14} />
        </div>
      ) : preview ? (
        <img src={preview} alt={`Slide ${index + 1}`} className={styles.thumbImg} />
      ) : (
        <div className={styles.thumbVideo}><FiImage size={14} /></div>
      )}

      {/* Index badge */}
      <span className={styles.thumbIndex}>{index + 1}</span>

      {/* Remove button */}
      <button
        type="button"
        className={styles.thumbRemove}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove"
      >
        <FiX size={10} />
      </button>
    </div>
  );
}

export default function FileUploader({ currentMediaUrls = [], onFilesChange }) {
  // Normalize existing URLs into file-like objects
  const initFiles = (currentMediaUrls || []).filter(Boolean).map(url => ({
    id: url,
    url,
    name: url.split("/").pop(),
    preview: isVideoUrl(url) ? null : url,
    type: isVideoUrl(url) ? "video/mp4" : "image/jpeg",
    isExisting: true,
  }));

  const [files, setFiles] = useState(initFiles);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Notify parent whenever files change
  const notifyParent = useCallback((newFiles) => {
    onFilesChange(newFiles);
  }, [onFilesChange]);

  const addFiles = (rawFiles) => {
    const incoming = Array.from(rawFiles).slice(0, MAX_FILES - files.length);
    if (!incoming.length) return;

    const newEntries = incoming.map(f => {
      const isVid = f.type.startsWith("video/");
      const preview = !isVid ? URL.createObjectURL(f) : null;
      return {
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        type: f.type,
        preview,
        isExisting: false,
      };
    });

    const updated = [...files, ...newEntries];
    setFiles(updated);
    setActiveIndex(updated.length - 1);
    notifyParent(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setActiveIndex(Math.min(activeIndex, Math.max(0, updated.length - 1)));
    notifyParent(updated);
  };

  // Drag-to-reorder thumbnails
  const handleThumbDrop = (toIndex) => {
    if (dragFromIndex === null || dragFromIndex === toIndex) return;
    const updated = [...files];
    const [moved] = updated.splice(dragFromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
    setActiveIndex(toIndex);
    setDragFromIndex(null);
    setDragOverIndex(null);
    notifyParent(updated);
  };

  const handleDropZone = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const activeFile = files[activeIndex];
  const canAdd = files.length < MAX_FILES;

  return (
    <div className={styles.uploader}>

      {/* ── Main Preview Area ── */}
      <div
        className={`${styles.preview} ${isDragging ? styles.previewDragging : ""} ${!files.length ? styles.previewEmpty : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDropZone}
        onClick={!files.length ? () => fileInputRef.current?.click() : undefined}
      >
        {files.length === 0 ? (
          /* Empty state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiUploadCloud size={32} />
            </div>
            <p className={styles.emptyTitle}><strong>Click to upload</strong> or drag & drop</p>
            <p className={styles.emptyHint}>Images & videos · Max {MAX_FILES} files · JPG, PNG, MP4, MOV</p>
          </div>
        ) : (
          /* File preview */
          <div className={styles.mediaWrap}>
            {activeFile && (
              activeFile.type?.startsWith("video/") || isVideoUrl(activeFile.url) ? (
                activeFile.isExisting ? (
                  <video key={activeFile.url} controls playsInline muted className={styles.mediaEl}>
                    <source src={activeFile.url} />
                  </video>
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <FiVideo size={40} />
                    <span>{activeFile.name}</span>
                    <span className={styles.videoHint}>Video ready to upload</span>
                  </div>
                )
              ) : (
                <img
                  key={activeFile.preview || activeFile.url}
                  src={activeFile.preview || activeFile.url}
                  alt={`Slide ${activeIndex + 1}`}
                  className={styles.mediaEl}
                />
              )
            )}

            {/* Carousel nav arrows */}
            {files.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.navArrow} ${styles.navLeft}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(i => Math.max(0, i - 1)); }}
                  disabled={activeIndex === 0}
                >
                  <FiChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.navArrow} ${styles.navRight}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(i => Math.min(files.length - 1, i + 1)); }}
                  disabled={activeIndex === files.length - 1}
                >
                  <FiChevronRight size={18} />
                </button>

                {/* Dot indicators */}
                <div className={styles.dots}>
                  {files.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                      onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Slide counter */}
            <div className={styles.counter}>
              <FiGrid size={11} />
              {activeIndex + 1} / {files.length}
            </div>
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip ── */}
      {files.length > 0 && (
        <div className={styles.strip}>
          {files.map((f, i) => (
            <FileThumb
              key={f.id}
              file={f}
              index={i}
              isActive={i === activeIndex}
              isDraggingOver={dragOverIndex === i}
              onClick={() => setActiveIndex(i)}
              onRemove={() => removeFile(i)}
              onDragStart={() => setDragFromIndex(i)}
              onDragOver={() => setDragOverIndex(i)}
              onDrop={() => handleThumbDrop(i)}
            />
          ))}

          {/* Add more button */}
          {canAdd && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => fileInputRef.current?.click()}
              title={`Add more (${files.length}/${MAX_FILES})`}
            >
              <FiPlus size={16} />
              <span>{files.length}/{MAX_FILES}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Hint ── */}
      {files.length > 1 && (
        <p className={styles.reorderHint}>
          Drag thumbnails to reorder · First slide is the cover
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        className={styles.hiddenInput}
        multiple
        accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
      />
    </div>
  );
}