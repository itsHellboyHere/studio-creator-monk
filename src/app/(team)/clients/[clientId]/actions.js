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

export async function createDeliverable(clientId, formData) {
  await db.post.create({
    data: {
      clientId,
      title: formData.get("title"),
      driveLink: formData.get("driveLink"),
      caption: formData.get("caption") || null,
      targetPlatform: formData.get("targetPlatform") || null,
      contentType: formData.get("contentType") || null,
      status: formData.get("status") || "DRAFT", 
    }
  });
  revalidatePath(`/clients/${clientId}`);
}

// NEW: Action to update an existing deliverable (Closing the feedback loop)
export async function updateDeliverable(postId, clientId, formData) {
  await db.post.update({
    where: { id: postId },
    data: {
      title: formData.get("title"),
      driveLink: formData.get("driveLink"), // Team can paste new S3 link here (V2)
      caption: formData.get("caption") || null,
      targetPlatform: formData.get("targetPlatform") || null,
      contentType: formData.get("contentType") || null,
      status: formData.get("status"), 
    }
  });
  revalidatePath(`/clients/${clientId}`);
}