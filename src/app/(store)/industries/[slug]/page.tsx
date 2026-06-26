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
  const industry = await prisma.industry.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!industry) return { title: "Industry Not Found" };
  const title = `Radios for ${industry.name}`;
  const description =
    industry.description ??
    `Two-way radio and communication solutions for ${industry.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/industries/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/industries/${slug}`,
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currency = await getCurrency();

  const industry = await prisma.industry.findUnique({
    where: { slug },
    include: {
      products: {
        where: { product: { status: "ACTIVE" } },
        include: { product: true },
      },
    },
  });

  if (!industry) notFound();

  const products = industry.products.map((p) => p.product);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="section-title">Radios for {industry.name}</h1>
        {industry.description && (
          <p className="mt-2 max-w-2xl text-slate-600">{industry.description}</p>
        )}
      </div>
      {products.length === 0 ? (
        <p className="text-slate-600">No products for this industry yet.</p>
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
