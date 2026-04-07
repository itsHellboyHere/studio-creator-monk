"use client";
import { useState, useMemo } from "react";
import styles from "./portal.module.css";

export default function MediaViewer({ post }) {
  const [index, setIndex]     = useState(0);
  const [zoom, setZoom]       = useState(1);
  const [fullscreen, setFull] = useState(false);
  const [errors, setErrors]   = useState({});
  const [imgHover, setImgHover] = useState(false); // hover state for fullscreen image

  const urls = useMemo(() => {
    if (post?.mediaUrls?.length) return post.mediaUrls.filter(Boolean);
    if (post?.driveLink) return [post.driveLink];
    return [];
  }, [post]);

  const url      = urls[index] || null;
  const hasError = errors[url];
  const isGDrive = url?.includes("drive.google.com");
  const isVideo  = url?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
  const canZoom  = !isVideo && !isGDrive && !hasError && url;

  const cycleZoom = () => setZoom(z => z === 1 ? 1.5 : z === 1.5 ? 2 : 1);

  const renderMedia = () => {
    if (!url || hasError) return null;
    if (isGDrive) {
      return <iframe src={url.replace(/\/view.*/, "/preview")} className={styles.mediaPlayer} allow="autoplay" title="Content preview" />;
    }
    if (isVideo) {
      return (
        <video key={url} controls playsInline controlsList="nodownload" className={styles.mediaPlayer}
          onError={() => setErrors(e => ({ ...e, [url]: true }))}>
          <source src={url} />
        </video>
      );
    }
    return (
      <img key={url} src={url} alt={`Slide ${index + 1}`}
        style={{
          width: "100%", height: "100%", objectFit: "contain",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease",
          cursor: canZoom ? (zoom > 1 ? "zoom-out" : "zoom-in") : "default",
        }}
        onClick={canZoom ? cycleZoom : undefined}
        onError={() => setErrors(e => ({ ...e, [url]: true }))}
      />
    );
  };

  if (!urls.length) {
    return (
      <div className={styles.noMedia}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        <span>No media attached</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.noMedia} style={{ color: "#b45309", backgroundColor: "#fffbeb", padding: "20px" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: "8px" }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: "#78350f", fontWeight: 600, fontSize: "14px" }}>Media Expired</span>
        <p style={{ fontSize: "11px", maxWidth: "200px", textAlign: "center", color: "#92400e", lineHeight: 1.4, margin: "6px 0 0" }}>
          Assets auto-delete after 7 days for security.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── INLINE MEDIA PANEL ── */}
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0a09", overflow: "hidden" }}>
        {renderMedia()}

        {/* Carousel arrows */}
        {urls.length > 1 && (
          <>
            <button type="button" disabled={index === 0}
              onClick={(e) => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); setZoom(1); }}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === 0 ? 0.3 : 1, zIndex: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button type="button" disabled={index === urls.length - 1}
              onClick={(e) => { e.stopPropagation(); setIndex(i => Math.min(urls.length - 1, i + 1)); setZoom(1); }}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === urls.length - 1 ? 0.3 : 1, zIndex: 20 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 20 }}>
              {urls.map((_, i) => (
                <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setIndex(i); setZoom(1); }}
                  style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 99, background: i === index ? "#fff" : "rgba(255,255,255,0.4)", border: "none", padding: 0, cursor: "pointer", transition: "all 200ms ease" }} />
              ))}
            </div>
          </>
        )}

        {/* Top-right controls */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {urls.length > 1 && (
            <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.9)", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: 99, pointerEvents: "none", display: "flex", alignItems: "center" }}>
              {index + 1}/{urls.length}
            </div>
          )}
          {canZoom && (
            <button type="button" onClick={(e) => { e.stopPropagation(); cycleZoom(); }}
              title={zoom === 1 ? "Zoom in" : "Reset zoom"}
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              {zoom === 1
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>}
            </button>
          )}
          {!isGDrive && url && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setFull(true); setZoom(1); }}
              title="Fullscreen"
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          )}
        </div>

        {/* Expiry notice */}
        <div className={styles.expiryNotice}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Media auto-deletes 7 days after upload.
        </div>
      </div>

      {/* ── FULLSCREEN OVERLAY ── */}
      {fullscreen && (
        <div
          onClick={() => { setFull(false); setZoom(1); }}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
            WebkitTransform: "translateZ(0)", transform: "translateZ(0)",
          }}
        >
          {/* Close */}
          <button type="button" onClick={(e) => { e.stopPropagation(); setFull(false); setZoom(1); }}
            style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 10, transition: "background 150ms" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Zoom controls bar (SHIFTED TO BOTTOM RIGHT) */}
          {canZoom && (
            <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "6px 14px", zIndex: 10 }}>
              <button type="button" disabled={zoom <= 1}
                onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(1, +(z - 0.5).toFixed(1))); }}
                style={{ width: 28, height: 28, borderRadius: "50%", background: zoom <= 1 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)", border: "none", color: "#fff", display: "grid", placeItems: "center", cursor: zoom <= 1 ? "not-allowed" : "pointer", opacity: zoom <= 1 ? 0.4 : 1, transition: "background 150ms" }}
                onMouseEnter={e => { if (zoom > 1) e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => e.currentTarget.style.background = zoom <= 1 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600, minWidth: 36, textAlign: "center" }}>
                {Math.round(zoom * 100)}%
              </span>
              <button type="button" disabled={zoom >= 3}
                onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, +(z + 0.5).toFixed(1))); }}
                style={{ width: 28, height: 28, borderRadius: "50%", background: zoom >= 3 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)", border: "none", color: "#fff", display: "grid", placeItems: "center", cursor: zoom >= 3 ? "not-allowed" : "pointer", opacity: zoom >= 3 ? 0.4 : 1, transition: "background 150ms" }}
                onMouseEnter={e => { if (zoom < 3) e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => e.currentTarget.style.background = zoom >= 3 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          )}

          {/* Carousel in fullscreen */}
          {urls.length > 1 && (
            <>
              <button type="button" disabled={index === 0}
                onClick={(e) => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); setZoom(1); }}
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === 0 ? 0.3 : 1, zIndex: 10, transition: "background 150ms" }}
                onMouseEnter={e => { if (index > 0) e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" disabled={index === urls.length - 1}
                onClick={(e) => { e.stopPropagation(); setIndex(i => Math.min(urls.length - 1, i + 1)); setZoom(1); }}
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", opacity: index === urls.length - 1 ? 0.3 : 1, zIndex: 10, transition: "background 150ms" }}
                onMouseEnter={e => { if (index < urls.length - 1) e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>
                {index + 1} / {urls.length}
              </div>
            </>
          )}

          {/* ── IMAGE with hover effect ── */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
          >
            {isVideo ? (
              <video controls playsInline controlsList="nodownload"
                style={{ maxWidth: "100%", maxHeight: "calc(100vh - 100px)", borderRadius: 8 }}>
                <source src={url} />
              </video>
            ) : (
              <div style={{ position: "relative", display: "inline-flex", borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={url}
                  alt={`Slide ${index + 1}`}
                  onMouseEnter={() => setImgHover(true)}
                  onMouseLeave={() => setImgHover(false)}
                  onClick={() => canZoom && setZoom(z => z >= 3 ? 1 : +(z + 0.5).toFixed(1))}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "calc(100vh - 100px)",
                    objectFit: "contain",
                    borderRadius: 8,
                    display: "block",
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                    cursor: canZoom ? (zoom >= 3 ? "zoom-out" : "zoom-in") : "default",
                    // ── HOVER EFFECT ──
                    boxShadow: imgHover
                      ? "0 0 0 2px rgba(255,255,255,0.35), 0 20px 60px rgba(0,0,0,0.7)"
                      : "0 8px 40px rgba(0,0,0,0.5)",
                  }}
                />
                {/* Zoom hint tooltip on hover */}
                {imgHover && canZoom && zoom < 3 && (
                  <div style={{
                    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600,
                    padding: "4px 12px", borderRadius: 99, whiteSpace: "nowrap",
                    pointerEvents: "none",
                    animation: "fadeInUp 150ms ease",
                  }}>
                    Click to zoom · {Math.round(zoom * 100)}%
                  </div>
                )}
                {imgHover && canZoom && zoom >= 3 && (
                  <div style={{
                    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600,
                    padding: "4px 12px", borderRadius: 99, whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}>
                    Click to reset zoom
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hint text at top */}
          <div style={{ position: "absolute", top: 20, right: 68, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", fontSize: "11px" }}>
            Click outside to close
          </div>
        </div>
      )}

      {/* Animation for tooltip */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}