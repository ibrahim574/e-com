"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupons";
import type { CouponLineItem } from "@/lib/coupons";

const OPEN_STOCK_LIMIT = 99;

/**
 * Effective max quantity a customer may add. Products flagged for pre-order or
 * backorder can be purchased past their on-hand stock.
 */
async function getStockLimit(productId: string, variantId: string | null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, allowPreorder: true, allowBackorder: true },
  });
  const openOrder = Boolean(product?.allowPreorder || product?.allowBackorder);

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });
    if (openOrder) return OPEN_STOCK_LIMIT;
    return variant?.stock ?? 0;
  }

  if (openOrder) return OPEN_STOCK_LIMIT;
  return product?.stock ?? 0;
}

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId"));
  const variantId = formData.get("variantId")
    ? String(formData.get("variantId"))
    : null;
  const requested = Math.max(1, Number(formData.get("quantity") ?? 1));
  const selectedFrequency = String(formData.get("selectedFrequency") ?? "").trim();
  let txFrequency = String(formData.get("txFrequency") ?? "").trim();
  let rxFrequency = String(formData.get("rxFrequency") ?? "").trim();
  const isCustom =
    selectedFrequency === "Custom Frequency" ||
    (Boolean(txFrequency) && Boolean(rxFrequency));

  if (isCustom) {
    if (!txFrequency || !rxFrequency) {
      return { error: "TX and RX frequencies are required for custom programming." };
    }
  } else if (selectedFrequency) {
    txFrequency = selectedFrequency;
    rxFrequency = "";
  }
  const stockLimit = await getStockLimit(productId, variantId);
  if (stockLimit <= 0) return;

  const cart = await getOrCreateCart();

  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
      txFrequency,
      rxFrequency,
    },
  });

  const nextQuantity = Math.min(
    stockLimit,
    (existing?.quantity ?? 0) + requested,
  );

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity: Math.min(requested, stockLimit),
        txFrequency,
        rxFrequency,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const quantity = Math.max(0, Number(formData.get("quantity")));

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      select: { variantId: true, productId: true },
    });
    if (!item) return;

    const stockLimit = await getStockLimit(item.productId, item.variantId);
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, stockLimit) },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function applyCouponAction(formData: FormData) {
  const code = normalizeCouponCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "Enter a coupon code." };

  const [cart, currency, session] = await Promise.all([
    getOrCreateCart(),
    getCurrency(),
    auth(),
  ]);

  if (!cart.items.length) return { error: "Your cart is empty." };

  let subtotalCents = 0;
  const items: CouponLineItem[] = cart.items.map((item) => {
    const pricing = item.variant
      ? getVariantPrice(item.variant, item.product, currency)
      : getProductPrice(item.product, currency);
    subtotalCents += pricing.currentCents * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: pricing.currentCents,
    };
  });

  const res = await evaluateCoupon(code, {
    subtotalCents,
    shippingCents: 0,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    items,
  });
  if ("error" in res) return { error: res.error };

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: code },
  });

  revalidatePath("/cart");
  return { success: true, message: `Coupon applied — ${res.discount.label}.` };
}

export async function removeCouponAction() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: null },
  });
  revalidatePath("/cart");
  return { success: true };
}
