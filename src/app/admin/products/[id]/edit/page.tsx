import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const { id } = await params;
  const { saved } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: true,
      industries: true,
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
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-blue-600">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Edit Product</h1>
        {saved && (
          <p className="mt-2 text-sm text-green-600">Product saved successfully.</p>
        )}
      </div>
      <ProductForm product={product} />
      <div className="mt-10">
        <VariantManager product={product} />
      </div>
    </div>
  );
}
