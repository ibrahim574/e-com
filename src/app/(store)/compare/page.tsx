import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";
import { COMPARE_COOKIE, parseCompareCookie } from "@/lib/compare";
import { CompareView, type CompareProductData } from "@/components/compare/compare-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Products",
  description: "Compare professional two-way radios side by side.",
  alternates: { canonical: "/compare" },
  robots: { index: false, follow: true },
};

export default async function ComparePage() {
  const [cookieStore, currency] = await Promise.all([cookies(), getCurrency()]);
  const ids = parseCompareCookie(cookieStore.get(COMPARE_COOKIE)?.value);

  const [products, attributes] = await Promise.all([
    ids.length
      ? prisma.product.findMany({
          where: { id: { in: ids }, status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            images: true,
            shortDescription: true,
            specifications: true,
            stock: true,
            hasVariants: true,
            weightGrams: true,
            priceCadCents: true,
            priceUsdCents: true,
            saleCadCents: true,
            saleUsdCents: true,
          },
        })
      : Promise.resolve([]),
    prisma.comparisonAttribute.findMany({
      where: { enabled: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, source: true, key: true },
    }),
  ]);

  // Preserve the user's selection order.
  const ordered: CompareProductData[] = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Compare Products</h1>
      <CompareView
        products={ordered}
        attributes={attributes}
        currency={currency}
      />
    </div>
  );
}
