import { prisma } from "./prisma";

const MIN_RELATED = 2;
const MAX_RELATED = 6;

type RelatedProductCard = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  brand: string | null;
  priceCadCents: number;
  priceUsdCents: number;
  saleCadCents: number | null;
  saleUsdCents: number | null;
  isNewArrival: boolean;
  isBestSeller: boolean;
  hasVariants: boolean;
  stock: number;
};

export async function getRelatedProducts(
  productId: string,
): Promise<RelatedProductCard[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      seriesId: true,
      categories: { select: { categoryId: true } },
    },
  });

  if (!product) return [];

  const seen = new Set<string>([productId]);
  const results: RelatedProductCard[] = [];

  const cardSelect = {
    id: true,
    name: true,
    slug: true,
    images: true,
    brand: true,
    priceCadCents: true,
    priceUsdCents: true,
    saleCadCents: true,
    saleUsdCents: true,
    isNewArrival: true,
    isBestSeller: true,
    hasVariants: true,
    stock: true,
    status: true,
  } as const;

  type CardRow = RelatedProductCard & { status: string };

  const toActive = (items: CardRow[]) =>
    items.filter((p) => p.status === "ACTIVE").map(({ status: _, ...rest }) => rest);

  const addProducts = (items: RelatedProductCard[]) => {
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      results.push(item);
      if (results.length >= MAX_RELATED) return;
    }
  };

  const manual = await prisma.relatedProduct.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    include: {
      relatedProduct: { select: cardSelect },
    },
  });
  addProducts(toActive(manual.map((r) => r.relatedProduct)));
  if (results.length >= MAX_RELATED) return results;

  if (product.seriesId) {
    const seriesProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        seriesId: product.seriesId,
        id: { notIn: [...seen] },
      },
      take: MAX_RELATED - results.length,
      select: cardSelect,
    });
    addProducts(seriesProducts);
    if (results.length >= MAX_RELATED) return results;
  }

  const compatible = await prisma.compatibleProduct.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    include: {
      compatibleProduct: { select: cardSelect },
    },
  });
  addProducts(toActive(compatible.map((c) => c.compatibleProduct)));
  if (results.length >= MAX_RELATED) return results;

  const categoryIds = product.categories.map((c) => c.categoryId);
  if (categoryIds.length > 0) {
    const categoryProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: [...seen] },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      take: MAX_RELATED - results.length,
      orderBy: { name: "asc" },
      select: cardSelect,
    });
    addProducts(categoryProducts);
  }

  return results.length >= MIN_RELATED ? results : [];
}
