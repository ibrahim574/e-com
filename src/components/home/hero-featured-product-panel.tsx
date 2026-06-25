"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/products/product-image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Radio, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeroFeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  shortDescription: string | null;
  images: string[];
};

const FALLBACK: HeroFeaturedProduct = {
  id: "fallback",
  name: "Hytera PDC680 Dual-Mode Radio",
  slug: "hytera-pdc680-dual-mode-radio",
  brand: null,
  shortDescription:
    'All-in-one LTE & DMR terminal with a 3.6" touchscreen, AI noise cancellation, and nationwide push-to-talk.',
  images: [],
};

function ProductCard({ product }: { product: HeroFeaturedProduct }) {
  const image = product.images[0];
  const subtitle = product.brand ?? "Nationwide PoC";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          <Star className="h-3 w-3 fill-current" /> Featured
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</span>
      </div>
      <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        {image ? (
          <ProductImage
            src={image}
            alt={product.name}
            fill
            priority
            className="object-contain p-2 sm:p-4"
            sizes="(max-width: 768px) 90vw, 400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Radio className="h-32 w-32 text-blue-500 sm:h-40 sm:w-40" strokeWidth={1.2} />
          </div>
        )}
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">{product.name}</h3>
      {product.shortDescription && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {product.shortDescription}
        </p>
      )}
      <Button className="mt-5 w-full" asChild>
        <Link href={`/products/${product.slug}`}>View Product</Link>
      </Button>
    </div>
  );
}

export function HeroFeaturedProductPanel({ products }: { products: HeroFeaturedProduct[] }) {
  const items = products.length > 0 ? products : [FALLBACK];
  const [index, setIndex] = useState(0);
  const count = items.length;
  const autoSlide = count > 2;
  const showControls = count > 1;

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (!autoSlide) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoSlide, count]);

  function prev() {
    setIndex((i) => (i - 1 + count) % count);
  }

  function next() {
    setIndex((i) => (i + 1) % count);
  }

  return (
    <div className="animate-fade-up [animation-delay:120ms]">
      <div className="relative mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl">
          <div
            className="flex transition-transform duration-700 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((product) => (
              <div key={product.id} className="w-full shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {showControls && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Previous featured product"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-0 top-1/2 z-10 translate-x-2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Next featured product"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="mt-4 flex justify-center gap-2">
              {items.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-6 bg-blue-600" : "w-2 bg-slate-300 dark:bg-slate-600"
                  }`}
                  aria-label={`Go to featured product ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
