import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ExternalLink, Plus } from "lucide-react";
import SearchBar from "./SearchBar"; 
import styles from "./clients.module.css";

export const metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Await searchParams in Next.js 15+
  const sParams = await searchParams;
  const query = sParams?.search || "";
  const industry = sParams?.industry || "";
  const minPrice = parseInt(sParams?.minPrice) || 0;

  // Fetch with safety filters
  const clients = await db.client.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brandDescription: { contains: query, mode: 'insensitive' } },
          ],
        },
        industry ? { brandDescription: { equals: industry } } : {},
        { packageAmount: { gte: minPrice } }
      ]
    },
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } }
  }) || []; // Fallback to empty array to prevent .map() error

  const allIndustries = await db.client.findMany({
    select: { brandDescription: true },
    distinct: ['brandDescription'],
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>Agency Command</div>
          <h1 className={styles.title}>Client <em>Directory</em></h1>
        </div>
        <Link href="/onboarding" className={styles.addBtn}>
          <Plus size={18} /> Onboard New Brand
        </Link>
      </header>

      <SearchBar industries={allIndustries.map(i => i.brandDescription).filter(Boolean)} />

      <div className={styles.grid}>
        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <p>No brands found matching your criteria.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className={styles.clientCard}>
              <div className={styles.cardTop}>
                <div className={styles.brandIcon}>{client.brandIcon || client.name[0]}</div>
                <div className={styles.statusPill}>Active</div>
              </div>
              <div className={styles.brandMain}>
                <h3 className={styles.brandName}>{client.name}</h3>
                <p className={styles.brandIndustry}>{client.brandDescription || "No Industry Set"}</p>
              </div>
              <div className={styles.metrics}>
                <div className={styles.metricItem}>
                  <label>Monthly Plan</label>
                  <span>₹{client.packageAmount?.toLocaleString() || "0"}</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <Link href={`/clients/${client.id}`} className={styles.portalLink}>
                  Open Portal <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}