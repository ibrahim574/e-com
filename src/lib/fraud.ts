import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSiteSettings } from "@/lib/site-settings";
import { writeSystemLog } from "@/lib/system-log";

export type FraudOrder = {
  id: string;
  orderNumber: string;
  totalCents: number;
  userId: string | null;
  guestEmail: string | null;
  shippingPostal: string;
  shippingCountry: string;
  shippingCity: string;
  billingPostal: string | null;
  billingCountry: string | null;
  billingCity: string | null;
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Evaluates an order against fraud heuristics and returns the matched reasons. */
export async function evaluateOrderFraud(
  order: FraudOrder,
  ip?: string | null,
): Promise<string[]> {
  const reasons: string[] = [];
  const settings = await getSiteSettings();

  // 1. High-value order.
  if (order.totalCents >= settings.fraudHighValueCents) {
    reasons.push(
      `High-value order ($${(order.totalCents / 100).toFixed(2)})`,
    );
  }

  // 2. Multiple recent failed/cancelled orders for the same customer.
  const customerFilter: Prisma.OrderWhereInput | null = order.userId
    ? { userId: order.userId }
    : order.guestEmail
      ? { guestEmail: norm(order.guestEmail) }
      : null;

  if (customerFilter) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failed = await prisma.order.count({
      where: {
        ...customerFilter,
        status: "CANCELLED",
        createdAt: { gte: since },
        id: { not: order.id },
      },
    });
    if (failed >= 2) {
      reasons.push(`${failed} failed/cancelled orders in the last 24h`);
    }
  }

  // 3. Billing / shipping mismatch (only when billing is provided).
  const hasBilling = Boolean(order.billingPostal || order.billingCountry);
  if (hasBilling) {
    const countryMismatch =
      norm(order.billingCountry) !== norm(order.shippingCountry);
    const postalMismatch = norm(order.billingPostal) !== norm(order.shippingPostal);
    if (countryMismatch) {
      reasons.push("Billing country differs from shipping country");
    } else if (postalMismatch) {
      reasons.push("Billing postal code differs from shipping");
    }
  }

  // 4. Suspicious IP — repeated payment/login failures from the same address.
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const ipFailures = await prisma.systemLog.count({
      where: {
        ip,
        level: { in: ["warn", "error"] },
        category: { in: ["PAYMENT", "LOGIN", "SECURITY"] },
        createdAt: { gte: since },
      },
    });
    if (ipFailures >= 3) {
      reasons.push(`Suspicious IP — ${ipFailures} recent failures from ${ip}`);
    }
  }

  return reasons;
}

/**
 * Evaluates and persists fraud flags on an order. When flagged, also writes a
 * SECURITY system log. Safe to call from within payment flows (never throws).
 */
export async function flagOrderIfSuspicious(
  order: FraudOrder,
  ip?: string | null,
): Promise<string[]> {
  try {
    const reasons = await evaluateOrderFraud(order, ip);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        flagged: reasons.length > 0,
        fraudReasons: reasons.length
          ? (reasons as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
    if (reasons.length) {
      await writeSystemLog({
        category: "SECURITY",
        level: "warn",
        message: `Order ${order.orderNumber} flagged for review`,
        metadata: { orderId: order.id, reasons },
        ip: ip ?? null,
        userId: order.userId,
      });
    }
    return reasons;
  } catch (err) {
    console.error("Fraud evaluation failed:", err);
    return [];
  }
}
