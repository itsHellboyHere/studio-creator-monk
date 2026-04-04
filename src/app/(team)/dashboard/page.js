import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EditControls from "./EditControls";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [initialStats, clientCount, postCount] = await Promise.all([
    db.agencyOverview.findUnique({ where: { id: "global_stats" } }),
    db.client.count(),
    db.post.count(),
  ]);

  let stats = initialStats;

  if (!stats) {
    stats = await db.agencyOverview.create({
      data: {
        id: "global_stats",
        brandRelationships: "80+",
        completedMandates: 56,
        ongoingWorkstreams: 35,
        agencyStrength: 14,
        brandRelNote: "Mix of local & retainer brands",
        completedManNote: "Successful project handovers",
        ongoingWorkNote: "Active monthly engagements",
        agencyStrNote: "Founders & specialized pods",
      }
    });
  }

  const topMetrics = [
    { label: "Brand Relationships", value: stats?.brandRelationships ?? "—", note: stats?.brandRelNote ?? "Active client roster", accent: true },
    { label: "Completed Mandates", value: stats?.completedMandates ?? "—", note: stats?.completedManNote ?? "Delivered projects" },
    { label: "Ongoing Workstreams", value: stats?.ongoingWorkstreams ?? "—", note: stats?.ongoingWorkNote ?? "Live engagements" },
    { label: "Agency Strength", value: stats?.agencyStrength ?? "—", note: stats?.agencyStrNote ?? "Team members" },
  ];

  const bottomMetrics = [
    { label: "Total Clients", value: clientCount, note: "Onboarded to platform" },
    { label: "Total Deliverables", value: postCount, note: "Posts & reels logged" },
  ];

  const name = session.user.email.split("@")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>CreatorMonk HQ</div>
          <h1 className={styles.title}>
            Good {greeting}, <em>{name}</em>
          </h1>
          <p className={styles.subtitle}>Agency metrics — live across all workstreams</p>
        </div>
        
        <div className={styles.headerRight}>
          {/* THE TRIGGER COMPONENT */}
          <EditControls stats={stats} />
          
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            Live
          </div>
        </div>
      </div>

      {/* ... Rest of your grid sections remain the same ... */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Agency Overview</span>
          <div className={styles.sectionLine} />
        </div>
        <div className={styles.grid}>
          {topMetrics.map((m, i) => (
            <div key={m.label} className={`${styles.card} ${m.accent ? styles.cardAccent : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className={styles.cardMeta}>
                <span className={styles.cardLabel}>{m.label}</span>
                <span className={styles.cardNum}>0{i + 1}</span>
              </div>
              <div className={styles.cardValue}>{m.value}</div>
              <div className={styles.cardNote}>{m.note}</div>
              <div className={styles.cardDivider} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Platform Activity</span>
          <div className={styles.sectionLine} />
        </div>
        <div className={`${styles.grid} ${styles.gridBottom}`}>
          {bottomMetrics.map((m, i) => (
            <div key={m.label} className={styles.card} style={{ animationDelay: `${(i + 4) * 50}ms` }}>
              <div className={styles.cardMeta}>
                <span className={styles.cardLabel}>{m.label}</span>
                <span className={styles.cardNum}>0{i + 5}</span>
              </div>
              <div className={styles.cardValue}>{m.value}</div>
              <div className={styles.cardNote}>{m.note}</div>
              <div className={styles.cardDivider} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span>CreatorMonk Portal · {new Date().getFullYear()}</span>
        <div className={styles.footerRight}>
          <span>Signed in as {session.user.email}</span>
          <span className={styles.roleBadge}>{session.user.role}</span>
        </div>
      </div>
    </div>
  );
}