"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, getVariantLabel } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { getShippingCentsForCountry } from "@/lib/shipping";
import { getSiteSettings } from "@/lib/site-settings";
import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";
import { generateOrderNumber } from "@/lib/utils";
import { createPayPalOrder, capturePayPalOrder } from "@/lib/paypal";
import { rateLimitAction } from "@/lib/action-rate-limit";
import { evaluateCoupon, redeemCouponForOrder } from "@/lib/coupons";
import { writeSystemLog } from "@/lib/system-log";
import { flagOrderIfSuspicious, type FraudOrder } from "@/lib/fraud";
import { getRequestIp } from "@/lib/request-ip";
import {
  onOrderPaid,
  onOrderPaidInTransaction,
  recordPaymentPending,
  markPaymentFailed,
} from "@/lib/accounting/on-order-paid";

type OrderDraft = {
  userId: string | null;
  guestEmail: string | null;
  currency: "CAD" | "USD";
  cartId: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  taxLabel: string | null;
  taxRatePercent: number | null;
  adjustmentCents: number;
  couponCode: string | null;
  totalCents: number;
  orderNumber: string;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostal: string;
  shippingCountry: string;
  orderItems: Array<{
    productId: string;
    variantId: string | null;
    productName: string;
    variantLabel: string | null;
    sku: string | null;
    quantity: number;
    unitPriceCents: number;
    txFrequency: string | null;
    rxFrequency: string | null;
    selectedFrequency: string | null;
  }>;
};

/** Validates the cart + shipping form and computes a fully-priced order draft. */
async function buildOrderDraft(
  formData: FormData,
): Promise<{ error: string } | { draft: OrderDraft }> {
  const session = await auth();
  const currency = await getCurrency();
  const cart = await getOrCreateCart();

  if (!cart.items.length) {
    return { error: "Your cart is empty." };
  }

  const shippingName = String(formData.get("shippingName") ?? "").trim();
  const shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  const shippingLine2 = String(formData.get("shippingLine2") ?? "").trim() || null;
  const shippingCity = String(formData.get("shippingCity") ?? "").trim();
  const shippingState = String(formData.get("shippingState") ?? "").trim();
  const shippingPostal = String(formData.get("shippingPostal") ?? "").trim();
  const shippingCountry = String(formData.get("shippingCountry") ?? "CA").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim() || null;

  if (!shippingName || !shippingLine1 || !shippingCity || !shippingState || !shippingPostal) {
    return { error: "Please complete all required shipping fields." };
  }

  if (!session?.user && !guestEmail) {
    return { error: "Email is required for guest checkout." };
  }

  let subtotalCents = 0;
  const orderItems: OrderDraft["orderItems"] = [];

  for (const item of cart.items) {
    const pricing = item.variant
      ? getVariantPrice(item.variant, item.product, currency)
      : getProductPrice(item.product, currency);

    const openOrder = item.product.allowPreorder || item.product.allowBackorder;

    if (!openOrder && item.variant && item.variant.stock < item.quantity) {
      return { error: `${item.product.name} is out of stock.` };
    }

    if (!item.variant && !item.product.hasVariants) {
      if (!openOrder && item.product.stock < item.quantity) {
        return { error: `${item.product.name} is out of stock.` };
      }
      if (item.quantity > 99) {
        return { error: "Invalid quantity." };
      }
    }

    subtotalCents += pricing.currentCents * item.quantity;
    const isCustomFreq = Boolean(
      item.txFrequency?.trim() && item.rxFrequency?.trim(),
    );
    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantLabel: getVariantLabel(item.variant),
      sku: item.variant?.sku ?? null,
      quantity: item.quantity,
      unitPriceCents: pricing.currentCents,
      txFrequency: isCustomFreq ? item.txFrequency || null : null,
      rxFrequency: isCustomFreq ? item.rxFrequency || null : null,
      selectedFrequency: !isCustomFreq && item.txFrequency ? item.txFrequency : null,
    });
  }

  const shippingLineItems = cart.items.map((item) => {
    const src = item.variant ?? item.product;
    return {
      quantity: item.quantity,
      weightGrams: src.weightGrams,
      shippingEnabled: src.shippingEnabled,
      shippingClassSurchargeCents: src.shippingClass?.surchargeCents ?? 0,
    };
  });

  let shippingCents = await getShippingCentsForCountry(
    subtotalCents,
    shippingCountry,
    currency,
    shippingState,
    shippingLineItems,
  );

  // Apply coupon (if any) authoritatively here so PayPal/offline totals match.
  let adjustmentCents = 0;
  let couponCode: string | null = null;
  if (cart.couponCode) {
    const couponResult = await evaluateCoupon(cart.couponCode, {
      subtotalCents,
      shippingCents,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? guestEmail,
      items: orderItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
    });
    if ("discount" in couponResult) {
      couponCode = couponResult.discount.coupon.code;
      adjustmentCents = -couponResult.discount.discountCents;
      if (couponResult.discount.freeShipping) {
        shippingCents = 0;
      }
    }
  }

  const taxRules = await resolveTaxRules(shippingCountry, shippingState);
  const taxableSubtotal = Math.max(0, subtotalCents + adjustmentCents);
  const tax = calcOrderTax(taxableSubtotal, shippingCents, taxRules);
  const totalCents = Math.max(
    0,
    subtotalCents + shippingCents + tax.taxCents + adjustmentCents,
  );

  return {
    draft: {
      userId: session?.user?.id ?? null,
      guestEmail,
      currency,
      cartId: cart.id,
      subtotalCents,
      shippingCents,
      taxCents: tax.taxCents,
      taxLabel: tax.taxLabel || null,
      taxRatePercent: tax.taxRatePercent || null,
      adjustmentCents,
      couponCode,
      totalCents,
      orderNumber: generateOrderNumber(),
      shippingName,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostal,
      shippingCountry,
      orderItems,
    },
  };
}

async function createOrderFromDraft(draft: OrderDraft) {
  return prisma.order.create({
    data: {
      orderNumber: draft.orderNumber,
      userId: draft.userId,
      guestEmail: draft.guestEmail,
      currency: draft.currency,
      subtotalCents: draft.subtotalCents,
      shippingCents: draft.shippingCents,
      taxCents: draft.taxCents,
      taxLabel: draft.taxLabel,
      taxRatePercent: draft.taxRatePercent,
      adjustmentCents: draft.adjustmentCents,
      couponCode: draft.couponCode,
      totalCents: draft.totalCents,
      shippingName: draft.shippingName,
      shippingLine1: draft.shippingLine1,
      shippingLine2: draft.shippingLine2,
      shippingCity: draft.shippingCity,
      shippingState: draft.shippingState,
      shippingPostal: draft.shippingPostal,
      shippingCountry: draft.shippingCountry,
      items: { create: draft.orderItems },
    },
  });
}

export async function createCheckoutOrderAction(formData: FormData) {
  const limited = await rateLimitAction("checkout-create", 30, 60_000);
  if (limited) {
    return { error: limited };
  }

  const built = await buildOrderDraft(formData);
  if ("error" in built) return { error: built.error };
  const { draft } = built;

  const order = await createOrderFromDraft(draft);

  await recordPaymentPending(prisma, {
    id: order.id,
    shippingName: draft.shippingName,
    totalCents: draft.totalCents,
  });

  try {
    const paypalOrderId = await createPayPalOrder({
      totalCents: draft.totalCents,
      currency: draft.currency,
      orderNumber: draft.orderNumber,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId },
    });

    return { orderId: order.id, paypalOrderId };
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    await markPaymentFailed(order.id);
    const detail = err instanceof Error ? err.message : "Unknown error";
    await writeSystemLog({
      category: "PAYMENT",
      level: "error",
      message: `PayPal order initialization failed for ${draft.orderNumber}`,
      metadata: { orderId: order.id, error: detail },
      ip: await getRequestIp(),
      userId: draft.userId,
    });
    if (detail.includes("credentials")) {
      return {
        error:
          "PayPal is not configured. Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and NEXT_PUBLIC_PAYPAL_CLIENT_ID (same app, sandbox or live).",
      };
    }
    return { error: `Unable to initialize PayPal checkout: ${detail}` };
  }
}

export async function captureCheckoutOrderAction(orderId: string, paypalOrderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.paypalOrderId !== paypalOrderId) {
    return { error: "Invalid order." };
  }

  if (order.status === "PAID") {
    return { success: true, orderNumber: order.orderNumber };
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status !== "COMPLETED") {
      return { error: "Payment was not completed." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paypalCaptureId: capture.captureId,
        },
      });

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await redeemCouponForOrder(tx, {
        id: order.id,
        couponCode: order.couponCode,
        adjustmentCents: order.adjustmentCents,
        userId: order.userId,
        guestEmail: order.guestEmail,
      });

      await onOrderPaidInTransaction(tx, order.id, capture.captureId);

      const cart = await tx.cart.findFirst({
        where: order.userId ? { userId: order.userId } : undefined,
      });

      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });
      }
    });

    await onOrderPaid(order.id);

    const ip = await getRequestIp();
    await writeSystemLog({
      category: "PAYMENT",
      level: "info",
      message: `PayPal payment captured for order ${order.orderNumber}`,
      metadata: { orderId: order.id, totalCents: order.totalCents, method: "PayPal" },
      ip,
      userId: order.userId,
    });
    await flagOrderIfSuspicious(toFraudOrder(order), ip);

    revalidatePath("/cart");
    revalidatePath("/", "layout");
    return { success: true, orderNumber: order.orderNumber };
  } catch (err) {
    await writeSystemLog({
      category: "PAYMENT",
      level: "error",
      message: `Failed to capture PayPal payment for order ${order.orderNumber}`,
      metadata: { orderId: order.id, error: err instanceof Error ? err.message : "unknown" },
      ip: await getRequestIp(),
      userId: order.userId,
    });
    return { error: "Failed to capture payment." };
  }
}

function toFraudOrder(order: {
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
}): FraudOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    userId: order.userId,
    guestEmail: order.guestEmail,
    shippingPostal: order.shippingPostal,
    shippingCountry: order.shippingCountry,
    shippingCity: order.shippingCity,
    billingPostal: order.billingPostal,
    billingCountry: order.billingCountry,
    billingCity: order.billingCity,
  };
}

export async function cancelCheckoutOrderAction(orderId: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  await markPaymentFailed(orderId);
}

const OFFLINE_METHODS = {
  cash: "Cash on Pickup",
  interac: "Interac e-Transfer",
} as const;

type OfflineMethod = keyof typeof OFFLINE_METHODS;

/**
 * Places a PENDING order paid via an offline method (Cash on Pickup or Interac
 * e-Transfer). No PayPal involved. Stock is decremented later when an admin
 * marks the order PAID. The cart is cleared and the customer sees instructions.
 */
export async function createOfflineOrderAction(formData: FormData) {
  const limited = await rateLimitAction("checkout-offline", 30, 60_000);
  if (limited) return { error: limited };

  const method = String(formData.get("paymentMethod") ?? "") as OfflineMethod;
  if (!(method in OFFLINE_METHODS)) {
    return { error: "Select a valid payment method." };
  }

  const settings = await getSiteSettings();
  if (method === "cash" && !settings.cashOnPickupEnabled) {
    return { error: "Cash on Pickup is not available." };
  }
  if (method === "interac" && !settings.interacEnabled) {
    return { error: "Interac e-Transfer is not available." };
  }

  const built = await buildOrderDraft(formData);
  if ("error" in built) return { error: built.error };
  const { draft } = built;

  const order = await createOrderFromDraft(draft);

  await recordPaymentPending(
    prisma,
    {
      id: order.id,
      shippingName: draft.shippingName,
      totalCents: draft.totalCents,
    },
    OFFLINE_METHODS[method],
  );

  // Clear the cart now so the order can't be re-submitted.
  await prisma.cartItem.deleteMany({ where: { cartId: draft.cartId } });
  await prisma.cart.update({
    where: { id: draft.cartId },
    data: { couponCode: null },
  });

  const ip = await getRequestIp();
  await writeSystemLog({
    category: "PAYMENT",
    level: "info",
    message: `Offline order ${order.orderNumber} placed (${OFFLINE_METHODS[method]})`,
    metadata: { orderId: order.id, totalCents: draft.totalCents, method: OFFLINE_METHODS[method] },
    ip,
    userId: draft.userId,
  });
  await flagOrderIfSuspicious(toFraudOrder(order), ip);

  revalidatePath("/cart");
  revalidatePath("/", "layout");

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    method,
  };
}
