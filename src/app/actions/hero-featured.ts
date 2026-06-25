"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { cacheInvalidate } from "@/lib/cache";

type ActionResult = { message?: string; error?: string };

function invalidateHeroFeatured() {
  cacheInvalidate("hero-featured-products");
  revalidatePath("/");
  revalidatePath("/admin/featured");
}

export async function addHeroFeaturedProductAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) return { error: "Please select a product." };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true },
  });
  if (!product) return { error: "Product not found." };
  if (product.status !== "ACTIVE") {
    return { error: "Only active products can be featured." };
  }

  const existing = await prisma.heroFeaturedProduct.findUnique({
    where: { productId },
  });
  if (existing) return { error: "This product is already featured." };

  const maxPosition = await prisma.heroFeaturedProduct.aggregate({
    _max: { position: true },
  });
  const position = (maxPosition._max.position ?? -1) + 1;

  await prisma.heroFeaturedProduct.create({
    data: { productId, position },
  });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "Product",
    entityId: productId,
    summary: `Added "${product.name}" to homepage hero featured panel`,
  });

  invalidateHeroFeatured();
  return { message: `"${product.name}" added to hero featured panel.` };
}

export async function removeHeroFeaturedProductAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Invalid entry." };

  const entry = await prisma.heroFeaturedProduct.findUnique({
    where: { id },
    include: { product: { select: { name: true } } },
  });
  if (!entry) return { error: "Featured entry not found." };

  await prisma.heroFeaturedProduct.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Product",
    entityId: entry.productId,
    summary: `Removed "${entry.product.name}" from homepage hero featured panel`,
  });

  invalidateHeroFeatured();
  return { message: `"${entry.product.name}" removed from hero featured panel.` };
}

export async function moveHeroFeaturedProductAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "") as "up" | "down";
  if (!id || (direction !== "up" && direction !== "down")) {
    return { error: "Invalid reorder request." };
  }

  const items = await prisma.heroFeaturedProduct.findMany({
    orderBy: { position: "asc" },
  });
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { error: "Featured entry not found." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) {
    return { message: "Order unchanged." };
  }

  const current = items[index];
  const adjacent = items[swapIndex];

  await prisma.$transaction([
    prisma.heroFeaturedProduct.update({
      where: { id: current.id },
      data: { position: adjacent.position },
    }),
    prisma.heroFeaturedProduct.update({
      where: { id: adjacent.id },
      data: { position: current.position },
    }),
  ]);

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "SiteSettings",
    summary: `Reordered homepage hero featured product (${direction})`,
  });

  invalidateHeroFeatured();
  return { message: "Order updated." };
}
