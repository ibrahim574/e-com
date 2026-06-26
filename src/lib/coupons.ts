import { prisma } from "@/lib/prisma";
import type { Coupon, Prisma } from "@prisma/client";

export type CouponLineItem = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

export type CouponContext = {
  subtotalCents: number;
  shippingCents: number;
  userId: string | null;
  email: string | null;
  items: CouponLineItem[];
};

export type CouponDiscount = {
  coupon: Coupon;
  discountCents: number;
  freeShipping: boolean;
  label: string;
};

export type CouponEvaluation =
  | { error: string }
  | { discount: CouponDiscount };

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

function computeDiscount(
  coupon: Coupon,
  ctx: CouponContext,
): { discountCents: number; freeShipping: boolean } {
  switch (coupon.type) {
    case "PERCENTAGE": {
      const pct = Math.min(100, Math.max(0, coupon.value));
      return {
        discountCents: Math.round((ctx.subtotalCents * pct) / 100),
        freeShipping: false,
      };
    }
    case "FIXED":
      return {
        discountCents: Math.min(coupon.value, ctx.subtotalCents),
        freeShipping: false,
      };
    case "FREE_SHIPPING":
      return { discountCents: 0, freeShipping: true };
    case "BUY_X_GET_Y": {
      const buyQty = coupon.buyQty ?? 1;
      const getQty = coupon.getQty ?? 1;
      const setSize = buyQty + getQty;
      if (setSize <= 0) return { discountCents: 0, freeShipping: false };

      const eligible =
        coupon.productIds.length > 0
          ? ctx.items.filter((i) => coupon.productIds.includes(i.productId))
          : ctx.items;

      const totalQty = eligible.reduce((sum, i) => sum + i.quantity, 0);
      if (totalQty < setSize) return { discountCents: 0, freeShipping: false };

      const cheapestUnit = eligible.reduce(
        (min, i) => Math.min(min, i.unitPriceCents),
        Number.POSITIVE_INFINITY,
      );
      const freeUnits = Math.floor(totalQty / setSize) * getQty;
      const discountCents = Number.isFinite(cheapestUnit)
        ? freeUnits * cheapestUnit
        : 0;
      return {
        discountCents: Math.min(discountCents, ctx.subtotalCents),
        freeShipping: false,
      };
    }
    default:
      return { discountCents: 0, freeShipping: false };
  }
}

function describe(coupon: Coupon): string {
  switch (coupon.type) {
    case "PERCENTAGE":
      return `${coupon.value}% off`;
    case "FIXED":
      return `$${(coupon.value / 100).toFixed(2)} off`;
    case "FREE_SHIPPING":
      return "Free shipping";
    case "BUY_X_GET_Y":
      return `Buy ${coupon.buyQty ?? 1}, get ${coupon.getQty ?? 1} free`;
    default:
      return "Discount";
  }
}

/**
 * Validates a coupon against the cart/customer context and computes the
 * discount. Returns `{ error }` for any failed rule, otherwise `{ discount }`.
 */
export async function evaluateCoupon(
  rawCode: string,
  ctx: CouponContext,
): Promise<CouponEvaluation> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { error: "Enter a coupon code." };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.enabled) {
    return { error: "That coupon code is not valid." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { error: "This coupon is not active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { error: "This coupon has expired." };
  }
  if (ctx.subtotalCents < coupon.minSubtotalCents) {
    return {
      error: `Add at least $${(coupon.minSubtotalCents / 100).toFixed(
        2,
      )} to use this coupon.`,
    };
  }
  if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
    return { error: "This coupon has reached its usage limit." };
  }

  const email = ctx.email?.toLowerCase() ?? null;
  if (coupon.allowedEmails.length > 0) {
    if (!email || !coupon.allowedEmails.map((e) => e.toLowerCase()).includes(email)) {
      return { error: "This coupon is not available for your account." };
    }
  }

  if (coupon.firstOrderOnly) {
    const priorWhere: Prisma.OrderWhereInput = {
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      ...(ctx.userId ? { userId: ctx.userId } : email ? { guestEmail: email } : {}),
    };
    if (ctx.userId || email) {
      const prior = await prisma.order.count({ where: priorWhere });
      if (prior > 0) {
        return { error: "This coupon is only valid on your first order." };
      }
    }
  }

  if (coupon.perCustomerLimit != null && (ctx.userId || email)) {
    const used = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        ...(ctx.userId ? { userId: ctx.userId } : { email }),
      },
    });
    if (used >= coupon.perCustomerLimit) {
      return { error: "You have already used this coupon." };
    }
  }

  const { discountCents, freeShipping } = computeDiscount(coupon, ctx);
  if (discountCents <= 0 && !freeShipping) {
    return { error: "This coupon does not apply to your cart." };
  }

  return {
    discount: {
      coupon,
      discountCents,
      freeShipping,
      label: describe(coupon),
    },
  };
}

/** Convenience for pages: returns the applied discount or null (no errors). */
export async function resolveCartDiscount(
  couponCode: string | null,
  ctx: CouponContext,
): Promise<CouponDiscount | null> {
  if (!couponCode) return null;
  const res = await evaluateCoupon(couponCode, ctx);
  return "discount" in res ? res.discount : null;
}

/**
 * Increments usage + records a redemption for a paid order. Idempotent via the
 * unique orderId on CouponRedemption. Call inside the PAID transaction.
 */
export async function redeemCouponForOrder(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    couponCode: string | null;
    adjustmentCents: number;
    userId: string | null;
    guestEmail: string | null;
  },
): Promise<void> {
  if (!order.couponCode) return;

  const existing = await tx.couponRedemption.findUnique({
    where: { orderId: order.id },
  });
  if (existing) return;

  const coupon = await tx.coupon.findUnique({
    where: { code: normalizeCouponCode(order.couponCode) },
  });
  if (!coupon) return;

  await tx.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });
  await tx.couponRedemption.create({
    data: {
      couponId: coupon.id,
      orderId: order.id,
      userId: order.userId,
      email: order.guestEmail?.toLowerCase() ?? null,
      amountCents: Math.abs(order.adjustmentCents),
    },
  });
}
