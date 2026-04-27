"use client";
import { useState } from "react";
import { updateClientProfile } from "../actions";
import styles from "../styles/profile.module.css";
import portalStyles from "../styles/portal.module.css";

export default function ProfileSection({ client }) {
  const [editOpen, setEditOpen] = useState(false);

  const socialLinks = [
    { label: "Website",     val: client.websiteUrl },
    { label: "Instagram",   val: client.instagramUrl },
    { label: "Facebook",    val: client.facebookUrl },
    { label: "YouTube",     val: client.youtubeUrl },
    { label: "LinkedIn",    val: client.linkedinUrl },
    { label: "WhatsApp",    val: client.whatsappNumber },
    { label: "Twitter / X", val: client.twitterXUrl },
    { label: "Other",       val: client.otherSocialUrl },
  ];

  return (
    <section id="profile" className={styles.profileSection}>
      <div className={portalStyles.sectionHead}>
        <div>
          <h2 className={portalStyles.sectionTitle}>Brand Profile</h2>
          <p className={portalStyles.sectionSub}>Your social links and brand information.</p>
        </div>
        <button className={styles.editBtn} onClick={() => setEditOpen(true)}>Edit Profile</button>
      </div>

      <div className={styles.profileCard}>
        {client.brandDescription && (
          <div className={styles.bioSection}>
            <span className={styles.bioLabel}>About</span>
            <p className={styles.bioText}>{client.brandDescription}</p>
          </div>
        )}
        <div className={styles.socialList}>
          {socialLinks.map(s => (
            <div key={s.label} className={styles.socialRow}>
              <span className={styles.socialLabel}>{s.label}</span>
              {s.val
                ? <a href={s.val.startsWith("http") ? s.val : `https://${s.val}`} target="_blank" rel="noreferrer" className={styles.socialLink}>{s.val}</a>
                : <span className={styles.socialEmpty}>Not connected</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className={portalStyles.overlay} onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}>
          <div className={styles.editModal}>
            <div className={portalStyles.modalHead}>
              <h3 className={portalStyles.modalTitle}>Update Brand Profile</h3>
              <button className={portalStyles.closeBtn} onClick={() => setEditOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form action={async (fd) => { await updateClientProfile(client.id, fd); setEditOpen(false); }} className={styles.editForm}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Brand Bio</span>
                <textarea name="brandDescription" defaultValue={client.brandDescription || ""} rows={3} placeholder="Describe your brand…" className={styles.fieldTextarea} />
              </div>
              <div className={styles.fieldGrid}>
                {[
                  { name: "websiteUrl",     label: "Website URL",     val: client.websiteUrl },
                  { name: "whatsappNumber", label: "WhatsApp",        val: client.whatsappNumber },
                  { name: "instagramUrl",   label: "Instagram URL",   val: client.instagramUrl },
                  { name: "facebookUrl",    label: "Facebook URL",    val: client.facebookUrl },
                  { name: "youtubeUrl",     label: "YouTube URL",     val: client.youtubeUrl },
                  { name: "linkedinUrl",    label: "LinkedIn URL",    val: client.linkedinUrl },
                  { name: "twitterXUrl",    label: "Twitter / X URL", val: client.twitterXUrl },
                  { name: "otherSocialUrl", label: "Other Link",      val: client.otherSocialUrl },
                ].map(f => (
                  <div key={f.name} className={styles.field}>
                    <span className={styles.fieldLabel}>{f.label}</span>
                    <input name={f.name} defaultValue={f.val || ""} placeholder="https://…" className={styles.fieldInput} />
                  </div>
                ))}
              </div>
              <div className={styles.editActions}>
                <button type="button" onClick={() => setEditOpen(false)} className={portalStyles.cancelBtn}>Cancel</button>
                <button type="submit" className={portalStyles.saveBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}