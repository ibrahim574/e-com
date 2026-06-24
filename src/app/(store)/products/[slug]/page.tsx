import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { RelatedProducts } from "@/components/products/related-products";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";
import { getRelatedProducts } from "@/lib/related-products";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, description: true },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | Hytera Radios`,
    description:
      product.shortDescription ??
      product.description.slice(0, 160).replace(/\s+/g, " "),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currency = await getCurrency();

  const product = await prisma.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      options: {
        orderBy: { position: "asc" },
        include: { values: { orderBy: { position: "asc" } } },
      },
      variants: {
        include: {
          options: {
            include: { optionValue: { include: { option: true } } },
          },
        },
      },
      categories: { include: { category: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!product) notFound();

  const related = await getRelatedProducts(product.id);
  const primaryCategory = product.categories[0]?.category;

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        {" / "}
        {primaryCategory ? (
          <>
            <Link
              href={`/categories/${primaryCategory.slug}`}
              className="hover:text-blue-600"
            >
              {primaryCategory.name}
            </Link>
            {" / "}
          </>
        ) : (
          <>
            <Link href="/search" className="hover:text-blue-600">
              Products
            </Link>
            {" / "}
          </>
        )}
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <ProductDetailClient
        product={product}
        options={product.options}
        variants={product.variants}
        reviews={product.reviews}
        currency={currency}
      />

      <RelatedProducts products={related} currency={currency} />
    </div>
  );
}
