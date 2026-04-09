import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ExternalLink, Plus, AlertCircle } from "lucide-react";
import SearchBar from "./SearchBar";
import BrandLogo from "./BrandLogo";
import styles from "./clients.module.css";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const query    = sParams?.search   || "";
  const industry = sParams?.industry || "";
  const minPrice = parseFloat(sParams?.minPrice) || 0;

  const clients = await db.client.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name:             { contains: query, mode: "insensitive" } },
                { brandDescription: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        industry ? { brandDescription: { contains: industry, mode: "insensitive" } } : {},
        minPrice > 0 ? { packageAmount: { gte: minPrice } } : {},
      ],
    },
    orderBy: [
      // Clients with pending changes bubble to top
      { posts: { _count: "desc" } },
      { name: "asc" },
    ],
    select: {
      id:               true,
      name:             true,
      brandDescription: true,
      logoUrl:          true,
      brandIcon:        true,
      packageAmount:    true,
      startDate:        true,
      _count: { select: { posts: true } },
      // Pull only CHANGES_REQUESTED posts — we just need their count
      posts: {
        where:  { status: "CHANGES_REQUESTED" },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5, // cap — we only need to show the latest few
      },
    },
  });

  // Sort: clients with CHANGES_REQUESTED float to the top
  clients.sort((a, b) => b.posts.length - a.posts.length);

  const rawIndustries = await db.client.findMany({
    select:   { brandDescription: true },
    distinct: ["brandDescription"],
    where:    { brandDescription: { not: null } },
    orderBy:  { brandDescription: "asc" },
  });

  const industries = rawIndustries
    .map((r) => r.brandDescription)
    .filter((v) => v && v.length <= 40);

  const totalPendingClients = clients.filter((c) => c.posts.length > 0).length;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Agency Command</div>
          <h1 className={styles.title}>
            Client <em>Directory</em>
          </h1>
        </div>
        <Link href="/onboarding" className={styles.addBtn}>
          <Plus size={18} /> Onboard New Brand
        </Link>
      </header>

      {/* ── Alert Banner — only if there are pending change requests ── */}
      {totalPendingClients > 0 && (
        <div className={styles.alertBanner}>
          <AlertCircle size={16} />
          <span>
            <strong>{totalPendingClients} client{totalPendingClients > 1 ? "s" : ""}</strong>
            {" "}ha{totalPendingClients > 1 ? "ve" : "s"} requested changes — review highlighted cards below.
          </span>
        </div>
      )}

      <SearchBar industries={industries} />

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <p>No brands found matching your criteria.</p>
          </div>
        ) : (
          clients.map((client) => {
            const imageUrl    = client.logoUrl || client.brandIcon || null;
            const postCount   = client._count?.posts ?? 0;
            const startLabel  = client.startDate
              ? new Date(client.startDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year:  "numeric",
                })
              : null;

            const industryLabel = client.brandDescription
              ? client.brandDescription.length > 35
                ? client.brandDescription.slice(0, 35) + "…"
                : client.brandDescription
              : "No Industry Set";

            // Posts flagged as CHANGES_REQUESTED for this client
            const changedPosts   = client.posts; // already filtered in query
            const hasChanges     = changedPosts.length > 0;

            return (
              <div
                key={client.id}
                className={`${styles.clientCard} ${hasChanges ? styles.clientCardAlert : ""}`}
              >
                {/* ── Changes-requested strip ── */}
                {hasChanges && (
                  <div className={styles.changesStrip}>
                    <span className={styles.changesDot} />
                    <span className={styles.changesLabel}>
                      {changedPosts.length} change{changedPosts.length > 1 ? "s" : ""} requested
                    </span>
                    {/* Show up to 2 post titles */}
                    <span className={styles.changesPostList}>
                      {changedPosts.slice(0, 2).map((p) => (
                        <span key={p.id} className={styles.changesPostChip}>
                          {p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title}
                        </span>
                      ))}
                      {changedPosts.length > 2 && (
                        <span className={styles.changesPostChip}>+{changedPosts.length - 2} more</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Top row: logo + status */}
                <div className={styles.cardTop}>
                  <BrandLogo name={client.name} imageUrl={imageUrl} />
                  <div className={hasChanges ? styles.statusPillAlert : styles.statusPill}>
                    {hasChanges ? "⚡ Review" : "Active"}
                  </div>
                </div>

                {/* Brand name + industry */}
                <div className={styles.brandMain}>
                  <h3 className={styles.brandName}>{client.name}</h3>
                  <p className={styles.brandIndustry}>{industryLabel}</p>
                </div>

                {/* Metrics */}
                <div className={styles.metrics}>
                  <div className={styles.metricItem}>
                    <label>Monthly Plan</label>
                    <span>
                      ₹{client.packageAmount
                        ? client.packageAmount.toLocaleString("en-IN")
                        : "—"}
                    </span>
                  </div>
                  <div className={styles.metricItem}>
                    <label>Posts</label>
                    <span>{postCount}</span>
                  </div>
                  {startLabel && (
                    <div className={styles.metricItem}>
                      <label>Since</label>
                      <span>{startLabel}</span>
                    </div>
                  )}
                </div>

                {/* Footer CTA */}
                <div className={styles.cardFooter}>
                  <Link
                    href={`/clients/${client.id}`}
                    className={`${styles.portalLink} ${hasChanges ? styles.portalLinkAlert : ""}`}
                  >
                    {hasChanges ? "Review Changes" : "Open Portal"} <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}