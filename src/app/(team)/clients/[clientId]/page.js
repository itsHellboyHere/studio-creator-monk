import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientDashboard from "./ClientDashboard";

const POSTS_PER_PAGE = 15;

async function fetchIndianHolidays(year, month) {
  try {
    const res = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${process.env.CALENDARIFIC_API_KEY}&country=IN&year=${year}&month=${month}&type=national,religious,observance`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    return data?.response?.holidays || [];
  } catch {
    return [];
  }
}

export default async function ClientAdminPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const clientId = resolvedParams.clientId;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [totalPosts, client, approvedCount, pendingCount, currentHolidays, nextHolidays] = await Promise.all([
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
    fetchIndianHolidays(currentYear, currentMonth),
    fetchIndianHolidays(
      currentMonth === 12 ? currentYear + 1 : currentYear,
      currentMonth === 12 ? 1 : currentMonth + 1
    ),
  ]);

  if (!client) return notFound();

  const holidays = [...currentHolidays, ...nextHolidays];

  return (
    <ClientDashboard
      client={client}
      totalPosts={totalPosts}
      approvedCount={approvedCount}
      pendingCount={pendingCount}
      currentPage={currentPage}
      postsPerPage={POSTS_PER_PAGE}
      holidays={holidays}
    />
  );
}