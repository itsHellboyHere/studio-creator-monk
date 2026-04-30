"use client";
import { useState, useMemo, useCallback } from "react";
import styles from "./mediaViewer.module.css";

// ── helpers ──
const isVideoUrl = url => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");
const isGDriveUrl = url => (url || "").includes("drive.google.com");
const getFileName = url => {
  try { return decodeURIComponent(url.split("/").pop().split("?")[0]) || "media"; }
  catch { return "media"; }
};

// ── Sub-components ──
function Spinner() {
  return (
    <div className={styles.loader}>
      <div className={styles.loaderSpinner} />
      <span className={styles.loaderText}>Loading media…</span>
    </div>
  );
}

function Expired() {
  return (
    <div className={styles.expired}>
      <div className={styles.expiredIcon}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <p className={styles.expiredTitle}>Media Expired</p>
      <p className={styles.expiredSub}>Assets auto-delete 7 days after upload for security.</p>
    </div>
  );
}

function ControlBtn({ onClick, disabled, title, children }) {
  return (
    <button type="button" className={styles.controlBtn} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

// ── Media renderer ──
function MediaRenderer({ url, zoom, onLoad, onError, className }) {
  const [loading, setLoading] = useState(true);
  const handleLoad = () => { setLoading(false); onLoad?.(); };
  const handleError = () => { setLoading(false); onError?.(); };

  if (isGDriveUrl(url)) {
    return (
      <>
        {loading && <Spinner />}
        <iframe
          src={url.replace(/\/view.*/, "/preview")}
          className={styles.fullscreenIframe}
          allow="autoplay" title="Content preview"
          onLoad={handleLoad}
        />
      </>
    );
  }

  if (isVideoUrl(url)) {
    const ext = url.split("?")[0].split(".").pop().toLowerCase();
    const mimeType = ext === "mov" ? "video/quicktime"
      : ext === "webm" ? "video/webm"
        : ext === "ogg" ? "video/ogg"
          : "video/mp4";

    return (
      <>
        {loading && <Spinner />}
        <video
          key={url}
          className={className || styles.video}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={handleLoad}
          onError={handleError}
          style={{
            opacity: loading ? 0 : 1,
            position: loading ? "absolute" : "relative",
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          <source src={url} type={mimeType} />
          <source src={url} type="video/mp4" />
        </video>
      </>
    );
  }

  return (
    <>
      {loading && <Spinner />}
      <img
        key={url}
        src={url}
        alt="Media"
        className={className || styles.img}
        style={{
          display: loading ? "none" : "block",
          transform: zoom && zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: "center center",
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}

// ── Main component ──
export default function MediaViewer({ post }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFull] = useState(false);
  const [errors, setErrors] = useState({});
  const [downloading, setDownloading] = useState(false);

  const urls = useMemo(() => {
    if (post?.mediaUrls?.length) return post.mediaUrls.filter(Boolean);
    if (post?.driveLink) return [post.driveLink];
    return [];
  }, [post]);

  const url = urls[index] || null;
  const hasError = errors[url];
  const isVideo = isVideoUrl(url);
  const isGDrive = isGDriveUrl(url);
  const canZoom = !isVideo && !isGDrive && !hasError && !!url;
  const canDownload = !isGDrive && !hasError && !!url;

  const handleError = useCallback(() => {
    setErrors(e => ({ ...e, [url]: true }));
  }, [url]);

  const handleDownload = useCallback(async (e) => {
    e.stopPropagation();
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = getFileName(url);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [url, downloading]);

  const prev = () => { setIndex(i => Math.max(0, i - 1)); setZoom(1); };
  const next = () => { setIndex(i => Math.min(urls.length - 1, i + 1)); setZoom(1); };
  const zoomIn = () => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)));
  const zoomOut = () => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)));
  const zoomReset = () => setZoom(1);
  const openFull = () => { setFull(true); setZoom(1); };
  const closeFull = () => { setFull(false); setZoom(1); };

  if (!urls.length) {
    return (
      <div className={styles.noMedia}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>No media attached</span>
      </div>
    );
  }

  return (
    <>
      {/* ── INLINE PANEL ── */}
      <div className={styles.mediaViewerRoot}>

        {/* Dark media area */}
        <div className={styles.mediaWrap}>
          {hasError ? <Expired /> : (
            <MediaRenderer url={url} zoom={zoom} onError={handleError} />
          )}

          {/* Top controls — title/counter + fullscreen + download */}
          {!hasError && url && (
            <div className={styles.controls}>
              <div className={styles.controlsLeft}>
                {urls.length > 1 && (
                  <div className={styles.slideCounter}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                    {index + 1} / {urls.length}
                  </div>
                )}
              </div>
              <div className={styles.controlsRight}>
                <ControlBtn onClick={openFull} title="Fullscreen">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </ControlBtn>
                {canDownload && (
                  <button
                    type="button" className={styles.downloadBtn}
                    onClick={handleDownload} disabled={downloading} title="Download"
                  >
                    {downloading ? <span className={styles.downloadSpinner} /> : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    {downloading ? "Downloading…" : "Download"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Carousel arrows */}
          {urls.length > 1 && (
            <>
              <button type="button" className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={prev} disabled={index === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button type="button" className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={next} disabled={index === urls.length - 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div className={styles.dots}>
                {urls.map((_, i) => (
                  <button
                    key={i} type="button"
                    className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                    style={{ width: i === index ? 16 : 6 }}
                    onClick={() => { setIndex(i); setZoom(1); }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Expiry notice */}
          <div className={styles.expiryBar}>
            <span className={styles.expiryText}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Media expires 7 days after upload
            </span>
          </div>
        </div>

        {/* Zoom bar — BELOW dark area, clean separate strip */}
        {canZoom && (
          <div className={styles.zoomBar}>
            <button type="button" className={styles.zoomBtn} onClick={zoomOut} disabled={zoom <= 1}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button type="button" className={styles.zoomBtn} onClick={zoomIn} disabled={zoom >= 3}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            {zoom !== 1 && (
              <button type="button" className={styles.zoomReset} onClick={zoomReset}>Reset</button>
            )}
          </div>
        )}
      </div>

      {/* ── FULLSCREEN ── */}
      {fullscreen && (
        <div className={styles.fullscreenOverlay} onClick={closeFull}>
          <div className={styles.fsTopBar} onClick={e => e.stopPropagation()}>
            <span className={styles.fsTitle}>{post?.title || "Media Preview"}</span>
            <div className={styles.fsControls}>
              {canDownload && (
                <button
                  type="button" className={styles.downloadBtn}
                  onClick={handleDownload} disabled={downloading} title="Download"
                >
                  {downloading ? <span className={styles.downloadSpinner} /> : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  {downloading ? "Downloading…" : "Download"}
                </button>
              )}
              <ControlBtn onClick={closeFull} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </ControlBtn>
            </div>
          </div>

          {/* Media area */}
          <div className={styles.fsMediaWrap} onClick={e => e.stopPropagation()}>
            {hasError ? <Expired /> : (
              <MediaRenderer
                url={url}
                zoom={zoom}
                onError={handleError}
                className={isVideo ? styles.fullscreenVideo : styles.fullscreenImg}
              />
            )}

            {/* Carousel counter */}
            {urls.length > 1 && (
              <div className={styles.fsCounter}>{index + 1} / {urls.length}</div>
            )}

            {/* Carousel arrows */}
            {urls.length > 1 && (
              <>
                <button type="button" className={`${styles.fsArrowBtn} ${styles.fsArrowLeft}`} onClick={prev} disabled={index === 0}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button type="button" className={`${styles.fsArrowBtn} ${styles.fsArrowRight}`} onClick={next} disabled={index === urls.length - 1}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </>
            )}

            {/* Dot indicators in fullscreen */}
            {urls.length > 1 && (
              <div className={`${styles.dots} ${styles.fsDots}`}>
                {urls.map((_, i) => (
                  <button
                    key={i} type="button"
                    className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                    style={{ width: i === index ? 16 : 6 }}
                    onClick={() => { setIndex(i); setZoom(1); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Zoom bar below fullscreen media */}
          {canZoom && !isVideo && (
            <div className={styles.fsZoomBar} onClick={e => e.stopPropagation()}>
              <button type="button" className={styles.fsZoomBtn} onClick={zoomOut} disabled={zoom <= 1}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              <span className={styles.fsZoomLabel}>{Math.round(zoom * 100)}%</span>
              <button type="button" className={styles.fsZoomBtn} onClick={zoomIn} disabled={zoom >= 3}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              {zoom !== 1 && (
                <button type="button" className={styles.fsZoomReset} onClick={zoomReset}>Reset</button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}