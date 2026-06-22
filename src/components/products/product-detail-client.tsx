"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Star,
  Check,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  Headphones,
  Radio,
} from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";
import { formatPrice } from "@/lib/utils";
import {
  getProductPrice,
  getVariantPrice,
  type Currency,
} from "@/lib/currency";

type Variant = {
  id: string;
  sku: string;
  stock: number;
  image?: string | null;
  priceCadCents?: number | null;
  priceUsdCents?: number | null;
  saleCadCents?: number | null;
  saleUsdCents?: number | null;
  options: Array<{
    optionValue: { id: string; value: string; option: { id: string; name: string } };
  }>;
};

type Option = {
  id: string;
  name: string;
  values: Array<{ id: string; value: string }>;
};

type Review = {
  id: string;
  author: string;
  content: string;
  rating: number;
};

type ProductDetailClientProps = {
  product: {
    id: string;
    name: string;
    brand?: string | null;
    description: string;
    shortDescription?: string | null;
    specifications?: string | null;
    images: string[];
    hasVariants: boolean;
    priceCadCents: number;
    priceUsdCents: number;
    saleCadCents?: number | null;
    saleUsdCents?: number | null;
  };
  options: Option[];
  variants: Variant[];
  reviews: Review[];
  currency: Currency;
};

type TabKey = "details" | "specs" | "reviews";

export function ProductDetailClient({
  product,
  options,
  variants,
  reviews,
  currency,
}: ProductDetailClientProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<TabKey>("details");

  const selectedVariant = useMemo(() => {
    if (!product.hasVariants || !variants.length) return null;
    return (
      variants.find((variant) =>
        variant.options.every(
          (o) => selectedValues[o.optionValue.option.id] === o.optionValue.id,
        ),
      ) ?? null
    );
  }, [product.hasVariants, variants, selectedValues]);

  const pricing = selectedVariant
    ? getVariantPrice(selectedVariant, product, currency)
    : getProductPrice(product, currency);

  const images = product.images.length
    ? product.images
    : ["/placeholder-product.svg"];
  const image = selectedVariant?.image ?? images[activeImage] ?? images[0];

  const allOptionsChosen =
    !product.hasVariants || options.every((o) => selectedValues[o.id]);
  const inStock = selectedVariant ? selectedVariant.stock > 0 : true;
  const canAdd = allOptionsChosen && inStock && (!product.hasVariants || selectedVariant);

  const specRows = useMemo(() => {
    if (!product.specifications) return [];
    return product.specifications
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return { label: line, value: "" };
        return {
          label: line.slice(0, idx).trim(),
          value: line.slice(idx + 1).trim(),
        };
      });
  }, [product.specifications]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 5;

  async function handleAddToCart() {
    setPending(true);
    const formData = new FormData();
    formData.set("productId", product.id);
    if (selectedVariant) formData.set("variantId", selectedVariant.id);
    formData.set("quantity", String(quantity));
    await addToCartAction(formData);
    setPending(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "details", label: "Product Details", show: true },
    { key: "specs", label: "Specifications", show: specRows.length > 0 },
    { key: "reviews", label: `Reviews (${reviews.length})`, show: true },
  ];

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-contain p-8"
              priority
            />
            {pricing.onSale && (
              <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Sale
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border bg-white transition ${
                    activeImage === i
                      ? "border-red-500 ring-2 ring-red-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          {product.brand && (
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">
              {product.brand}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : "fill-slate-200 text-slate-200"}`}
                />
              ))}
            </div>
            <span className="text-sm text-slate-500">
              {avgRating.toFixed(1)} ({reviews.length} review
              {reviews.length === 1 ? "" : "s"})
            </span>
          </div>

          {product.shortDescription && (
            <p className="mt-4 leading-relaxed text-slate-600">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-5 flex items-end gap-3">
            <span className="text-4xl font-extrabold text-slate-900">
              {formatPrice(pricing.currentCents, currency)}
            </span>
            {pricing.onSale && (
              <>
                <span className="pb-1 text-xl text-slate-400 line-through">
                  {formatPrice(pricing.priceCents, currency)}
                </span>
                <span className="mb-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  Save {formatPrice(pricing.priceCents - pricing.currentCents, currency)}
                </span>
              </>
            )}
            <span className="mb-1 text-sm font-medium text-slate-400">
              {currency}
            </span>
          </div>

          <div className="my-6 h-px bg-slate-200" />

          {/* Option groups */}
          <div className="space-y-5">
            {options.map((option) => (
              <div key={option.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {option.name}:
                  </span>
                  <span className="text-sm text-slate-500">
                    {option.values.find((v) => v.id === selectedValues[option.id])
                      ?.value ?? "Select an option"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const active = selectedValues[option.id] === value.id;
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() =>
                          setSelectedValues((prev) => ({
                            ...prev,
                            [option.id]: value.id,
                          }))
                        }
                        className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "border-red-600 bg-red-50 text-red-700"
                            : "border-slate-200 text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {value.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 w-fit items-center rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid h-full w-11 place-items-center text-slate-500 hover:text-slate-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(selectedVariant?.stock ?? 99, q + 1),
                  )
                }
                className="grid h-full w-11 place-items-center text-slate-500 hover:text-slate-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd || pending}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                added ? "bg-green-600" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Added to Cart
                </>
              ) : pending ? (
                "Adding..."
              ) : !allOptionsChosen ? (
                "Select Options Above"
              ) : !inStock ? (
                "Out of Stock"
              ) : (
                "Add to Cart"
              )}
            </button>
          </div>

          {selectedVariant && (
            <p className="mt-3 text-sm text-slate-500">
              SKU: <span className="font-medium text-slate-700">{selectedVariant.sku}</span>
              {selectedVariant.stock > 0 ? (
                <span className="ml-3 inline-flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> In stock
                </span>
              ) : (
                <span className="ml-3 text-red-600">Out of stock</span>
              )}
            </p>
          )}

          {/* Trust row */}
          <div className="mt-7 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            {[
              { icon: Truck, label: "Fast Shipping" },
              { icon: ShieldCheck, label: "1-Yr Warranty" },
              { icon: Headphones, label: "Expert Support" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5">
                <t.icon className="h-5 w-5 text-red-600" />
                <span className="text-xs font-medium text-slate-600">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-5 py-3 text-sm font-bold transition ${
                  tab === t.key
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        <div className="py-8">
          {tab === "details" && (
            <div className="prose-store max-w-3xl whitespace-pre-line text-[15px] leading-7">
              {product.description}
            </div>
          )}

          {tab === "specs" && (
            <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  {specRows.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="w-1/3 px-5 py-3 font-semibold text-slate-900">
                        {row.label}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "reviews" && (
            <div className="max-w-3xl">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-12 text-center">
                  <Radio className="h-8 w-8 text-slate-300" />
                  <p className="text-slate-500">No reviews yet for this product.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <figure
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-2 flex gap-1 text-amber-400">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <blockquote className="text-slate-700">
                        &ldquo;{review.content}&rdquo;
                      </blockquote>
                      <figcaption className="mt-3 text-sm font-semibold text-slate-900">
                        — {review.author}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
