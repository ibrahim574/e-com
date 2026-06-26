import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { RelatedProducts } from "@/components/products/related-products";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice } from "@/lib/currency";
import { getRelatedProducts } from "@/lib/related-products";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

function productDescription(product: {
  shortDescription: string | null;
  description: string;
}): string {
  return (
    product.shortDescription ??
    product.description.slice(0, 160).replace(/\s+/g, " ").trim()
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      name: true,
      shortDescription: true,
      description: true,
      images: true,
    },
  });
  if (!product) return { title: "Product Not Found" };

  const description = productDescription(product);
  const image = product.images?.[0];
  const url = absoluteUrl(`/products/${slug}`);

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
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

  const pricing = getProductPrice(product, currency);
  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription(product),
    sku: product.slug,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.images?.length
      ? { image: product.images.map((img) => absoluteUrl(img)) }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: currency,
      price: (pricing.currentCents / 100).toFixed(2),
      availability:
        product.stock > 0 || product.hasVariants
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...(primaryCategory
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: primaryCategory.name,
              item: absoluteUrl(`/categories/${primaryCategory.slug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: primaryCategory ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="container-page py-10">
      <JsonLd data={[productLd, breadcrumbLd]} />
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
