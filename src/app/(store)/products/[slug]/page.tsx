import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";

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

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        {" / "}
        <Link href="/search" className="hover:text-blue-600">
          Products
        </Link>
        {" / "}
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <ProductDetailClient
        product={product}
        options={product.options}
        variants={product.variants}
        reviews={product.reviews}
        currency={currency}
      />
    </div>
  );
}
