"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
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
import { isLoginLocked, recordLoginAttempt } from "@/lib/login-lockout";
import { getClientIp } from "@/lib/rate-limit";
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
  "REFUNDED",
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
  const purchaseCostCentsRaw = formData.get("purchaseCostCents");
  const purchaseCostCents = purchaseCostCentsRaw
    ? Math.round(Number(purchaseCostCentsRaw) * 100)
    : null;
  const lowStockThreshold = Math.max(
    0,
    Math.round(Number(formData.get("lowStockThreshold") ?? 5)),
  );
  const categoryIds = formData.getAll("categoryIds").map(String);
  const industryIds = formData.getAll("industryIds").map(String);
  const seriesId = String(formData.get("seriesId") ?? "").trim() || null;
  const frequencyOptions = String(formData.get("frequencyOptions") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowCustomFrequency = formData.get("allowCustomFrequency") === "on";
  const customTxRequired = formData.get("customTxRequired") === "on";
  const customRxRequired = formData.get("customRxRequired") === "on";
  const signalTypeIds = formData.getAll("signalTypeIds").map(String);
  const frequencyBandIds = formData.getAll("frequencyBandIds").map(String);
  const relatedProductIds = formData.getAll("relatedProductIds").map(String);
  const compatibleProductIds = formData.getAll("compatibleProductIds").map(String);
  const shippingEnabled = formData.get("shippingEnabled") !== "off";
  const lengthCm = formData.get("lengthCm")
    ? Number(formData.get("lengthCm"))
    : null;
  const widthCm = formData.get("widthCm") ? Number(formData.get("widthCm")) : null;
  const heightCm = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const weightGrams = formData.get("weightGrams")
    ? Math.round(Number(formData.get("weightGrams")))
    : null;
  const shippingClassId = String(formData.get("shippingClassId") ?? "").trim() || null;

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
    purchaseCostCents,
    lowStockThreshold,
    seriesId,
    frequencyOptions,
    allowCustomFrequency,
    customTxRequired,
    customRxRequired,
    shippingEnabled,
    lengthCm,
    widthCm,
    heightCm,
    weightGrams,
    shippingClassId,
  };

  let productId = id;
  let isCreate = false;

  if (id) {
    const before = await prisma.product.findUnique({
      where: { id },
      select: { stock: true, name: true },
    });
    await prisma.product.update({ where: { id }, data });
    if (before && before.stock !== stock) {
      const { logInventoryMovement } = await import("@/lib/inventory-movement");
      await logInventoryMovement(prisma, {
        productId: id,
        productName: before.name,
        changeType: "MANUAL_ADJUSTMENT",
        qtyBefore: before.stock,
        qtyAfter: stock,
        changedById: actor.id,
      });
      await recordAudit({
        actor,
        action: "STOCK",
        entityType: "Product",
        entityId: id,
        summary: `Stock changed from ${before.stock} to ${stock}`,
        previousValue: { stock: before.stock },
        newValue: { stock },
      });
    }
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

    await prisma.productSignalType.deleteMany({ where: { productId } });
    if (signalTypeIds.length) {
      await prisma.productSignalType.createMany({
        data: signalTypeIds.map((signalTypeId) => ({ productId, signalTypeId })),
      });
    }

    await prisma.productFrequencyBand.deleteMany({ where: { productId } });
    if (frequencyBandIds.length) {
      await prisma.productFrequencyBand.createMany({
        data: frequencyBandIds.map((frequencyBandId) => ({ productId, frequencyBandId })),
      });
    }

    await prisma.relatedProduct.deleteMany({ where: { productId } });
    if (relatedProductIds.length) {
      await prisma.relatedProduct.createMany({
        data: relatedProductIds.map((relatedProductId, i) => ({
          productId,
          relatedProductId,
          position: i,
        })),
      });
    }

    await prisma.compatibleProduct.deleteMany({ where: { productId } });
    if (compatibleProductIds.length) {
      await prisma.compatibleProduct.createMany({
        data: compatibleProductIds.map((compatibleProductId, i) => ({
          productId,
          compatibleProductId,
          position: i,
        })),
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
    const before = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    });
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
    if (before && before.stock !== stock) {
      const { logInventoryMovement } = await import("@/lib/inventory-movement");
      await logInventoryMovement(prisma, {
        productId,
        variantId,
        productName: before.product.name,
        sku,
        changeType: "MANUAL_ADJUSTMENT",
        qtyBefore: before.stock,
        qtyAfter: stock,
        changedById: actor.id,
      });
    }
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

export async function deleteVariantAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const variantId = String(formData.get("variantId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!variantId) return;

  const orderCount = await prisma.orderItem.count({ where: { variantId } });
  if (orderCount > 0) return;

  const cartCount = await prisma.cartItem.count({ where: { variantId } });
  if (cartCount > 0) return;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return;

  await prisma.productVariantOption.deleteMany({ where: { variantId } });
  await prisma.productVariant.delete({ where: { id: variantId } });

  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "ProductVariant",
    entityId: variantId,
    summary: `Deleted variant ${variant.sku}`,
    metadata: { productId },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
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

export async function generateVariantMatrixAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const productId = String(formData.get("productId"));

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      options: { include: { values: true }, orderBy: { position: "asc" } },
      variants: { include: { options: true } },
    },
  });
  if (!product || product.options.length === 0) {
    return;
  }

  const valueGroups = product.options.map((o) => o.values);
  const combos: string[][] = [];

  function buildCombo(depth: number, current: string[]) {
    if (depth === valueGroups.length) {
      combos.push([...current]);
      return;
    }
    for (const val of valueGroups[depth]) {
      current.push(val.id);
      buildCombo(depth + 1, current);
      current.pop();
    }
  }
  buildCombo(0, []);

  const existingSets = new Set(
    product.variants.map((v) =>
      v.options
        .map((o) => o.optionValueId)
        .sort()
        .join(","),
    ),
  );

  let created = 0;
  for (const combo of combos) {
    const key = [...combo].sort().join(",");
    if (existingSets.has(key)) continue;

    const labels = combo.map((valueId) => {
      for (const opt of product.options) {
        const val = opt.values.find((v) => v.id === valueId);
        if (val) return val.value.slice(0, 3).toUpperCase();
      }
      return "VAR";
    });
    const sku = `${product.slug.slice(0, 8).toUpperCase()}-${labels.join("-")}-${created + 1}`;

    await prisma.productVariant.create({
      data: {
        productId,
        sku,
        stock: 0,
        options: {
          create: combo.map((optionValueId) => ({ optionValueId })),
        },
      },
    });
    created++;
  }

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "ProductVariant",
    entityId: productId,
    summary: `Generated ${created} variant combinations`,
  });

  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function bulkDeleteProductsAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const ids = formData.getAll("productIds").map(String);
  if (!ids.length) return { error: "No products selected." };
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Product",
    summary: `Bulk deleted ${ids.length} products`,
  });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function bulkSetProductStatusAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const ids = formData.getAll("productIds").map(String);
  const status = formData.get("status") as ProductStatus;
  if (!ids.length) return { error: "No products selected." };
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Product",
    summary: `Bulk set ${ids.length} products to ${status}`,
  });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  if (await isLoginLocked(email, ip)) {
    return {
      error: "Too many failed login attempts. Please try again in 15 minutes.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !isAdminRole(user.role)) {
    await recordLoginAttempt(email, ip, false);
    await recordAudit({
      actor: null,
      action: "LOGIN",
      entityType: "User",
      entityId: null,
      summary: `Failed admin login for ${email}`,
      metadata: { ip, success: false },
    });
    return { error: "Invalid admin credentials." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await recordLoginAttempt(email, ip, false);
    await recordAudit({
      actor: null,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      summary: `Failed admin login for ${email}`,
      metadata: { ip, success: false },
    });
    return { error: "Invalid admin credentials." };
  }

  await recordLoginAttempt(email, ip, true);
  await recordAudit({
    actor: { id: user.id, email: user.email },
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    summary: `Admin login: ${email}`,
    metadata: { ip, success: true },
  });

  const { signIn } = await import("@/lib/auth");
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/admin",
  });
}
