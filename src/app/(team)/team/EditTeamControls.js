"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updatePodData } from "./actions";
import styles from "./team.module.css";

export default function EditTeamControls({ pod }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Helper to display arrays as comma-separated text in the input
  const displayList = (val) => (Array.isArray(val) ? val.join(", ") : "");

  const modal = (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Team Pod</p>
            <h3 className={styles.modalTitle}>{pod.roleTitle?.split(" - ")[0] ?? "Edit Pod"}</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className={styles.closeX} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form action={async (formData) => {
            setSaving(true);
            await updatePodData(pod.id, formData);
            setSaving(false);
            setIsOpen(false);
          }} className={styles.modalForm}>
          
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Team Size</label>
              <input type="number" name="teamSize" defaultValue={pod.teamSize} />
            </div>
            <div className={styles.inputGroup}>
              <label>Completed</label>
              <input type="number" name="completedMandates" defaultValue={pod.completedMandates} />
            </div>
            <div className={styles.inputGroup}>
              <label>Ongoing</label>
              <input type="number" name="ongoingProjects" defaultValue={pod.ongoingProjects} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Pod Summary</label>
            <textarea name="podDescription" defaultValue={pod.podDescription} rows={3} />
          </div>

          <div className={styles.inputGroup}>
            <label>Service Mix <span className={styles.hint}>(comma separated)</span></label>
            <input name="services" defaultValue={displayList(pod.services)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Completed Work <span className={styles.hint}>(comma separated)</span></label>
            <input name="completedWorks" defaultValue={displayList(pod.completedWorks)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Ongoing Works <span className={styles.hint}>(comma separated)</span></label>
            <input name="ongoingWorks" defaultValue={displayList(pod.ongoingWorks)} />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={() => setIsOpen(false)} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={styles.editBtn}>Edit Pod Metrics</button>
      {isOpen && mounted && createPortal(modal, document.body)}
    </>
  );
}