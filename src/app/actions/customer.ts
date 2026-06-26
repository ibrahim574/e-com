"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password-policy";
import { saveAvatarFile, deleteAvatarFile } from "@/lib/avatar-server";

const COUNTRY_DEFAULT = "CA";

export async function updateCustomerAvatarAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose an image to upload." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  let avatarUrl: string;
  try {
    avatarUrl = await saveAvatarFile(file);
  } catch (err) {
    return { error: (err as Error).message };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  if (existing?.avatarUrl && existing.avatarUrl !== avatarUrl) {
    try {
      await deleteAvatarFile(existing.avatarUrl);
    } catch {
      // best-effort cleanup
    }
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true, avatarUrl };
}

export async function changeCustomerPasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const pwCheck = validatePassword(next);
  if (!pwCheck.valid) {
    return { error: pwCheck.errors.join(" ") };
  }

  if (next !== confirm) {
    return { error: "Passwords do not match." };
  }

  if (next === current) {
    return { error: "New password must be different from the current one." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Account not found." };
  }

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath("/account/profile");
  return { success: true };
}

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to update your profile." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim() || null;
  const addressCity = String(formData.get("addressCity") ?? "").trim() || null;
  const addressState = String(formData.get("addressState") ?? "").trim() || null;
  const addressPostal = String(formData.get("addressPostal") ?? "").trim() || null;
  const addressCountry =
    String(formData.get("addressCountry") ?? "").trim().toUpperCase() ||
    COUNTRY_DEFAULT;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      addressLine1,
      addressLine2,
      addressCity,
      addressState,
      addressPostal,
      addressCountry,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}
