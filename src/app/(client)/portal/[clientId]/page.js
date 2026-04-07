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

export default async function ClientPortalPage({ params }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  const session = await getServerSession(authOptions);
  const isAdminOrTeam =
    session?.user?.role === "ADMIN" || session?.user?.role === "TEAM";

  const client = await db.client.findUnique({
    where: { id: clientId },
    include: {
      quotas: true,
      posts: {
        orderBy: { createdAt: "desc" },
        // Prisma returns all scalar fields automatically —
        // mediaUrls, scheduledDate, etc. all included
      },
    },
  });

  if (!client) return notFound();

  return <PortalDashboard client={client} isAdminOrTeam={isAdminOrTeam} />;
}