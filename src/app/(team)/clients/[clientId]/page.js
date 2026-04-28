import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientDashboard from "./ClientDashboard";
import { getHolidaysForMonth } from "@/app/(client)/portal/[clientId]/indianHolidays";

const POSTS_PER_PAGE = 15;

export default async function ClientAdminPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const clientId = resolvedParams.clientId;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10));

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const nextYear     = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonth    = currentMonth === 12 ? 1 : currentMonth + 1;
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd     = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totalPosts, client, approvedCount, pendingCount, currentMonthPosts] = await Promise.all([
    db.post.count({ where: { clientId } }),
    db.client.findUnique({
      where: { id: clientId },
      include: {
        quotas: true,
        posts: {
          take: POSTS_PER_PAGE,
          skip: (currentPage - 1) * POSTS_PER_PAGE,
          orderBy: { createdAt: "desc" },
        },
        festiveRequests: {
          orderBy: { festivalDate: "asc" },
        },
      },
    }),
    db.post.count({ where: { clientId, status: "APPROVED" } }),
    db.post.count({ where: { clientId, status: "PENDING_REVIEW" } }),
    db.post.findMany({
      where: { clientId, scheduledDate: { gte: monthStart, lte: monthEnd } },
      select: {
        id: true, status: true,
        targetPlatform: true, contentType: true, scheduledDate: true,
      },
    }),
  ]);

  if (!client) return notFound();

  const holidays = [
    ...getHolidaysForMonth(currentYear, currentMonth),
    ...getHolidaysForMonth(nextYear, nextMonth),
  ];

  return (
    <ClientDashboard
      client={client}
      totalPosts={totalPosts}
      approvedCount={approvedCount}
      pendingCount={pendingCount}
      currentPage={currentPage}
      postsPerPage={POSTS_PER_PAGE}
      holidays={holidays}
      currentMonthPosts={currentMonthPosts}
    />
  );
}