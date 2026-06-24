"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

async function getStockLimit(productId: string, variantId: string | null) {
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });
    return variant?.stock ?? 0;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  return product?.stock ?? 0;
}

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId"));
  const variantId = formData.get("variantId")
    ? String(formData.get("variantId"))
    : null;
  const requested = Math.max(1, Number(formData.get("quantity") ?? 1));
  const txFrequency = String(formData.get("txFrequency") ?? "").trim();
  const rxFrequency = String(formData.get("rxFrequency") ?? "").trim();
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
