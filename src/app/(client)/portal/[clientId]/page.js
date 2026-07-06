import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PortalDashboard from "./PortalDashboard";
import { getHolidaysForMonth } from "./indianHolidays";

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

export default async function ClientPortalPage({ params }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  const session = await getServerSession(authOptions);
  const isAdminOrTeam =
    session?.user?.role === "ADMIN" || session?.user?.role === "TEAM";

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const nextYear     = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonth    = currentMonth === 12 ? 1 : currentMonth + 1;

  const [client] = await Promise.all([
    db.client.findUnique({
      where: { id: clientId },
      include: {
        quotas: true,
        posts: {
   
          where: isAdminOrTeam ? undefined : { status: { not: "DRAFT" } },
          orderBy: { createdAt: "desc" },
        },
        festiveRequests: { orderBy: { festivalDate: "asc" } },
      },
    }),
  ]);

  if (!client) return notFound();

  const holidays = [
    ...getHolidaysForMonth(currentYear, currentMonth),
    ...getHolidaysForMonth(nextYear, nextMonth),
  ];

  return (
    <PortalDashboard
      client={client}
      isAdminOrTeam={isAdminOrTeam}
      holidays={holidays}
    />
  );
}