"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateClientProfile(clientId, formData) {
  await db.client.update({
    where: { id: clientId },
    data: {
      brandDescription: formData.get("brandDescription"),
      websiteUrl:       formData.get("websiteUrl"),
      instagramUrl:     formData.get("instagramUrl"),
      facebookUrl:      formData.get("facebookUrl"),
      youtubeUrl:       formData.get("youtubeUrl"),
      linkedinUrl:      formData.get("linkedinUrl"),
      whatsappNumber:   formData.get("whatsappNumber"),
      twitterXUrl:      formData.get("twitterXUrl"),
      otherSocialUrl:   formData.get("otherSocialUrl"),
    },
  });
  revalidatePath(`/portal/${clientId}`);
}


export async function submitPostReview(postId, clientId, action, feedback) {
  const newStatus = action === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED";
  await db.post.update({
    where: { id: postId },
    data: {
      status:     newStatus,
      clientNote: feedback || null,
      approvedAt: newStatus === "APPROVED" ? new Date() : null,
    },
  });
  revalidatePath(`/portal/${clientId}`);
}

export async function requestFestivePost(clientId, festivalName, festivalDate) {
  await db.festivePostRequest.upsert({
    where: {
      clientId_festivalDate_festivalName: {
        clientId,
        festivalDate: new Date(festivalDate),
        festivalName,
      },
    },
    update: { status: "PENDING" },
    create: {
      clientId,
      festivalName,
      festivalDate: new Date(festivalDate),
      status: "PENDING",
    },
  });
  revalidatePath(`/portal/${clientId}`);
}

export async function cancelFestiveRequest(clientId, festivalName, festivalDate) {
  await db.festivePostRequest.deleteMany({
    where: {
      clientId,
      festivalName,
      festivalDate: new Date(festivalDate),
    },
  });
  revalidatePath(`/portal/${clientId}`);
}