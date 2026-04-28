import { sendPushToTeam } from "@/lib/webpush";
import { db } from "@/lib/db";

export async function POST(request) {
  try {
    const { clientId, clientName } = await request.json();
    if (!clientId || !clientName) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    await sendPushToTeam({
      title: "🟢 Client is Live",
      body: `${clientName} just opened their portal`,
      tag: `portal-live-${clientId}`,
      url: `/clients/${clientId}`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("portal-live error:", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}