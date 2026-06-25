"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  bulkDeleteProductsAction,
  bulkSetProductStatusAction,
  deleteProductAction,
} from "@/app/actions/admin";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  images: string[];
  priceCadCents: number;
  priceUsdCents: number;
  stock: number;
  hasVariants: boolean;
  variants: Array<{ stock: number }>;
};

export function ProductsAdminList({
  products,
  dualCurrency,
}: {
  products: Product[];
  dualCurrency: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  function stockLabel(product: Product) {
    if (product.hasVariants) {
      const total = product.variants.reduce((sum, v) => sum + v.stock, 0);
      return { quantity: total, hint: "across variants" };
    }
    return { quantity: product.stock, hint: null };
  }

  async function runBulk(
    action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>,
    extra?: Record<string, string>,
  ) {
    const fd = new FormData();
    for (const id of selected) fd.append("productIds", id);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    await action(fd);
    setSelected(new Set());
    showToast("Bulk action completed.");
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button type="button" size="sm" variant="outline" onClick={() => runBulk(bulkSetProductStatusAction, { status: "ACTIVE" })}>
            Publish
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => runBulk(bulkSetProductStatusAction, { status: "DRAFT" })}>
            Unpublish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-600"
            onClick={() => {
              if (confirm("Delete selected products?")) runBulk(bulkDeleteProductsAction);
            }}
          >
            Delete
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3 w-16">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">CAD</th>
              {dualCurrency && <th className="px-4 py-3">USD</th>}
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const { quantity, hint } = stockLabel(product);
              return (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(product.id)) next.delete(product.id);
                          else next.add(product.id);
                          return next;
                        });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <Image
                        src={product.images[0] ?? "/placeholder-product.svg"}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{product.status.toLowerCase()}</td>
                  <td className="px-4 py-3">{formatPrice(product.priceCadCents, "CAD")}</td>
                  {dualCurrency && (
                    <td className="px-4 py-3">{formatPrice(product.priceUsdCents, "USD")}</td>
                  )}
                  <td className="px-4 py-3">
                    {quantity}
                    {hint && <span className="ml-1 text-xs text-slate-400">({hint})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
