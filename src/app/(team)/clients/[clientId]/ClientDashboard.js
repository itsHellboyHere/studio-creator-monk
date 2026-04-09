"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FiGlobe, FiInstagram, FiYoutube, FiFacebook,
  FiLinkedin, FiPhone, FiPackage, FiCalendar,
  FiExternalLink, FiChevronLeft, FiChevronRight,
  FiActivity, FiLayers, FiArrowRight, FiZap,
  FiTrendingUp, FiGrid, FiEdit2, FiX, FiPlus, FiTrash2,
  FiBell, FiList
} from "react-icons/fi";
import { updateClientCore, addClientQuota, deleteClientQuota, notifyClient, deleteDeliverable } from "./actions";
import DeliverableModal from "./DeliverableModal";
import ContentCalendar from "./ContentCalendar";
import styles from "./clientPage.module.css";

export default function ClientDashboard({ client, totalPosts, approvedCount, pendingCount, currentPage, postsPerPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [activeTab, setActiveTab] = useState("pipeline");

  const socialLinks = [
    { id: "web", icon: <FiGlobe />, label: "Website", url: client.websiteUrl, color: "#5bf0c4" },
    { id: "ig", icon: <FiInstagram />, label: "Instagram", url: client.instagramUrl, color: "#f06292" },
    { id: "fb", icon: <FiFacebook />, label: "Facebook", url: client.facebookUrl, color: "#7c9ff5" },
    { id: "yt", icon: <FiYoutube />, label: "YouTube", url: client.youtubeUrl, color: "#f87171" },
    { id: "in", icon: <FiLinkedin />, label: "LinkedIn", url: client.linkedinUrl, color: "#60a5fa" },
    { id: "wa", icon: <FiPhone />, label: "WhatsApp", url: client.whatsappNumber, color: "#4ade80" },
  ];

  const connectedCount = socialLinks.filter(l => l.url).length;
  const totalDeliverables = client.quotas.reduce((s, q) => s + q.amount, 0);
  const daysActive = client.startDate ? Math.floor((Date.now() - new Date(client.startDate)) / 86400000) : null;
  const getInitials = (name) => name ? name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "CM";

  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const navigateToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setIsNavigating(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleCalendarEditPost = (postPreview) => {
    const fullPost = client.posts.find(p => p.id === postPreview.id) || postPreview;
    setEditingPost(fullPost);
  };

  const handleDeletePost = async (post) => {
    const confirmed = window.confirm(
      `Delete "${post.title}"?\n\nThis permanently removes the post. Media files on S3 will expire naturally after 7 days.`
    );
    if (!confirmed) return;
    setDeletingPostId(post.id);
    try {
      await deleteDeliverable(post.id, client.id);
      router.push(`${pathname}?page=1`);
    } catch (err) {
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orbA} />
      <div className={styles.orbB} />
      <div className={styles.grain} />

      <div className={styles.wrapper}>
        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <Link href="/clients" className={styles.backLink}>
            <FiChevronLeft size={14} /> <span>Clients</span>
          </Link>
          <div className={styles.navRight}>
            <span className={styles.livePill}><span className={styles.liveDot} /> Active</span>
            <Link href={`/portal/${client.id}`} className={styles.portalBtn} target="_blank">
              Client View <FiArrowRight size={13} />
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <header className={styles.hero}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {client.logoUrl ? (
                <img src={client.logoUrl} alt={client.name} className={styles.logoImg}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              ) : null}
              <span style={{ display: client.logoUrl ? 'none' : 'block' }}>{getInitials(client.name)}</span>
            </div>
            <div className={styles.avatarRing} />
          </div>

          <div className={styles.heroBody}>
            <div className={styles.heroTop}>
              <div>
                <p className={styles.heroEyebrow}>{client.brandDescription || "Strategic Partner"}</p>
                <h1 className={styles.heroName}>{client.name}</h1>
              </div>
              <button className={styles.settingsBtn} onClick={() => setIsEditModalOpen(true)}>
                <FiEdit2 size={15} />
              </button>
            </div>

            <div className={styles.kpiStrip}>
              <div className={styles.kpi}>
                <span className={styles.kpiVal}>₹{client.packageAmount?.toLocaleString("en-IN") ?? "—"}</span>
                <span className={styles.kpiLabel}>/ month</span>
              </div>
              <div className={styles.kpiDivider} />
              <div className={styles.kpi}>
                <span className={styles.kpiVal}>{totalDeliverables || "—"}</span>
                <span className={styles.kpiLabel}>deliverables</span>
              </div>
              <div className={styles.kpiDivider} />
              <div className={styles.kpi}>
                <span className={styles.kpiVal}>{daysActive !== null ? daysActive : "—"}</span>
                <span className={styles.kpiLabel}>days active</span>
              </div>
              <div className={styles.kpiDivider} />
              <div className={styles.kpi}>
                <span className={styles.kpiVal}>{connectedCount}/6</span>
                <span className={styles.kpiLabel}>platforms</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── PIPELINE / CALENDAR SECTION (moved above bento) ── */}
        <section className={styles.pipelineSection}>
          <div className={styles.pipelineHeader}>
            <div className={styles.pipelineTitle}>
              <div className={styles.tabSwitcher}>
                <button className={`${styles.tabBtn} ${activeTab === "pipeline" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("pipeline")}>
                  <FiList size={13} /> Pipeline
                </button>
                <button className={`${styles.tabBtn} ${activeTab === "calendar" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("calendar")}>
                  <FiCalendar size={13} /> Calendar
                </button>
              </div>
              {isNavigating && activeTab === "pipeline" && <span className={styles.loadingText}>Loading...</span>}
            </div>

            <div className={styles.pipelineActions}>
              {pendingCount > 0 && (
                <button className={styles.notifyBtn} disabled={notifying}
                  onClick={async () => {
                    setNotifying(true); setNotifyResult(null);
                    try {
                      const result = await notifyClient(client.id);
                      setNotifyResult({ type: "success", message: `Email sent to ${result.notified.join(", ")} · ${result.pendingCount} item${result.pendingCount > 1 ? "s" : ""}` });
                    } catch (err) {
                      setNotifyResult({ type: "error", message: err.message });
                    } finally {
                      setNotifying(false);
                      setTimeout(() => setNotifyResult(null), 6000);
                    }
                  }}>
                  {notifying ? <><span className={styles.notifySpinner} /> Sending...</> : <><FiBell size={13} /> Notify Client</>}
                </button>
              )}
              <button className={styles.primaryBtn} onClick={() => setEditingPost("NEW")}>
                <FiPlus size={14} /> New Deliverable
              </button>
            </div>
          </div>

          {notifyResult && (
            <div className={styles.notifyToast} style={{
              background: notifyResult.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${notifyResult.type === "success" ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
              color: notifyResult.type === "success" ? "#16a34a" : "#dc2626",
              margin: "0 24px", marginTop: "12px",
            }}>
              {notifyResult.type === "success" ? "✓ " : "⚠ "}{notifyResult.message}
            </div>
          )}

          {/* ── PIPELINE TAB ── */}
          {activeTab === "pipeline" && (
            <div className={styles.pipelineBody}>
              {totalPosts === 0 ? (
                <div className={styles.emptyPipeline}>
                  <FiYoutube size={32} />
                  <p>No content uploaded yet.</p>
                  <span>Upload a video/image to start the approval process.</span>
                </div>
              ) : (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={`${styles.table} ${isNavigating ? styles.tableLoading : ""}`}>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Platform</th>
                          <th>Status</th>
                          <th>Scheduled</th>
                          <th>Date Added</th>
                          <th className={styles.thRight}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.posts.map(post => (
                          <tr key={post.id} style={{ opacity: deletingPostId === post.id ? 0.4 : 1, transition: "opacity 200ms" }}>
                            <td className={styles.cellTitle}>
                              {post.title}
                              {post.mediaUrls?.length > 1 && (
                                <span className={styles.carouselBadge}>
                                  <FiGrid size={8} /> {post.mediaUrls.length}
                                </span>
                              )}
                            </td>
                            <td className={styles.cellPlatform}>{post.targetPlatform} {post.contentType}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[post.status]}`}>
                                {post.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className={styles.cellDate}>
                              {post.scheduledDate
                                ? new Date(post.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                                : <span style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px" }}>—</span>}
                            </td>
                            <td className={styles.cellDate}>
                              {new Date(post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className={styles.tdActions}>
                              <button
                                onClick={() => setEditingPost(post)}
                                className={`${styles.iconBtn} ${post.status === "CHANGES_REQUESTED" ? styles.pulseAlert : ""}`}
                                title="Edit"
                                disabled={deletingPostId === post.id}
                              >
                                <FiEdit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post)}
                                className={styles.iconBtnDanger}
                                title="Delete post"
                                disabled={deletingPostId === post.id}
                              >
                                {deletingPostId === post.id
                                  ? <span className={styles.deleteSpinner} />
                                  : <FiTrash2 size={15} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <span className={styles.pageInfo}>
                        Showing {(currentPage - 1) * postsPerPage + 1} to {Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts}
                      </span>
                      <div className={styles.pageControls}>
                        <button className={styles.pageBtn} onClick={() => navigateToPage(currentPage - 1)} disabled={currentPage === 1 || isNavigating}>
                          <FiChevronLeft size={14} /> Prev
                        </button>
                        <div className={styles.pageNumbers}>
                          <span className={styles.activePage}>{currentPage}</span> / {totalPages}
                        </div>
                        <button className={styles.pageBtn} onClick={() => navigateToPage(currentPage + 1)} disabled={currentPage === totalPages || isNavigating}>
                          Next <FiChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CALENDAR TAB ── */}
          {activeTab === "calendar" && (
            <div style={{ padding: "16px" }}>
              <ContentCalendar clientId={client.id} onEditPost={handleCalendarEditPost} />
            </div>
          )}
        </section>

        {/* ── BENTO GRID (moved below pipeline) ── */}
        <div className={styles.bento}>
          <div className={`${styles.card} ${styles.cardFinancial}`}>
            <div className={styles.cardLabel}><FiActivity size={12} /> Engagement</div>
            <div className={styles.financialBlock}>
              <div className={styles.financialRow}>
                <span className={styles.financialMeta}>Monthly Retainer</span>
                <span className={styles.financialBig}>₹{client.packageAmount?.toLocaleString("en-IN") ?? "0"}</span>
              </div>
              <div className={styles.financialDivider} />
              <div className={styles.financialRow}>
                <span className={styles.financialMeta}>Start Date</span>
                <span className={styles.financialMid}>
                  {client.startDate ? new Date(client.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardStats}`}>
            <div className={styles.cardLabel}><FiTrendingUp size={12} /> Content Stats</div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}><span className={styles.statNum}>{totalPosts}</span><span className={styles.statDesc}>Total Posts</span></div>
              <div className={styles.statBox}><span className={`${styles.statNum} ${styles.accentGreen}`}>{approvedCount}</span><span className={styles.statDesc}>Approved</span></div>
              <div className={styles.statBox}><span className={`${styles.statNum} ${styles.accentAmber}`}>{totalPosts - approvedCount}</span><span className={styles.statDesc}>Pending</span></div>
            </div>
            {totalPosts > 0 && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(approvedCount / totalPosts) * 100}%` }} />
              </div>
            )}
          </div>

          <div className={`${styles.card} ${styles.cardSocial}`}>
            <div className={styles.cardLabelRow}>
              <span className={styles.cardLabel}><FiGlobe size={12} /> Brand Channels</span>
              <span className={styles.cardBadge}>{connectedCount} linked</span>
            </div>
            <div className={styles.socialList}>
              {socialLinks.map(link => (
                <div key={link.id} className={`${styles.socialRow} ${!link.url ? styles.socialDim : ""}`} style={{ "--platform-color": link.color }}>
                  <div className={styles.socialIcon}>{link.icon}</div>
                  <span className={styles.socialLabel}>{link.label}</span>
                  {link.url ? (
                    <a href={link.url.startsWith("http") ? link.url : `https://${link.url}`} target="_blank" rel="noreferrer" className={styles.socialLink}><FiExternalLink size={11} /></a>
                  ) : <span className={styles.socialEmpty}>—</span>}
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardQuotas}`}>
            <div className={styles.cardLabelRow}>
              <span className={styles.cardLabel}><FiLayers size={12} /> Monthly Quotas</span>
              <button className={styles.manageBtn} onClick={() => setIsQuotaModalOpen(true)}><FiGrid size={12} /> Manage</button>
            </div>
            {client.quotas.length > 0 ? (
              <div className={styles.quotaList}>
                {client.quotas.map(q => (
                  <div key={q.id} className={styles.quotaItem}>
                    <div className={styles.quotaLeft}>
                      <span className={styles.quotaPlatform}>{q.platform}</span>
                      <span className={styles.quotaType}>{q.contentType}</span>
                    </div>
                    <div className={styles.quotaRight}>
                      <span className={styles.quotaNum}>{q.amount}</span>
                      <span className={styles.quotaUnit}>/ mo</span>
                      <button type="button"
                        onClick={async () => { if (window.confirm("Delete this quota?")) await deleteClientQuota(q.id, client.id); }}
                        className={styles.deleteQuotaBtn}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FiPackage size={28} />
                <p>No quotas configured</p>
                <span>Set up this client's monthly content package</span>
                <button className={styles.setupBtn} onClick={() => setIsQuotaModalOpen(true)}><FiZap size={13} /> Set Up Plan</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── MODALS ── */}
      {editingPost && (
        <DeliverableModal
          post={editingPost === "NEW" ? null : editingPost}
          clientId={client.id}
          onClose={() => setEditingPost(null)}
          onSuccess={() => { setEditingPost(null); router.push(`${pathname}?page=1`); }}
        />
      )}

      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Edit Brand Profile</h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={styles.closeBtn}><FiX size={20} /></button>
            </div>
            <form action={async (fd) => { await updateClientCore(client.id, fd); setIsEditModalOpen(false); }} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}><label>Brand Name</label><input name="name" defaultValue={client.name} required className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>Industry</label><input name="brandDescription" defaultValue={client.brandDescription} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>Retainer (₹)</label><input name="packageAmount" type="number" defaultValue={client.packageAmount} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>Start Date</label><input name="startDate" type="date" defaultValue={client.startDate ? new Date(client.startDate).toISOString().split("T")[0] : ""} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>Brand Logo URL</label><input name="logoUrl" type="url" defaultValue={client.logoUrl} placeholder="https://..." className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>Main Website</label><input name="websiteUrl" type="url" defaultValue={client.websiteUrl} placeholder="https://..." className={styles.inputField} /></div>
              </div>
              <h3 className={styles.modalSubHead}>Social Links</h3>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}><label>Instagram</label><input name="instagramUrl" defaultValue={client.instagramUrl} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>YouTube</label><input name="youtubeUrl" defaultValue={client.youtubeUrl} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>LinkedIn</label><input name="linkedinUrl" defaultValue={client.linkedinUrl} className={styles.inputField} /></div>
                <div className={styles.inputGroup}><label>WhatsApp</label><input name="whatsappNumber" defaultValue={client.whatsappNumber} className={styles.inputField} /></div>
              </div>
              <div className={styles.modalFooter}><button type="submit" className={styles.saveBtn}>Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {isQuotaModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add Content Quota</h2>
              <button type="button" onClick={() => setIsQuotaModalOpen(false)} className={styles.closeBtn}><FiX size={20} /></button>
            </div>
            <form action={async (fd) => { await addClientQuota(client.id, fd); setIsQuotaModalOpen(false); }} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Platform</label>
                  <select name="platform" className={styles.inputField}>
                    <option value="INSTAGRAM">Instagram</option><option value="YOUTUBE">YouTube</option><option value="LINKEDIN">LinkedIn</option><option value="FACEBOOK">Facebook</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Content Type</label>
                  <select name="contentType" className={styles.inputField}>
                    <option value="REEL">Reel / Short</option><option value="POST">Static Post</option><option value="STORY">Story</option><option value="VIDEO_LONG">Long Form Video</option>
                  </select>
                </div>
                <div className={styles.inputGroup}><label>Amount per Month</label><input name="amount" type="number" defaultValue={4} min={1} required className={styles.inputField} /></div>
              </div>
              <div className={styles.modalFooter}><button type="submit" className={styles.saveBtn}><FiPlus /> Add Quota</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}