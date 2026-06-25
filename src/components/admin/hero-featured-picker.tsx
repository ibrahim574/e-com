"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import {
  addHeroFeaturedProductAction,
  moveHeroFeaturedProductAction,
  removeHeroFeaturedProductAction,
} from "@/app/actions/hero-featured";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type FeaturedEntry = {
  id: string;
  position: number;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    status: string;
    images: string[];
  };
};

type AvailableProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
};

export function HeroFeaturedPicker({
  featured,
  availableProducts,
}: {
  featured: FeaturedEntry[];
  availableProducts: AvailableProduct[];
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableProducts;
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false),
    );
  }, [availableProducts, search]);

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 className="text-lg font-bold dark:text-white">Homepage hero featured products</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Products shown in the featured card on the right side of the homepage hero.
          Auto-slideshow activates when more than 2 products are featured.
        </p>
      </div>

      <ActionForm action={addHeroFeaturedProductAction} successMessage="Product added to hero panel.">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="hero-featured-search">Search products</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="hero-featured-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, slug, or brand..."
                className="pl-9"
              />
            </div>
            <Label htmlFor="hero-featured-product" className="mt-3 block">
              Product to add
            </Label>
            <select
              id="hero-featured-product"
              name="productId"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            >
              <option value="">Select a product...</option>
              {filtered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.brand ? ` (${p.brand})` : ""}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={!selectedId && filtered.length === 0}>
            Add to hero panel
          </Button>
        </div>
      </ActionForm>

      {featured.length === 0 ? (
        <p className="text-sm text-slate-500">No products featured yet. Add one above.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 w-14">Image</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 w-24">Order</th>
                <th className="px-4 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((entry, index) => (
                <tr key={entry.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700">
                      <Image
                        src={entry.product.images[0] ?? "/placeholder-product.svg"}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{entry.product.name}</p>
                    <p className="text-xs text-slate-500">{entry.product.slug}</p>
                    {entry.product.status !== "ACTIVE" && (
                      <p className="text-xs text-amber-600">Draft — hidden on storefront</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <ActionForm action={moveHeroFeaturedProductAction} successMessage="Order updated.">
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </ActionForm>
                      <ActionForm action={moveHeroFeaturedProductAction} successMessage="Order updated.">
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={index === featured.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </ActionForm>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ActionForm
                      action={removeHeroFeaturedProductAction}
                      successMessage="Product removed from hero panel."
                    >
                      <input type="hidden" name="id" value={entry.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
