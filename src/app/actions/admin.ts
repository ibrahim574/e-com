"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getActorOrThrow, isAdminRole } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import {
  deleteProductImageFile,
  saveProductImageFile,
} from "@/lib/product-images";
import { ProductStatus, OrderStatus } from "@prisma/client";

export type ProductImageActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export async function updateOrderStatusAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!id || !ORDER_STATUSES.includes(status)) {
    return;
  }

  const before = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true, status: true },
  });

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  await recordAudit({
    actor,
    action: "STATUS",
    entityType: "Order",
    entityId: id,
    summary: `Order ${before?.orderNumber ?? id}: ${before?.status ?? "?"} -> ${status}`,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<ProductImageActionResult> {
  try {
    await getActorOrThrow();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "No image file provided." };
    }

    const url = await saveProductImageFile(file);
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function deleteProductImageAction(
  formData: FormData,
): Promise<ProductImageActionResult> {
  try {
    await getActorOrThrow();

    const url = String(formData.get("url") ?? "").trim();
    if (!url) {
      return { ok: false, error: "No image URL provided." };
    }

    await deleteProductImageFile(url);
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}

export async function saveProductAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim() || null;
  const specifications = String(formData.get("specifications") ?? "").trim() || null;
  const images = String(formData.get("images") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const status = (formData.get("status") as ProductStatus) || "DRAFT";
  const isNewArrival = formData.get("isNewArrival") === "on";
  const isBestSeller = formData.get("isBestSeller") === "on";
  const priceCadCents = Math.round(Number(formData.get("priceCadCents") ?? 0) * 100);
  const priceUsdCents = Math.round(Number(formData.get("priceUsdCents") ?? 0) * 100);
  const saleCadCentsRaw = formData.get("saleCadCents");
  const saleUsdCentsRaw = formData.get("saleUsdCents");
  const saleCadCents = saleCadCentsRaw
    ? Math.round(Number(saleCadCentsRaw) * 100)
    : null;
  const saleUsdCents = saleUsdCentsRaw
    ? Math.round(Number(saleUsdCentsRaw) * 100)
    : null;
  const hasVariants = formData.get("hasVariants") === "on";
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const categoryIds = formData.getAll("categoryIds").map(String);
  const industryIds = formData.getAll("industryIds").map(String);

  const data = {
    name,
    slug,
    brand,
    description,
    shortDescription,
    specifications,
    images: images.length ? images : ["/placeholder-product.svg"],
    status,
    isNewArrival,
    isBestSeller,
    priceCadCents,
    priceUsdCents,
    saleCadCents,
    saleUsdCents,
    hasVariants,
    stock,
  };

  let productId = id;
  let isCreate = false;

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    const product = await prisma.product.create({ data });
    productId = product.id;
    isCreate = true;
  }

  if (productId) {
    await prisma.productCategory.deleteMany({ where: { productId } });
    await prisma.productIndustry.deleteMany({ where: { productId } });

    if (categoryIds.length) {
      await prisma.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      });
    }

    if (industryIds.length) {
      await prisma.productIndustry.createMany({
        data: industryIds.map((industryId) => ({ productId, industryId })),
      });
    }

    await recordAudit({
      actor,
      action: isCreate ? "CREATE" : "UPDATE",
      entityType: "Product",
      entityId: productId,
      summary: `${isCreate ? "Created" : "Updated"} product "${name}"`,
      metadata: {
        slug,
        status,
        priceCadCents,
        priceUsdCents,
        stock,
        hasVariants,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id"));
  const before = await prisma.product.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });
  await prisma.product.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Product",
    entityId: id,
    summary: `Deleted product "${before?.name ?? id}"`,
    metadata: { slug: before?.slug },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function saveCategoryAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;

  let entityId = id;
  let isCreate = false;
  if (id) {
    await prisma.category.update({
      where: { id },
      data: { name, slug, description, image },
    });
  } else {
    const created = await prisma.category.create({
      data: { name, slug, description, image },
    });
    entityId = created.id;
    isCreate = true;
  }

  await recordAudit({
    actor,
    action: isCreate ? "CREATE" : "UPDATE",
    entityType: "Category",
    entityId,
    summary: `${isCreate ? "Created" : "Updated"} category "${name}"`,
    metadata: { slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id"));
  const before = await prisma.category.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });
  await prisma.category.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Category",
    entityId: id,
    summary: `Deleted category "${before?.name ?? id}"`,
    metadata: { slug: before?.slug },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function saveIndustryAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;

  let entityId = id;
  let isCreate = false;
  if (id) {
    await prisma.industry.update({
      where: { id },
      data: { name, slug, description, image },
    });
  } else {
    const created = await prisma.industry.create({
      data: { name, slug, description, image },
    });
    entityId = created.id;
    isCreate = true;
  }

  await recordAudit({
    actor,
    action: isCreate ? "CREATE" : "UPDATE",
    entityType: "Industry",
    entityId,
    summary: `${isCreate ? "Created" : "Updated"} industry "${name}"`,
    metadata: { slug },
  });

  revalidatePath("/admin/industries");
  revalidatePath("/");
  redirect("/admin/industries");
}

export async function deleteIndustryAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id"));
  const before = await prisma.industry.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });
  await prisma.industry.delete({ where: { id } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Industry",
    entityId: id,
    summary: `Deleted industry "${before?.name ?? id}"`,
    metadata: { slug: before?.slug },
  });

  revalidatePath("/admin/industries");
  redirect("/admin/industries");
}

export async function saveVariantAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const productId = String(formData.get("productId"));
  const variantId = formData.get("variantId")
    ? String(formData.get("variantId"))
    : null;
  const sku = String(formData.get("sku") ?? "").trim();
  const stock = Number(formData.get("stock") ?? 0);
  const priceCadCents = formData.get("priceCadCents")
    ? Math.round(Number(formData.get("priceCadCents")) * 100)
    : null;
  const priceUsdCents = formData.get("priceUsdCents")
    ? Math.round(Number(formData.get("priceUsdCents")) * 100)
    : null;
  const saleCadCents = formData.get("saleCadCents")
    ? Math.round(Number(formData.get("saleCadCents")) * 100)
    : null;
  const saleUsdCents = formData.get("saleUsdCents")
    ? Math.round(Number(formData.get("saleUsdCents")) * 100)
    : null;
  const image = String(formData.get("image") ?? "").trim() || null;
  const optionValueIds = formData.getAll("optionValueIds").map(String);

  let isCreate = false;
  let resolvedVariantId: string;

  if (variantId) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku,
        stock,
        priceCadCents,
        priceUsdCents,
        saleCadCents,
        saleUsdCents,
        image,
      },
    });
    resolvedVariantId = variantId;
  } else {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        stock,
        priceCadCents,
        priceUsdCents,
        saleCadCents,
        saleUsdCents,
        image,
      },
    });
    resolvedVariantId = variant.id;
    isCreate = true;

    if (optionValueIds.length) {
      await prisma.productVariantOption.createMany({
        data: optionValueIds.map((optionValueId) => ({
          variantId: variant.id,
          optionValueId,
        })),
      });
    }
  }

  await prisma.product.update({
    where: { id: productId },
    data: { hasVariants: true },
  });

  await recordAudit({
    actor,
    action: isCreate ? "CREATE" : "UPDATE",
    entityType: "ProductVariant",
    entityId: resolvedVariantId,
    summary: `${isCreate ? "Created" : "Updated"} variant ${sku}`,
    metadata: { productId, sku, stock },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

export async function saveProductOptionAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const productId = String(formData.get("productId"));
  const name = String(formData.get("name") ?? "").trim();
  const values = String(formData.get("values") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const option = await prisma.productOption.create({
    data: {
      productId,
      name,
      values: {
        create: values.map((value, index) => ({ value, position: index })),
      },
    },
  });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "ProductOption",
    entityId: option.id,
    summary: `Added option "${name}" to product`,
    metadata: { productId, values },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit?option=${option.id}`);
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !isAdminRole(user.role)) {
    return { error: "Invalid admin credentials." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid admin credentials." };
  }

  const { signIn } = await import("@/lib/auth");
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/admin",
  });
}
