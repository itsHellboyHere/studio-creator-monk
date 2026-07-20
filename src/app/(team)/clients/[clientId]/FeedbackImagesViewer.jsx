"use client";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import styles from "./clientPage.module.css";

export default function FeedbackImagesViewer({ images = [], compact = false }) {
  const [lightbox, setLightbox] = useState(null);

  if (!images?.length) return null;

  return (
    <>
      <div className={compact ? styles.fbivGridCompact : styles.fbivGrid}>
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            className={styles.fbivThumb}
            onClick={(e) => { e.stopPropagation(); setLightbox(url); }}
            title="View attachment"
          >
            <img src={url} alt={`Feedback ${i + 1}`} />
          </button>
        ))}
      </div>

      {lightbox && (
        <div className={styles.fbivLightbox} onClick={() => setLightbox(null)}>
          <div className={styles.fbivLightboxInner} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.fbivClose}
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
            <img src={lightbox} alt="Feedback attachment" />
          </div>
        </div>
      )}
    </>
  );
}