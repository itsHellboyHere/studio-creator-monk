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
  await db.post.update({
    where: { id: postId },
    data: {
      status:     action === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED",
      clientNote: feedback || null,
    },
  });
  revalidatePath(`/portal/${clientId}`);
}