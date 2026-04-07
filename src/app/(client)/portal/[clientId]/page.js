// (portal)/[clientId]/page.js
// CHANGE: add scheduledDate to the posts select so calendar works

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
        // scheduledDate is now included automatically — Prisma returns all scalar fields
      },
    },
  });
  
  if (!client) return notFound();

  return <PortalDashboard client={client} isAdminOrTeam={isAdminOrTeam} />;
}