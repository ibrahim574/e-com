"use server";

import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { normalizeCouponCode } from "@/lib/coupons";
import { revalidatePath } from "next/cache";
import type { CouponType, Prisma } from "@prisma/client";

type ActionResult = { message?: string; error?: string };

const TYPES: CouponType[] = [
  "PERCENTAGE",
  "FIXED",
  "FREE_SHIPPING",
  "BUY_X_GET_Y",
];

function parseList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildCouponData(
  formData: FormData,
): { error: string } | { data: Prisma.CouponCreateInput } {
  const code = normalizeCouponCode(String(formData.get("code") ?? ""));
  const type = String(formData.get("type") ?? "") as CouponType;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!code) return { error: "Coupon code is required." };
  if (!TYPES.includes(type)) return { error: "Choose a valid coupon type." };

  const rawValue = Number(formData.get("value") ?? 0);
  let value = 0;
  if (type === "PERCENTAGE") {
    value = Math.round(rawValue);
    if (value <= 0 || value > 100) {
      return { error: "Percentage must be between 1 and 100." };
    }
  } else if (type === "FIXED") {
    value = Math.round(rawValue * 100);
    if (value <= 0) return { error: "Fixed amount must be greater than 0." };
  }

  const minSubtotalCents = Math.max(
    0,
    Math.round(Number(formData.get("minSubtotal") ?? 0) * 100),
  );
  const maxRedemptionsRaw = Number(formData.get("maxRedemptions") ?? 0);
  const maxRedemptions = maxRedemptionsRaw > 0 ? Math.round(maxRedemptionsRaw) : null;
  const perCustomerLimitRaw = Number(formData.get("perCustomerLimit") ?? 0);
  const perCustomerLimit =
    perCustomerLimitRaw > 0 ? Math.round(perCustomerLimitRaw) : null;
  const firstOrderOnly = formData.get("firstOrderOnly") === "on";
  const enabled = formData.get("enabled") !== "off";
  const allowedEmails = parseList(String(formData.get("allowedEmails") ?? "")).map(
    (e) => e.toLowerCase(),
  );

  let buyQty: number | null = null;
  let getQty: number | null = null;
  let productIds: string[] = [];
  if (type === "BUY_X_GET_Y") {
    buyQty = Math.max(1, Math.round(Number(formData.get("buyQty") ?? 1)));
    getQty = Math.max(1, Math.round(Number(formData.get("getQty") ?? 1)));
    productIds = parseList(String(formData.get("productIds") ?? ""));
  }

  const startsAt = parseDate(String(formData.get("startsAt") ?? ""));
  const expiresAt = parseDate(String(formData.get("expiresAt") ?? ""));
  if (startsAt && expiresAt && expiresAt < startsAt) {
    return { error: "Expiry date must be after the start date." };
  }

  return {
    data: {
      code,
      description,
      type,
      value,
      minSubtotalCents,
      maxRedemptions,
      perCustomerLimit,
      firstOrderOnly,
      enabled,
      allowedEmails,
      buyQty,
      getQty,
      productIds,
      startsAt,
      expiresAt,
    },
  };
}

export async function createCouponAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const built = buildCouponData(formData);
  if ("error" in built) return { error: built.error };

  const existing = await prisma.coupon.findUnique({
    where: { code: built.data.code },
  });
  if (existing) return { error: "A coupon with that code already exists." };

  const created = await prisma.coupon.create({ data: built.data });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "Coupon",
    entityId: created.id,
    summary: `Created coupon ${created.code}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/coupons");
  return { message: "Coupon created." };
}

export async function updateCouponAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return { error: "Coupon not found." };

  const built = buildCouponData(formData);
  if ("error" in built) return { error: built.error };

  if (built.data.code !== existing.code) {
    const dup = await prisma.coupon.findUnique({
      where: { code: built.data.code },
    });
    if (dup) return { error: "A coupon with that code already exists." };
  }

  await prisma.coupon.update({ where: { id }, data: built.data });

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Coupon",
    entityId: id,
    summary: `Updated coupon ${built.data.code}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/coupons");
  return { message: "Coupon updated." };
}

export async function toggleCouponAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const updated = await prisma.coupon.update({
    where: { id },
    data: { enabled },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Coupon",
    entityId: id,
    summary: `${enabled ? "Enabled" : "Disabled"} coupon ${updated.code}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/coupons");
  return { message: enabled ? "Coupon enabled." : "Coupon disabled." };
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return { error: "Coupon not found." };
  await prisma.coupon.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Coupon",
    entityId: id,
    summary: `Deleted coupon ${existing.code}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/coupons");
  return { message: "Coupon deleted." };
}
