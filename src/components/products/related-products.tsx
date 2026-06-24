import { ProductCard } from "@/components/products/product-card";
import type { Currency } from "@/lib/currency";

type RelatedProductsProps = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    images: string[];
    brand?: string | null;
    priceCadCents: number;
    priceUsdCents: number;
    saleCadCents?: number | null;
    saleUsdCents?: number | null;
    isNewArrival: boolean;
    isBestSeller: boolean;
    hasVariants: boolean;
    stock: number;
  }>;
  currency: Currency;
};

export function RelatedProducts({ products, currency }: RelatedProductsProps) {
  if (products.length < 2) return null;

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <h2 className="text-2xl font-bold text-slate-900">You May Also Like</h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible">
        {products.map((product) => (
          <div key={product.id} className="min-w-[240px] shrink-0 snap-start lg:min-w-0">
            <ProductCard product={product} currency={currency} />
          </div>
        ))}
      </div>
    </section>
  );
}
