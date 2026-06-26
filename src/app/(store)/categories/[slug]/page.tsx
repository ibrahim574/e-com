import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/product-card";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!category) return { title: "Category Not Found" };
  const description =
    category.description ??
    `Shop ${category.name} from our professional two-way radio catalog.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      type: "website",
      title: category.name,
      description,
      url: `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currency = await getCurrency();

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { product: { status: "ACTIVE" } },
        include: { product: true },
      },
    },
  });

  if (!category) notFound();

  const products = category.products.map((p) => p.product);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="section-title">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-slate-600">{category.description}</p>
        )}
      </div>
      {products.length === 0 ? (
        <p className="text-slate-600">No products in this category yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
