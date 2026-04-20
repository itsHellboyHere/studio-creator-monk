"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateClientCore(clientId, formData) {
  const packageAmount = formData.get("packageAmount");
  const startDate = formData.get("startDate");

  await db.client.update({
    where: { id: clientId },
    data: {
      name: formData.get("name"),
      brandDescription: formData.get("brandDescription"),
      packageAmount: packageAmount ? parseFloat(packageAmount) : null,
      startDate: startDate ? new Date(startDate) : null,
      logoUrl: formData.get("logoUrl"),
      websiteUrl: formData.get("websiteUrl"),
      instagramUrl: formData.get("instagramUrl"),
      facebookUrl: formData.get("facebookUrl"),
      youtubeUrl: formData.get("youtubeUrl"),
      linkedinUrl: formData.get("linkedinUrl"),
      whatsappNumber: formData.get("whatsappNumber"),
    }
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientQuota(clientId, formData) {
  const platform = formData.get("platform");
  const contentType = formData.get("contentType");
  const amount = parseInt(formData.get("amount"), 10);

  await db.clientMonthlyQuota.upsert({
    where: { clientId_platform_contentType: { clientId, platform, contentType } },
    update: { amount },
    create: { clientId, platform, contentType, amount }
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientQuota(quotaId, clientId) {
  await db.clientMonthlyQuota.delete({ where: { id: quotaId } });
  revalidatePath(`/clients/${clientId}`);
}

function parseScheduledDate(formData) {
  const raw = formData.get("scheduledDate");
  if (!raw || raw === "") return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function parseMediaUrls(formData) {
  const raw = formData.get("mediaUrls");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw ? [raw] : [];
  }
}

export async function createDeliverable(clientId, formData) {
  const mediaUrls = parseMediaUrls(formData);
  await db.post.create({
    data: {
      clientId,
      title: formData.get("title"),
      mediaUrls,
      caption: formData.get("caption") || null,
      targetPlatform: formData.get("targetPlatform") || null,
      contentType: formData.get("contentType") || null,
      status: formData.get("status") || "DRAFT",
      scheduledDate: parseScheduledDate(formData),
    }
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function updateDeliverable(postId, clientId, formData) {
  const mediaUrls = parseMediaUrls(formData);
  const newStatus = formData.get("status");

  await db.post.update({
    where: { id: postId },
    data: {
      title: formData.get("title"),
      mediaUrls,
      caption: formData.get("caption") || null,
      targetPlatform: formData.get("targetPlatform") || null,
      contentType: formData.get("contentType") || null,
      status: newStatus,
      scheduledDate: parseScheduledDate(formData),
      approvedAt: newStatus === "APPROVED" ? new Date() : null,
    }
  });
  revalidatePath(`/clients/${clientId}`);
}

// ── NEW: Delete a deliverable permanently ──
export async function deleteDeliverable(postId, clientId) {
  await db.post.delete({ where: { id: postId } });
  revalidatePath(`/clients/${clientId}`);
}

import { sendClientNotification } from "@/lib/email";

export async function notifyClient(clientId) {
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: {
      users: { where: { role: "CLIENT" }, select: { email: true } },
      posts: {
        where: { status: "PENDING_REVIEW" },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) throw new Error("Client not found");
  if (!client.posts.length) throw new Error("No pending posts to notify about.");
  if (!client.users.length) throw new Error("No client email found.");

  const pendingCount = client.posts.length;
  const firstTitle = client.posts[0].title;
  const emailSubject = pendingCount === 1 ? firstTitle : `${pendingCount} new deliverables`;

  for (const user of client.users) {
    await sendClientNotification(user.email, client.name, emailSubject, clientId);
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, notified: client.users.map(u => u.email), pendingCount };
}

export async function getPostsForMonth(clientId, year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const posts = await db.post.findMany({
    where: { clientId, scheduledDate: { gte: start, lte: end } },
    select: {
      id: true,
      title: true,
      scheduledDate: true,
      targetPlatform: true,
      contentType: true,
      status: true,
      mediaUrls: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  return posts;
}
export async function updateFestiveRequestStatus(requestId, clientId, newStatus) {
  await db.festivePostRequest.update({
    where: { id: requestId },
    data: { status: newStatus },
  });
  revalidatePath(`/clients/${clientId}`);
}