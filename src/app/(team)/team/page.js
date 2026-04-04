import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EditTeamControls from "./EditTeamControls";
import styles from "./team.module.css";

const POD_ICONS = {
  "Tech": "⚙️",
  "Operations": "🎯",
  "Growth": "📈",
  "Creative": "🎨",
  "Sales": "⚡",
};

function getPodIcon(roleLabel) {
  const match = Object.keys(POD_ICONS).find(k => roleLabel?.includes(k));
  return match ? POD_ICONS[match] : "🚀";
}

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const profiles = await db.teamProfile.findMany({
    orderBy: { teamSize: "desc" },
  });

  const totalTeam = profiles.reduce((sum, p) => sum + p.teamSize, 0);
  const totalCompleted = profiles.reduce((sum, p) => sum + p.completedMandates, 0);
  const totalOngoing = profiles.reduce((sum, p) => sum + p.ongoingProjects, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Agency Structure</div>
          <h1 className={styles.title}>Founder <em>Pods</em></h1>
          <p className={styles.subtitle}>
            Specialized delivery units driving CreatorMonk.
          </p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{profiles.length}</span>
            <span className={styles.headerStatLab}>Active Pods</span>
          </div>
          <div className={styles.headerStatDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{totalTeam}</span>
            <span className={styles.headerStatLab}>Team Members</span>
          </div>
          <div className={styles.headerStatDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{totalCompleted}</span>
            <span className={styles.headerStatLab}>Delivered</span>
          </div>
          <div className={styles.headerStatDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{totalOngoing}</span>
            <span className={styles.headerStatLab}>Ongoing</span>
          </div>
        </div>
      </header>

      {profiles.length === 0 ? (
        <div className={styles.empty}>
          <p>No team profiles yet.</p>
        </div>
      ) : (
        <div className={styles.podGrid}>
          {profiles.map((pod) => (
            <div key={pod.id} className={styles.podCard}>

              {/* Card Top */}
              <div className={styles.cardTop}>
                <div className={styles.podIconWrap}>
                  <span className={styles.podIcon}>{getPodIcon(pod.podRoleLabel)}</span>
                </div>
                <span className={styles.sizeBadge}>{pod.teamSize}-Person Pod</span>
              </div>

              {/* Identity */}
              <div className={styles.podIdentity}>
                <h3 className={styles.founderName}>
                  {pod.roleTitle?.split(" - ")[0] ?? "Founder"}
                </h3>
                <span className={styles.roleLabel}>{pod.podRoleLabel}</span>
              </div>

              {/* Stats */}
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statVal}>{pod.completedMandates}</span>
                  <span className={styles.statLab}>Completed</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statVal}>{pod.ongoingProjects}</span>
                  <span className={styles.statLab}>Ongoing</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statVal}>{pod.teamSize}</span>
                  <span className={styles.statLab}>Members</span>
                </div>
              </div>

              {/* Summary */}
              {pod.podDescription && (
                <p className={styles.summary}>{pod.podDescription}</p>
              )}

              {/* Services */}
              {pod.services?.length > 0 && (
                <div className={styles.tagSection}>
                  <span className={styles.tagLabel}>Service Mix</span>
                  <div className={styles.tagCloud}>
                    {pod.services.map(s => (
                      <span key={s} className={styles.serviceTag}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Work */}
              {pod.completedWorks?.length > 0 && (
                <div className={styles.tagSection}>
                  <span className={styles.tagLabel}>Client Stack</span>
                  <div className={styles.tagCloud}>
                    {pod.completedWorks.slice(0, 6).map(w => (
                      <span key={w} className={styles.workTag}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={styles.cardFooter}>
                <EditTeamControls pod={pod} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}