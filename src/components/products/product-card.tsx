import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getProductPrice, type Currency } from "@/lib/currency";
import { QuickAddButton } from "./quick-add-button";

type ProductCardProps = {
  product: {
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
  };
  currency: Currency;
};

export function ProductCard({ product, currency }: ProductCardProps) {
  const pricing = getProductPrice(product, currency);
  const image = product.images[0] ?? "/placeholder-product.svg";
  const savings = pricing.onSale
    ? pricing.priceCents - pricing.currentCents
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-[#f8fafc]">
        <Image
          src={image}
          alt={product.name}
          fill
          loading="lazy"
          className="object-contain p-5 transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNewArrival && (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900">
              Best Seller
            </span>
          )}
          {pricing.onSale && (
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Save {formatPrice(savings, currency)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {product.brand}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900">
          <Link href={`/products/${product.slug}`} className="before:absolute before:inset-0">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
          <span className="ml-1 text-xs font-medium text-slate-400">(5.0)</span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          {pricing.onSale ? (
            <>
              <span className="text-xl font-extrabold text-blue-600">
                {formatPrice(pricing.currentCents, currency)}
              </span>
              <span className="pb-0.5 text-sm text-slate-400 line-through">
                {formatPrice(pricing.priceCents, currency)}
              </span>
            </>
          ) : (
            <span className="text-xl font-extrabold text-slate-900">
              {product.hasVariants && (
                <span className="text-sm font-semibold text-slate-400">From </span>
              )}
              {formatPrice(pricing.currentCents, currency)}
            </span>
          )}
        </div>

        <div className="mt-4">
          <QuickAddButton
            productId={product.id}
            slug={product.slug}
            hasVariants={product.hasVariants}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}
