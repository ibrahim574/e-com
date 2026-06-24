import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logInventoryMovement } from "@/lib/inventory-movement";
import { createOrRegenerateInvoice } from "@/lib/invoice/invoice-service";

type Tx = Prisma.TransactionClient;

export async function recordPaymentPending(
  tx: Tx,
  order: {
    id: string;
    shippingName: string;
    totalCents: number;
  },
) {
  const existing = await tx.paymentRecord.findFirst({
    where: { orderId: order.id, status: "PENDING" },
  });
  if (existing) return;

  await tx.paymentRecord.create({
    data: {
      orderId: order.id,
      customerName: order.shippingName,
      method: "PayPal",
      amountPaidCents: order.totalCents,
      status: "PENDING",
    },
  });
}

export async function onOrderPaidInTransaction(
  tx: Tx,
  orderId: string,
  captureId: string | null,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await tx.paymentRecord.updateMany({
    where: { orderId, status: "PENDING" },
    data: {
      status: "PAID",
      transactionReference: captureId,
      paymentDate: new Date(),
    },
  });

  const discountAmount = order.adjustmentCents < 0 ? Math.abs(order.adjustmentCents) : 0;
  const netRevenue =
    order.subtotalCents + order.shippingCents - discountAmount;

  await tx.incomeLedgerEntry.upsert({
    where: { orderId },
    create: {
      orderId,
      orderDate: order.createdAt,
      customerName: order.shippingName,
      revenueAmount: order.subtotalCents,
      shippingIncome: order.shippingCents,
      taxCollected: order.taxCents,
      discountAmount,
      netRevenue,
      paymentMethod: "PayPal",
      transactionId: captureId,
    },
    update: {
      revenueAmount: order.subtotalCents,
      shippingIncome: order.shippingCents,
      taxCollected: order.taxCents,
      discountAmount,
      netRevenue,
      transactionId: captureId,
    },
  });

  for (const item of order.items) {
    if (item.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) continue;
      const qtyBefore = variant.stock + item.quantity;
      await logInventoryMovement(tx, {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        changeType: "SALE",
        qtyBefore,
        qtyAfter: variant.stock,
      });
    } else {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;
      const qtyBefore = product.stock + item.quantity;
      await logInventoryMovement(tx, {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        changeType: "SALE",
        qtyBefore,
        qtyAfter: product.stock,
      });
    }
  }
}

export async function onOrderPaid(orderId: string) {
  await createOrRegenerateInvoice(orderId, false);
}

export async function markPaymentFailed(orderId: string) {
  await prisma.paymentRecord.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
