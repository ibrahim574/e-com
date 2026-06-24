import { cookies } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export const GUEST_CART_COOKIE = "guest_cart_id";

const cartInclude = {
  items: {
    include: {
      product: { include: { shippingClass: true } },
      variant: {
        include: {
          shippingClass: true,
          options: {
            include: { optionValue: { include: { option: true } } },
          },
        },
      },
    },
  },
} as const;

/** Read-only cart lookup for layouts and pages (no cookie writes). */
export async function getCart() {
  const session = await auth();
  const cookieStore = await cookies();

  if (session?.user?.id) {
    return prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: cartInclude,
    });
  }

  const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestId) {
    return null;
  }

  return prisma.cart.findUnique({
    where: { guestId },
    include: cartInclude,
  });
}

/** Creates or resolves a cart. Only call from Server Actions or Route Handlers. */
export async function getOrCreateCart() {
  const session = await auth();
  const cookieStore = await cookies();

  if (session?.user?.id) {
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: cartInclude,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: cartInclude,
      });
    }

    return cart;
  }

  let guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_CART_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  let cart = await prisma.cart.findUnique({
    where: { guestId },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestId },
      include: cartInclude,
    });
  }

  return cart;
}

/** Merge guest cart into user cart after login/register. Server Actions only. */
export async function mergeGuestCart(userId: string) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (!guestId) {
    return;
  }

  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  if (!guestCart) {
    cookieStore.delete(GUEST_CART_COOKIE);
    return;
  }

  const userCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!userCart) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId, guestId: null },
    });
  } else {
    for (const item of guestCart.items) {
      const existing = userCart.items.find(
        (i) =>
          i.productId === item.productId &&
          (i.variantId ?? null) === (item.variantId ?? null),
      );

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  cookieStore.delete(GUEST_CART_COOKIE);
}

export function getVariantLabel(
  variant: {
    options: Array<{
      optionValue: { value: string; option: { name: string } };
    }>;
  } | null,
) {
  if (!variant?.options.length) return null;
  return variant.options
    .map((o) => `${o.optionValue.option.name}: ${o.optionValue.value}`)
    .join(" / ");
}
