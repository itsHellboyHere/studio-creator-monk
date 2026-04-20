import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys } = await req.json();

  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
   console.log("SESSION:", JSON.stringify(session?.user));
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  await db.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}