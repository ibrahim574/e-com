import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { SavedToast } from "@/components/ui/saved-toast";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: true,
      industries: true,
      signalTypes: true,
      frequencyBands: true,
      relatedFrom: true,
      compatibleFrom: true,
      options: { include: { values: true }, orderBy: { position: "asc" } },
      variants: {
        include: {
          options: { include: { optionValue: { include: { option: true } } } },
        },
      },
    },
  });

  if (!product) notFound();

  return (
    <div>
      <Suspense>
        <SavedToast message="Product saved successfully." />
      </Suspense>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-blue-600">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-3xl font-bold dark:text-white">Edit Product</h1>
      </div>
      <ProductForm product={product} />
      <div className="mt-10">
        <VariantManager product={product} />
      </div>
    </div>
  );
}
