"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateAgencyStats } from "./actions";
import styles from "./editModal.module.css";

export default function EditOverviewModal({ stats, isOpen, onClose }) {
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Agency Dashboard</p>
            <h2 className={styles.modalTitle}>Edit Overview Stats</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form
          action={async (formData) => {
            setSaving(true);
            await updateAgencyStats(formData);
            setSaving(false);
            onClose();
          }}
          className={styles.form}
        >
          <div className={styles.inputGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Brand Relationships</label>
              <input name="brandRelationships" defaultValue={stats?.brandRelationships} placeholder="e.g. 80+" className={styles.input} />
              <input name="brandRelNote" defaultValue={stats?.brandRelNote} className={styles.noteInput} placeholder="Add a note..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Completed Mandates</label>
              <input type="number" name="completedMandates" defaultValue={stats?.completedMandates} className={styles.input} />
              <input name="completedManNote" defaultValue={stats?.completedManNote} className={styles.noteInput} placeholder="Add a note..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Ongoing Workstreams</label>
              <input type="number" name="ongoingWorkstreams" defaultValue={stats?.ongoingWorkstreams} className={styles.input} />
              <input name="ongoingWorkNote" defaultValue={stats?.ongoingWorkNote} className={styles.noteInput} placeholder="Add a note..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Agency Strength</label>
              <input type="number" name="agencyStrength" defaultValue={stats?.agencyStrength} className={styles.input} />
              <input name="agencyStrNote" defaultValue={stats?.agencyStrNote} className={styles.noteInput} placeholder="Add a note..." />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}