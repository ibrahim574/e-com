"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, SlidersHorizontal } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart";

export function QuickAddButton({
  productId,
  slug,
  hasVariants,
}: {
  productId: string;
  slug: string;
  hasVariants: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  if (hasVariants) {
    return (
      <Link
        href={`/products/${slug}`}
        className="relative z-10 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Select Options
      </Link>
    );
  }

  function handleAdd() {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("quantity", "1");
    startTransition(async () => {
      await addToCartAction(formData);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 1800);
    });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={pending}
      className={`relative z-10 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-70 ${
        added ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : pending ? (
        "Adding..."
      ) : (
        <>
          <Plus className="h-4 w-4" /> Add to Cart
        </>
      )}
    </button>
  );
}
