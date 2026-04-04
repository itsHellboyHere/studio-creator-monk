"use server";
import { db } from "@/lib/db";

export async function getActionablePostCount() {
  try {
    // Count how many posts need the Team's attention
    const count = await db.post.count({
      where: {
        status: "CHANGES_REQUESTED", // You can also add "APPROVED" here if you want alerts for both
      },
    });
    return count;
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }
}