"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { ProductStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

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
  };

  let productId = id;

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    const product = await prisma.product.create({ data });
    productId = product.id;
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
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;

  if (id) {
    await prisma.category.update({
      where: { id },
      data: { name, slug, description, image },
    });
  } else {
    await prisma.category.create({
      data: { name, slug, description, image },
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function saveIndustryAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim() || null;
  const image = String(formData.get("image") ?? "").trim() || null;

  if (id) {
    await prisma.industry.update({
      where: { id },
      data: { name, slug, description, image },
    });
  } else {
    await prisma.industry.create({
      data: { name, slug, description, image },
    });
  }

  revalidatePath("/admin/industries");
  revalidatePath("/");
  redirect("/admin/industries");
}

export async function deleteIndustryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.industry.delete({ where: { id } });
  revalidatePath("/admin/industries");
  redirect("/admin/industries");
}

export async function saveVariantAction(formData: FormData) {
  await requireAdmin();

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

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

export async function saveProductOptionAction(formData: FormData) {
  await requireAdmin();

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

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit?option=${option.id}`);
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") {
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
