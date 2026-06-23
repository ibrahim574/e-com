"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow, getSuperActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Count how many SUPER_ADMINs currently exist. */
async function superAdminCount() {
  return prisma.user.count({ where: { role: "SUPER_ADMIN" } });
}

/** Any admin can add a new admin (role=ADMIN). */
export async function createAdminAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const name = String(formData.get("name") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    summary: `Created admin ${email}`,
    metadata: { role: "ADMIN" },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Super admin only: promote an ADMIN to SUPER_ADMIN. */
export async function promoteAdminAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (target.role !== "ADMIN") {
    return { error: "Only admins can be promoted." };
  }

  await prisma.user.update({
    where: { id },
    data: { role: "SUPER_ADMIN" },
  });

  await recordAudit({
    actor,
    action: "PROMOTE",
    entityType: "User",
    entityId: id,
    summary: `Promoted ${target.email} to SUPER_ADMIN`,
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Super admin only: demote a SUPER_ADMIN to ADMIN. Guards against demoting the
 * last super admin. Demoting yourself is allowed only if another super admin exists. */
export async function demoteAdminAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (target.role !== "SUPER_ADMIN") {
    return { error: "User is not a super admin." };
  }

  const count = await superAdminCount();
  if (count <= 1) {
    return {
      error: "Cannot demote the last super admin. Promote another admin first.",
    };
  }

  await prisma.user.update({
    where: { id },
    data: { role: "ADMIN" },
  });

  await recordAudit({
    actor,
    action: "DEMOTE",
    entityType: "User",
    entityId: id,
    summary: `Demoted ${target.email} to ADMIN`,
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Super admin only: delete an admin (or super admin). Guards against deleting
 * the last super admin or self when it would leave zero super admins. */
export async function deleteAdminAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  if (target.role === "SUPER_ADMIN") {
    const count = await superAdminCount();
    if (count <= 1) {
      return { error: "Cannot delete the last super admin." };
    }
  }

  if (target.role === "CUSTOMER") {
    return { error: "Use the customers page to manage customers." };
  }

  await prisma.user.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "User",
    entityId: id,
    summary: `Deleted ${target.role.toLowerCase()} ${target.email}`,
    metadata: { role: target.role },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Self-service: any admin can change their own password. */
export async function changeAdminPasswordAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "Passwords do not match." };
  }
  if (next === current) {
    return { error: "New password must be different from the current one." };
  }

  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user) {
    return { error: "Account not found." };
  }

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: actor.id },
    data: { passwordHash },
  });

  await recordAudit({
    actor,
    action: "PASSWORD",
    entityType: "User",
    entityId: actor.id,
    summary: `Changed own password`,
  });

  return { success: true };
}

