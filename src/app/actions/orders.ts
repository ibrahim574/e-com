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
import { createOrRegenerateInvoice } from "@/lib/invoice/invoice-service";
import { getVariantLabel } from "@/lib/cart";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { formatItemDisplayName } from "@/lib/order-item-frequency";
import type { OrderStatus } from "@prisma/client";

function orderSnapshot(order: {
  status: OrderStatus;
  trackingNumber: string | null;
  adjustmentCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  taxLabel: string | null;
  totalCents: number;
  shippingOverride: boolean;
  taxOverride: boolean;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingState: string;
  shippingPostal: string;
  shippingCountry: string;
  billingName: string | null;
  billingLine1: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostal: string | null;
  billingCountry: string | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}) {
  return {
    status: order.status,
    trackingNumber: order.trackingNumber,
    adjustmentCents: order.adjustmentCents,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    taxLabel: order.taxLabel,
    totalCents: order.totalCents,
    shippingOverride: order.shippingOverride,
    taxOverride: order.taxOverride,
    shipping: {
      name: order.shippingName,
      line1: order.shippingLine1,
      city: order.shippingCity,
      state: order.shippingState,
      postal: order.shippingPostal,
      country: order.shippingCountry,
    },
    billing: {
      name: order.billingName,
      line1: order.billingLine1,
      city: order.billingCity,
      state: order.billingState,
      postal: order.billingPostal,
      country: order.billingCountry,
    },
    items: order.items.map((i) => ({
      id: i.id,
      name: i.productName,
      qty: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
  };
}

async function syncPaidOrderAccounting(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PAID") return;

  await prisma.$transaction(async (tx) => {
    await onOrderPaidInTransaction(tx, orderId, order.paypalCaptureId);
  });
  await createOrRegenerateInvoice(orderId, true);
}

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
      selectedFrequency: string | null;
      txFrequency: string | null;
      rxFrequency: string | null;
    }>;
  },
  changeDescription: string,
) {
  const customerEmail = order.user?.email ?? order.guestEmail;
  if (!customerEmail) return null;

  const settings = await getSiteSettings();

  const summary = buildOrderSummaryTable(
    order.items.map((item) => ({
      name: formatItemDisplayName(item),
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

  let taxCents = order.taxCents;
  let taxLabel = order.taxLabel;
  let taxRatePercent = order.taxRatePercent;

  if (!order.taxOverride) {
    const taxRules = await resolveTaxRules(order.shippingCountry, order.shippingState);
    const tax = calcOrderTax(subtotalCents, order.shippingCents, taxRules);
    taxCents = tax.taxCents;
    taxLabel = tax.taxLabel || null;
    taxRatePercent = tax.taxRatePercent || null;
  }

  const totalCents =
    subtotalCents + order.shippingCents + taxCents + order.adjustmentCents;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotalCents,
      taxCents,
      taxLabel,
      taxRatePercent,
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
  const shippingOverride = formData.get("shippingOverride") === "on";
  const taxOverride = formData.get("taxOverride") === "on";
  const shippingCents = Math.round(Number(formData.get("shippingCents") ?? before.shippingCents / 100) * 100);
  const taxCents = Math.round(Number(formData.get("taxCents") ?? before.taxCents / 100) * 100);
  const taxLabel = String(formData.get("taxLabel") ?? before.taxLabel ?? "").trim() || null;

  const shippingName = String(formData.get("shippingName") ?? "").trim();
  const shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  const shippingLine2 = String(formData.get("shippingLine2") ?? "").trim() || null;
  const shippingCity = String(formData.get("shippingCity") ?? "").trim();
  const shippingState = String(formData.get("shippingState") ?? "").trim();
  const shippingPostal = String(formData.get("shippingPostal") ?? "").trim();
  const shippingCountry = String(formData.get("shippingCountry") ?? "").trim();

  const billingName = String(formData.get("billingName") ?? "").trim() || null;
  const billingLine1 = String(formData.get("billingLine1") ?? "").trim() || null;
  const billingLine2 = String(formData.get("billingLine2") ?? "").trim() || null;
  const billingCity = String(formData.get("billingCity") ?? "").trim() || null;
  const billingState = String(formData.get("billingState") ?? "").trim() || null;
  const billingPostal = String(formData.get("billingPostal") ?? "").trim() || null;
  const billingCountry = String(formData.get("billingCountry") ?? "").trim() || null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      trackingNumber,
      adjustmentCents,
      shippingOverride,
      taxOverride,
      shippingCents: shippingOverride ? shippingCents : before.shippingCents,
      taxCents: taxOverride ? taxCents : before.taxCents,
      taxLabel: taxOverride ? taxLabel : before.taxLabel,
      shippingName,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostal,
      shippingCountry,
      billingName,
      billingLine1,
      billingLine2,
      billingCity,
      billingState,
      billingPostal,
      billingCountry,
    },
  });

  await recalcOrderTotals(orderId);

  const after = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!after) return { error: "Order not found." };

  const changes: string[] = [];
  if (before.status !== status) changes.push(`Status updated to ${status}.`);
  if (before.trackingNumber !== trackingNumber && trackingNumber) {
    changes.push(`Tracking number set to ${trackingNumber}.`);
  }
  if (before.adjustmentCents !== adjustmentCents) changes.push("A price adjustment was applied.");
  if (
    before.shippingLine1 !== shippingLine1 ||
    before.shippingCity !== shippingCity ||
    before.shippingPostal !== shippingPostal
  ) {
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
  } else if (before.status === "PAID") {
    const financialsChanged =
      before.subtotalCents !== after.subtotalCents ||
      before.shippingCents !== after.shippingCents ||
      before.taxCents !== after.taxCents ||
      before.adjustmentCents !== after.adjustmentCents ||
      before.totalCents !== after.totalCents;
    if (financialsChanged) {
      await syncPaidOrderAccounting(orderId);
    }
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: orderId,
    summary: `Updated order ${after.orderNumber}`,
    ipAddress: await getRequestIp(),
    previousValue: orderSnapshot(before),
    newValue: orderSnapshot(after),
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
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/orders");
}

export async function updateOrderItemQuantityAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const itemId = String(formData.get("itemId"));
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));

  const beforeItem = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!beforeItem) return;

  const beforeOrder = await prisma.order.findUnique({
    where: { id: beforeItem.orderId },
    include: { items: true, user: true },
  });

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
    if (order.status === "PAID") await syncPaidOrderAccounting(order.id);
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: item.orderId,
    summary: "Updated order line item quantity",
    ipAddress: await getRequestIp(),
    previousValue: beforeOrder ? orderSnapshot(beforeOrder) : { itemId, qty: beforeItem.quantity },
    newValue: order ? orderSnapshot(order) : { itemId, qty: quantity },
  });

  revalidatePath(`/admin/orders/${item.orderId}`);
}

export async function removeOrderItemAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const itemId = String(formData.get("itemId"));
  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  const beforeOrder = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: { items: true, user: true },
  });

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
    if (order.status === "PAID") await syncPaidOrderAccounting(order.id);
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: item.orderId,
    summary: "Removed order line item",
    ipAddress: await getRequestIp(),
    previousValue: beforeOrder ? orderSnapshot(beforeOrder) : undefined,
    newValue: order ? orderSnapshot(order) : undefined,
  });

  revalidatePath(`/admin/orders/${item.orderId}`);
}

export async function searchProductsForOrderAction(query: string) {
  await getActorOrThrow();
  const q = query.trim();
  if (q.length < 2) return [];

  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ name: { contains: q, mode: "insensitive" } }],
    },
    take: 12,
    select: {
      id: true,
      name: true,
      hasVariants: true,
      priceCadCents: true,
      priceUsdCents: true,
      variants: {
        select: {
          id: true,
          sku: true,
          stock: true,
          priceCadCents: true,
          priceUsdCents: true,
        },
      },
    },
  });
}

export async function addOrderItemAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const orderId = String(formData.get("orderId"));
  const productId = String(formData.get("productId"));
  const variantId = String(formData.get("variantId") ?? "").trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return { error: "Order not found." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };

  const variant = variantId
    ? await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          options: { include: { optionValue: { include: { option: true } } } },
        },
      })
    : null;

  if (product.hasVariants && !variant) {
    return { error: "Select a variant for this product." };
  }

  const pricing = variant
    ? getVariantPrice(variant, product, order.currency)
    : getProductPrice(product, order.currency);

  const beforeOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  await prisma.orderItem.create({
    data: {
      orderId,
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantLabel: variant ? getVariantLabel(variant) : null,
      sku: variant?.sku ?? null,
      quantity,
      unitPriceCents: pricing.currentCents,
    },
  });

  await recalcOrderTotals(orderId);

  const afterOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (afterOrder) {
    const mail = await orderEmail(afterOrder, "A new item was added to your order.");
    if (mail) {
      await sendEmail({
        to: mail.to,
        subject: `Your order #${afterOrder.orderNumber} has been modified`,
        html: mail.html,
        text: mail.text,
      });
    }
    if (afterOrder.status === "PAID") await syncPaidOrderAccounting(orderId);
  }

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Order",
    entityId: orderId,
    summary: `Added ${product.name} to order`,
    ipAddress: await getRequestIp(),
    previousValue: beforeOrder ? orderSnapshot(beforeOrder) : undefined,
    newValue: afterOrder ? orderSnapshot(afterOrder) : undefined,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
