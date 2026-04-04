// src/app/(team)/dashboard/actions.js
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateAgencyStats(formData) {
  const data = {
    brandRelationships: formData.get("brandRelationships"),
    completedMandates: parseInt(formData.get("completedMandates")),
    ongoingWorkstreams: parseInt(formData.get("ongoingWorkstreams")),
    agencyStrength: parseInt(formData.get("agencyStrength")),
    brandRelNote: formData.get("brandRelNote"),
    completedManNote: formData.get("completedManNote"),
    ongoingWorkNote: formData.get("ongoingWorkNote"),
    agencyStrNote: formData.get("agencyStrNote"),
  };

  await db.agencyOverview.update({
    where: { id: "global_stats" },
    data,
  });

  revalidatePath("/dashboard");
}