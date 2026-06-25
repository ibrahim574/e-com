"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { saveFeaturedImageFile, deleteFeaturedImageFile } from "@/lib/featured-images";
import { sanitizeText } from "@/lib/sanitize";
import { cacheInvalidate } from "@/lib/cache";

type ActionResult = { message?: string; error?: string };

export async function saveFeaturedItemAction(formData: FormData): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = sanitizeText(String(formData.get("title") ?? ""));
  const altText = sanitizeText(String(formData.get("altText") ?? ""), 200) || null;
  const linkUrl = sanitizeText(String(formData.get("linkUrl") ?? ""), 500) || null;
  const position = Number(formData.get("position") ?? 0);
  const isActive = formData.get("isActive") === "on";

  if (!title) return { error: "Title is required." };

  let image: string | null = null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image = await saveFeaturedImageFile(imageFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload image." };
    }
  }

  if (id) {
    const existing = await prisma.featuredItem.findUnique({ where: { id } });
    if (image && existing?.image) {
      await deleteFeaturedImageFile(existing.image);
    }
    await prisma.featuredItem.update({
      where: { id },
      data: {
        title,
        altText,
        linkUrl,
        position,
        isActive,
        ...(image ? { image } : {}),
      },
    });
  } else {
    await prisma.featuredItem.create({
      data: { title, altText, linkUrl, position, isActive, image },
    });
  }

  await recordAudit({
    actor,
    action: id ? "UPDATE" : "CREATE",
    entityType: "SiteSettings",
    summary: `${id ? "Updated" : "Created"} featured item "${title}"`,
  });

  cacheInvalidate("featured-items");
  revalidatePath("/");
  revalidatePath("/featured");
  revalidatePath("/admin/featured");
  return { message: id ? "Featured item updated." : "Featured item added." };
}

export async function deleteFeaturedItemAction(formData: FormData): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id"));
  const item = await prisma.featuredItem.findUnique({ where: { id } });
  if (item?.image) await deleteFeaturedImageFile(item.image);
  await prisma.featuredItem.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "SiteSettings",
    entityId: id,
    summary: "Deleted featured item",
  });

  cacheInvalidate("featured-items");
  revalidatePath("/");
  revalidatePath("/featured");
  revalidatePath("/admin/featured");
  return { message: "Featured item deleted." };
}
