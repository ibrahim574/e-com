"use server";

import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimitAction } from "@/lib/action-rate-limit";
import { revalidatePath } from "next/cache";

type ActionResult = { success?: boolean; message?: string; error?: string };

const STATUSES = ["OPEN", "CONTACTED", "CLOSED"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createPurchaseRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  const limited = await rateLimitAction("purchase-request", 5, 60_000);
  if (limited) return { error: limited };

  const productId = String(formData.get("productId") ?? "").trim() || null;
  const productName = String(formData.get("productName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const quantity = Math.max(1, Math.round(Number(formData.get("quantity") ?? 1)));
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!productName) return { error: "Product is required." };
  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email." };

  // Confirm the product exists if an id was supplied (avoid bogus FK).
  let resolvedProductId = productId;
  if (productId) {
    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) resolvedProductId = null;
  }

  await prisma.purchaseRequest.create({
    data: {
      productId: resolvedProductId,
      productName,
      name,
      email,
      phone,
      quantity,
      message,
    },
  });

  revalidatePath("/admin/purchase-requests");
  return {
    success: true,
    message: "Thanks! We'll contact you when this product is available.",
  };
}

export async function updatePurchaseRequestStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  if (!STATUSES.includes(status)) return { error: "Invalid status." };
  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "PurchaseRequest",
    entityId: id,
    summary: `Set purchase request for ${updated.productName} to ${status}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/purchase-requests");
  return { success: true, message: "Updated." };
}

export async function deletePurchaseRequestAction(
  id: string,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const existing = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!existing) return { error: "Request not found." };
  await prisma.purchaseRequest.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "PurchaseRequest",
    entityId: id,
    summary: `Deleted purchase request for ${existing.productName}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/purchase-requests");
  return { success: true, message: "Deleted." };
}
