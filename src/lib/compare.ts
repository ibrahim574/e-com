import { formatPrice } from "@/lib/utils";
import { getProductPrice, type Currency } from "@/lib/currency";

export const COMPARE_COOKIE = "compare_ids";
export const COMPARE_MAX = 4;
export const COMPARE_EVENT = "compare:change";

export function parseCompareCookie(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, COMPARE_MAX);
}

export type CompareAttribute = {
  id: string;
  label: string;
  source: string;
  key: string;
};

export type CompareProduct = {
  name: string;
  brand: string | null;
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

function parseSpecs(specifications: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!specifications) return map;
  for (const line of specifications.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    map.set(
      trimmed.slice(0, idx).trim().toLowerCase(),
      trimmed.slice(idx + 1).trim(),
    );
  }
  return map;
}

/** Resolves the display value of a comparison attribute for a product. */
export function resolveAttributeValue(
  product: CompareProduct,
  attr: CompareAttribute,
  currency: Currency,
): string {
  if (attr.source === "field") {
    switch (attr.key) {
      case "brand":
        return product.brand ?? "—";
      case "price": {
        const pricing = getProductPrice(product, currency);
        return formatPrice(pricing.currentCents, currency);
      }
      case "availability":
        return product.hasVariants || product.stock > 0
          ? "In stock"
          : "Out of stock";
      case "weight":
        return product.weightGrams ? `${product.weightGrams} g` : "—";
      case "shortDescription":
        return product.shortDescription ?? "—";
      default:
        return "—";
    }
  }
  const specs = parseSpecs(product.specifications);
  return specs.get(attr.key.toLowerCase()) ?? "—";
}

export const COMPARE_FIELD_KEYS: { key: string; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "price", label: "Price" },
  { key: "availability", label: "Availability" },
  { key: "weight", label: "Weight" },
  { key: "shortDescription", label: "Summary" },
];
