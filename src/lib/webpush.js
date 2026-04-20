import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPushToTeam(payload) {
  // Get all ADMIN and TEAM users' subscriptions
  const subscriptions = await db.pushSubscription.findMany({
    where: {
      user: { role: { in: ["ADMIN", "TEAM"] } },
    },
  });

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err) => {
        // Auto-cleanup expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      })
    )
  );

  return results;
}