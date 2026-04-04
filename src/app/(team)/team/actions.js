"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updatePodData(podId, formData) {
  // Helper to convert comma-separated strings into clean arrays
  const parseList = (str) => 
    str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];

  await db.teamProfile.update({
    where: { id: podId },
    data: {
      teamSize: parseInt(formData.get("teamSize")),
      completedMandates: parseInt(formData.get("completedMandates")),
      ongoingProjects: parseInt(formData.get("ongoingProjects")),
      podDescription: formData.get("podDescription"),
      services: parseList(formData.get("services")),
      completedWorks: parseList(formData.get("completedWorks")),
      ongoingWorks: parseList(formData.get("ongoingWorks")),
    },
  });

  revalidatePath("/team");
}