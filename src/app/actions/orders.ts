"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getSiteSettings } from "@/lib/site-settings";
import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";
import { sendEmail } from "@/lib/email";
import {
  buildOrderSummaryTable,
  orderUpdateEmail,
} from "@/lib/email-templates";
import { formatPrice } from "@/lib/utils";
import { getRequestIp } from "@/lib/request-ip";
import { onOrderPaid, onOrderPaidInTransaction } from "@/lib/accounting/on-order-paid";
import type { OrderStatus, Prisma } from "@prisma/client";

async function orderEmail(
  order: {
    orderNumber: string;
    currency: "CAD" | "USD";
    totalCents: number;
    shippingName: string;
    guestEmail: string | null;
    user: { email: string } | null;
    items: Array<{
      productName: string;
      variantLabel: string | null;
      quantity: number;
      unitPriceCents: number;
    }>;
  },
  changeDescription: string,
) {
  const customerEmail = order.user?.email ?? order.guestEmail;
  if (!customerEmail) return null;

  const settings = await getSiteSettings();

  const summary = buildOrderSummaryTable(
    order.items.map((item) => ({
      name: item.variantLabel
        ? `${item.productName} (${item.variantLabel})`
        : item.productName,
      qty: item.quantity,
      price: formatPrice(item.unitPriceCents * item.quantity, order.currency),
    })),
  );

  return {
    to: customerEmail,
    ...orderUpdateEmail({
      customerName: order.shippingName,
      orderNumber: order.orderNumber,
      orderTotal: formatPrice(order.totalCents, order.currency),
      orderSummary: summary,
      changeDescription,
      companyName: settings.companyName,
    }),
  };
}

async function recalcOrderTotals(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const taxRules = await resolveTaxRules(order.shippingCountry, order.shippingState);
  const tax = calcOrderTax(subtotalCents, order.shippingCents, taxRules);
  const totalCents =
    subtotalCents + order.shippingCents + tax.taxCents + order.adjustmentCents;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotalCents,
      taxCents: tax.taxCents,
      taxLabel: tax.taxLabel || null,
      taxRatePercent: tax.taxRatePercent || null,
      totalCents,
    },
  });
}

export async function updateOrderAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const orderId = String(formData.get("orderId"));
  const before = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!before || before.deletedAt) return { error: "Order not found." };

  const status = String(formData.get("status")) as OrderStatus;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  const adjustmentCents = Math.round(Number(formData.get("adjustmentCents") ?? 0) * 100);
  const shippingName = String(formData.get("shippingName") ?? "").trim();
  const shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  const shippingLine2 = String(formData.get("shippingLine2") ?? "").trim() || null;
  const shippingCity = String(formData.get("shippingCity") ?? "").trim();
  const shippingState = String(formData.get("shippingState") ?? "").trim();
  const shippingPostal = String(formData.get("shippingPostal") ?? "").trim();
  const shippingCountry = String(formData.get("shippingCountry") ?? "").trim();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      trackingNumber,
      adjustmentCents,
      shippingName,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostal,
      shippingCountry,
    },
  });

  await recalcOrderTotals(orderId);

  const after = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!after) return { error: "Order not found." };

  const changes: string[] = [];
  if (before.status !== status) {
    changes.push(`Status updated to ${status}.`);
  }
  if (before.trackingNumber !== trackingNumber && trackingNumber) {
    changes.push(`Tracking number set to ${trackingNumber}.`);
  }
  if (before.adjustmentCents !== adjustmentCents) {
    changes.push("A price adjustment was applied.");
  }
  const addressChanged =
    before.shippingLine1 !== shippingLine1 ||
    before.shippingCity !== shippingCity ||
    before.shippingPostal !== shippingPostal;
  if (addressChanged) {
    changes.push(
      `Delivery address updated to ${shippingLine1}, ${shippingCity}, ${shippingState} ${shippingPostal}.`,
    );
  }

  if (changes.length) {
    const mail = await orderEmail(after, changes.join(" "));
    if (mail) {
      await sendEmail({
        to: mail.to,
        subject: `Your order #${after.orderNumber} has been updated`,
        html: mail.html,
        text: mail.text,
      });
    }
  }

  if (before.status !== "PAID" && status === "PAID") {
    await prisma.$transaction(async (tx) => {
      await onOrderPaidInTransaction(tx, orderId, after.paypalCaptureId);
    });
    await onOrderPaid(orderId);
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: orderId,
    summary: `Updated order ${after.orderNumber}`,
    ipAddress: await getRequestIp(),
    previousValue: {
      status: before.status,
      trackingNumber: before.trackingNumber,
      adjustmentCents: before.adjustmentCents,
    },
    newValue: {
      status,
      trackingNumber,
      adjustmentCents,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function softDeleteOrderAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const orderId = String(formData.get("orderId"));
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date(), status: "CANCELLED" },
    include: { items: true, user: true },
  });

  const mail = await orderEmail(order, `Your order #${order.orderNumber} has been cancelled.`);
  if (mail) {
    await sendEmail({
      to: mail.to,
      subject: `Your order #${order.orderNumber} has been cancelled`,
      html: mail.html,
      text: mail.text,
    });
  }

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Order",
    entityId: orderId,
    summary: `Soft-deleted order ${order.orderNumber}`,
  });

  revalidatePath("/admin/orders");
}

export async function updateOrderItemQuantityAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const itemId = String(formData.get("itemId"));
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  const item = await prisma.orderItem.update({
    where: { id: itemId },
    data: { quantity },
  });
  await recalcOrderTotals(item.orderId);

  const order = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: { items: true, user: true },
  });
  if (order) {
    const mail = await orderEmail(order, "Your order items were updated.");
    if (mail) {
      await sendEmail({
        to: mail.to,
        subject: `Your order #${order.orderNumber} has been modified`,
        html: mail.html,
        text: mail.text,
      });
    }
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: item.orderId,
    summary: "Updated order line item quantity",
  });

  revalidatePath(`/admin/orders/${item.orderId}`);
}

export async function removeOrderItemAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const itemId = String(formData.get("itemId"));
  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  await prisma.orderItem.delete({ where: { id: itemId } });
  await recalcOrderTotals(item.orderId);

  const order = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: { items: true, user: true },
  });
  if (order) {
    const mail = await orderEmail(order, "An item was removed from your order.");
    if (mail) {
      await sendEmail({
        to: mail.to,
        subject: `Your order #${order.orderNumber} has been modified`,
        html: mail.html,
        text: mail.text,
      });
    }
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: item.orderId,
    summary: "Removed order line item",
  });

  revalidatePath(`/admin/orders/${item.orderId}`);
}
