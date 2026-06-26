"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { useCompare } from "./compare-context";
import {
  resolveAttributeValue,
  type CompareAttribute,
} from "@/lib/compare";
import type { Currency } from "@/lib/currency";

export type CompareProductData = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  images: string[];
  shortDescription: string | null;
  specifications: string | null;
  stock: number;
  hasVariants: boolean;
  weightGrams: number | null;
  priceCadCents: number;
  priceUsdCents: number;
  saleCadCents: number | null;
  saleUsdCents: number | null;
};

export function CompareView({
  products,
  attributes,
  currency,
}: {
  products: CompareProductData[];
  attributes: CompareAttribute[];
  currency: Currency;
}) {
  const { ids, remove } = useCompare();
  const visible = products.filter((p) => ids.includes(p.id));

  if (visible.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">
          You haven&apos;t selected any products to compare yet.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/search">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-40 bg-white p-3 text-left align-bottom dark:bg-slate-950" />
            {visible.map((p) => {
              const image = p.images[0] ?? "/placeholder-product.svg";
              return (
                <th key={p.id} className="min-w-[200px] p-3 align-top">
                  <div className="relative rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative mx-auto h-28 w-28">
                      <ProductImage
                        src={image}
                        alt={p.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="mt-2 block text-center font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100"
                    >
                      {p.name}
                    </Link>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {attributes.length === 0 ? (
            <tr>
              <td
                colSpan={visible.length + 1}
                className="p-6 text-center text-slate-500"
              >
                No comparison attributes have been configured yet.
              </td>
            </tr>
          ) : (
            attributes.map((attr, rowIdx) => (
              <tr
                key={attr.id}
                className={rowIdx % 2 === 0 ? "bg-slate-50/60 dark:bg-slate-900/40" : ""}
              >
                <td className="sticky left-0 z-10 bg-inherit p-3 font-semibold text-slate-700 dark:text-slate-200">
                  {attr.label}
                </td>
                {visible.map((p) => (
                  <td
                    key={p.id}
                    className="p-3 text-center text-slate-700 dark:text-slate-300"
                  >
                    {resolveAttributeValue(p, attr, currency)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
