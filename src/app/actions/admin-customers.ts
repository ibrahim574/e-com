"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow, getSuperActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { sanitizeText } from "@/lib/sanitize";
import { validatePassword } from "@/lib/password-policy";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadCustomer(id: string) {
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "CUSTOMER") return null;
  return user;
}

export async function updateCustomerDetailsAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const customer = await loadCustomer(id);
  if (!customer) return { error: "Customer not found." };

  const data = {
    name: sanitizeText(String(formData.get("name") ?? ""), 200) || null,
    phone: sanitizeText(String(formData.get("phone") ?? ""), 50) || null,
    addressLine1: sanitizeText(String(formData.get("addressLine1") ?? ""), 200) || null,
    addressLine2: sanitizeText(String(formData.get("addressLine2") ?? ""), 200) || null,
    addressCity: sanitizeText(String(formData.get("addressCity") ?? ""), 120) || null,
    addressState: sanitizeText(String(formData.get("addressState") ?? ""), 120) || null,
    addressPostal: sanitizeText(String(formData.get("addressPostal") ?? ""), 20) || null,
    addressCountry:
      sanitizeText(String(formData.get("addressCountry") ?? ""), 2).toUpperCase() || null,
  };

  await prisma.user.update({ where: { id }, data });

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    summary: `Updated customer details for ${customer.email}`,
    ipAddress: await getRequestIp(),
    previousValue: {
      name: customer.name,
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressCity: customer.addressCity,
    },
    newValue: data,
  });

  revalidatePath(`/admin/customers/${id}`);
  return { success: true };
}

export async function updateCustomerEmailAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const customer = await loadCustomer(id);
  if (!customer) return { error: "Customer not found." };

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (email !== customer.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Another account already uses that email." };
    }
  }

  await prisma.user.update({ where: { id }, data: { email } });

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    summary: `Changed customer email from ${customer.email} to ${email}`,
    ipAddress: await getRequestIp(),
    previousValue: { email: customer.email },
    newValue: { email },
  });

  revalidatePath(`/admin/customers/${id}`);
  return { success: true };
}

export async function deleteCustomerAction(id: string) {
  const actor = await getSuperActorOrThrow();
  const customer = await loadCustomer(id);
  if (!customer) return { error: "Customer not found." };

  // Orders are preserved (Order.userId ON DELETE SET NULL); the cart and
  // password-reset tokens cascade away with the user.
  await prisma.user.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Customer",
    entityId: id,
    summary: `Deleted customer ${customer.email}`,
    ipAddress: await getRequestIp(),
    previousValue: { email: customer.email, name: customer.name },
  });

  revalidatePath("/admin/customers");
  return { success: true };
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const customer = await loadCustomer(id);
  if (!customer) return { error: "Customer not found." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const check = validatePassword(password);
  if (!check.valid) {
    return { error: check.errors.join(" ") };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await recordAudit({
    actor,
    action: "PASSWORD",
    entityType: "User",
    entityId: id,
    summary: `Reset password for customer ${customer.email}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath(`/admin/customers/${id}`);
  return { success: true };
}
