"use client";

import { useState, useTransition } from "react";
import { searchProductsForOrderAction, addOrderItemAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type SearchResult = Awaited<ReturnType<typeof searchProductsForOrderAction>>[number];

export function AddOrderItemForm({
  orderId,
  currency,
}: {
  orderId: string;
  currency: "CAD" | "USD";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchPending, startSearch] = useTransition();
  const [addPending, startAdd] = useTransition();

  function handleSearch() {
    setError(null);
    startSearch(async () => {
      const found = await searchProductsForOrderAction(query);
      setResults(found);
      setSelected(null);
      setVariantId("");
    });
  }

  function handleAdd(formData: FormData) {
    setError(null);
    setMessage(null);
    if (!selected) {
      setError("Select a product first.");
      return;
    }
    formData.set("orderId", orderId);
    formData.set("productId", selected.id);
    if (variantId) formData.set("variantId", variantId);
    formData.set("quantity", String(quantity));
    startAdd(async () => {
      const result = await addOrderItemAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Item added.");
      setSelected(null);
      setVariantId("");
      setResults([]);
      setQuery("");
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">Add product</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or SKU"
          className="max-w-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={handleSearch} disabled={searchPending}>
          {searchPending ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(p);
                  setVariantId(p.variants[0]?.id ?? "");
                }}
                className={`w-full rounded px-2 py-1.5 text-left hover:bg-slate-50 ${
                  selected?.id === p.id ? "bg-blue-50 font-medium text-blue-700" : ""
                }`}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <form action={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-3">
          {selected.hasVariants && selected.variants.length > 0 && (
            <div className="sm:col-span-2">
              <Label>Variant</Label>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {selected.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} (stock: {v.stock})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm" disabled={addPending}>
              {addPending ? "Adding..." : `Add to order (${currency})`}
            </Button>
          </div>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
    </div>
  );
}
