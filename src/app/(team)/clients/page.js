import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ExternalLink, Plus } from "lucide-react";
import SearchBar from "./SearchBar";
import BrandLogo from "./BrandLogo";
import styles from "./clients.module.css";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const query     = sParams?.search    || "";
  const industry  = sParams?.industry  || "";
  const minPrice  = parseFloat(sParams?.minPrice) || 0;

  // ── Single optimised query — no second round-trip for industries ──
  const clients = await db.client.findMany({
    where: {
      AND: [
        // Text search across name + brandDescription
        query
          ? {
              OR: [
                { name:             { contains: query, mode: "insensitive" } },
                { brandDescription: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        // Industry filter matches against brandDescription (no separate field)
        industry ? { brandDescription: { contains: industry, mode: "insensitive" } } : {},
        // Package floor
        minPrice > 0 ? { packageAmount: { gte: minPrice } } : {},
      ],
    },
    orderBy: { name: "asc" },
    select: {
      id:              true,
      name:            true,
      brandDescription:true,
      logoUrl:         true,
      brandIcon:       true,
      packageAmount:   true,
      startDate:       true,
      _count: { select: { posts: true } },
    },
  });

  // Distinct industry labels for the filter dropdown
  // We derive them from brandDescription — short values only (≤ 40 chars)
  const rawIndustries = await db.client.findMany({
    select:   { brandDescription: true },
    distinct: ["brandDescription"],
    where:    { brandDescription: { not: null } },
    orderBy:  { brandDescription: "asc" },
  });

  const industries = rawIndustries
    .map((r) => r.brandDescription)
    .filter((v) => v && v.length <= 40); // skip long bio strings

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
            const imageUrl   = client.logoUrl || client.brandIcon || null;
            const postCount  = client._count?.posts ?? 0;
            const startLabel = client.startDate
              ? new Date(client.startDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year:  "numeric",
                })
              : null;

            // Show brandDescription as industry label — truncate if too long
            const industryLabel = client.brandDescription
              ? client.brandDescription.length > 35
                ? client.brandDescription.slice(0, 35) + "…"
                : client.brandDescription
              : "No Industry Set";

            return (
              <div key={client.id} className={styles.clientCard}>
                {/* Top row: logo + status */}
                <div className={styles.cardTop}>
                  <BrandLogo name={client.name} imageUrl={imageUrl} />
                  <div className={styles.statusPill}>Active</div>
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
                    className={styles.portalLink}
                  >
                    Open Portal <ExternalLink size={14} />
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