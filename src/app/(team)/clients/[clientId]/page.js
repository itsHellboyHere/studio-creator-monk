import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientDashboard from "./ClientDashboard";

const POSTS_PER_PAGE = 2;

export default async function ClientAdminPage({ params, searchParams }) {
  // Await Next.js 15+ params
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const clientId = resolvedParams.clientId;
  
  // Safely parse the current page from the URL (default to 1)
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10));

  // 1. Get the total count of posts (Needed to calculate total pages)
  const totalPosts = await db.post.count({
    where: { clientId }
  });

  // 2. Fetch the client, quotas, and ONLY the posts for the current page
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: { 
      quotas: true,
      posts: {
        take: POSTS_PER_PAGE,
        skip: (currentPage - 1) * POSTS_PER_PAGE,
        orderBy: { createdAt: 'desc' }
      } 
    }
  });

  if (!client) return notFound();

  // 3. We also need to know the total approved posts for the KPI cards.
  const approvedCount = await db.post.count({
    where: { 
      clientId, 
      status: "APPROVED" 
    }
  });

  // 4. NEW: Get exact count of posts waiting for client review to fix the Notification bug
  const pendingCount = await db.post.count({
    where: { 
      clientId, 
      status: "PENDING_REVIEW" 
    }
  });

  return (
    <ClientDashboard 
      client={client} 
      totalPosts={totalPosts} 
      approvedCount={approvedCount}
      pendingCount={pendingCount} 
      currentPage={currentPage}
      postsPerPage={POSTS_PER_PAGE}
    />
  );
}