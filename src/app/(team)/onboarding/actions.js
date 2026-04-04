"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function onboardClient(formData) {
  const name     = formData.get("name")?.toString()?.trim();
  const email    = formData.get("email")?.toString()?.trim();
  const password = formData.get("password")?.toString();

  if (!name)     throw new Error("Brand name is required.");
  if (!email)    throw new Error("Contact email is required.");
  if (!password) throw new Error("Portal password is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists.");

  const hashedPassword = await bcrypt.hash(password, 10);

  const client = await db.client.create({
    data: {
      name,
      brandDescription: formData.get("brandDescription")?.toString() || null,
      logoUrl:          formData.get("logoUrl")?.toString() || null,
      brandIcon:        formData.get("logoUrl")?.toString() || null,
      websiteUrl:       formData.get("websiteUrl")?.toString() || null,
      instagramUrl:     formData.get("instagramUrl")?.toString() || null,
      facebookUrl:      formData.get("facebookUrl")?.toString() || null,
      youtubeUrl:       formData.get("youtubeUrl")?.toString() || null,
      linkedinUrl:      formData.get("linkedinUrl")?.toString() || null,
      whatsappNumber:   formData.get("whatsappNumber")?.toString() || null,
      packageAmount:    parseFloat(formData.get("packageAmount") || "0"),
      startDate:        new Date(formData.get("startDate") || new Date()),
    },
  });

  await db.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      role:         "CLIENT",
      clientId:     client.id,
    },
  });

  revalidatePath("/clients");

  // Return credentials so client can trigger CSV download
  return {
    success: true,
    clientId: client.id,
    clientName: name,
    email,
    password, // plain text — only used for CSV, never stored
    portalUrl: `${process.env.NEXTAUTH_URL}/portal/${client.id}`,
  };
}