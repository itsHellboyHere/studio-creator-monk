import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PortalDashboard from "./PortalDashboard";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { name: true }
  });
  return {
    title: client ? `${client.name} Portal | CreatorMonk` : "Client Portal | CreatorMonk",
    description: "Client deliverable and review portal.",
  };
}

async function fetchIndianHolidays(year, month) {
  try {
    const res = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${process.env.CALENDARIFIC_API_KEY}&country=IN&year=${year}&month=${month}&type=national,religious,observance`,
      { next: { revalidate: 86400 } } // cache 24hrs
    );
    const data = await res.json();
    return data?.response?.holidays || [];
  } catch {
    return [];
  }
}

export default async function ClientPortalPage({ params }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  const session = await getServerSession(authOptions);
  const isAdminOrTeam =
    session?.user?.role === "ADMIN" || session?.user?.role === "TEAM";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // calendarific is 1-indexed

  // Fetch holidays for current + next month in parallel
  const [client, currentHolidays, nextHolidays] = await Promise.all([
    db.client.findUnique({
      where: { id: clientId },
      include: {
        quotas: true,
        posts: {
          orderBy: { createdAt: "desc" },
        },
        festiveRequests: {
          orderBy: { festivalDate: "asc" },
        },
      },
    }),
    fetchIndianHolidays(currentYear, currentMonth),
    fetchIndianHolidays(
      currentMonth === 12 ? currentYear + 1 : currentYear,
      currentMonth === 12 ? 1 : currentMonth + 1
    ),
  ]);

  if (!client) return notFound();

  const holidays = [...currentHolidays, ...nextHolidays];

  return (
    <PortalDashboard
      client={client}
      isAdminOrTeam={isAdminOrTeam}
      holidays={holidays}
    />
  );
}