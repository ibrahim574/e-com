"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { saveHeroImageFile, deleteHeroImageFile } from "@/lib/hero-images";
import { sanitizeText } from "@/lib/sanitize";
import { cacheInvalidate } from "@/lib/cache";

type ActionResult = { message?: string; error?: string };

export async function saveHeroSlideAction(formData: FormData): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = sanitizeText(String(formData.get("title") ?? ""), 200) || null;
  const subtitle = sanitizeText(String(formData.get("subtitle") ?? ""), 500) || null;
  const linkUrl = sanitizeText(String(formData.get("linkUrl") ?? ""), 500) || null;
  const position = Number(formData.get("position") ?? 0);
  const isActive = formData.get("isActive") === "on";

  let image: string | null = null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image = await saveHeroImageFile(imageFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload image." };
    }
  }

  if (!id && !image) {
    return { error: "Image is required for a new slide." };
  }

  try {
    if (id) {
      const existing = await prisma.heroSlide.findUnique({ where: { id } });
      if (!existing) return { error: "Slide not found." };
      if (image && existing.image) {
        await deleteHeroImageFile(existing.image);
      }
      await prisma.heroSlide.update({
        where: { id },
        data: {
          title,
          subtitle,
          linkUrl,
          position,
          isActive,
          ...(image ? { image } : {}),
        },
      });
    } else {
      await prisma.heroSlide.create({
        data: { title, subtitle, linkUrl, position, isActive, image: image! },
      });
    }
  } catch {
    return { error: "Failed to save slide." };
  }

  await recordAudit({
    actor,
    action: id ? "UPDATE" : "CREATE",
    entityType: "SiteSettings",
    summary: `${id ? "Updated" : "Created"} hero slide`,
  });

  cacheInvalidate("hero-slides");
  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { message: id ? "Slide updated successfully." : "Slide added successfully." };
}

export async function deleteHeroSlideAction(formData: FormData): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id"));
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) return { error: "Slide not found." };

  if (slide.image) await deleteHeroImageFile(slide.image);
  await prisma.heroSlide.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "SiteSettings",
    entityId: id,
    summary: "Deleted hero slide",
  });

  cacheInvalidate("hero-slides");
  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { message: "Slide deleted successfully." };
}
