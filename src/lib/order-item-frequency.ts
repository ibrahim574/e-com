import type { OrderItem } from "@prisma/client";

export function formatItemFrequency(item: {
  selectedFrequency?: string | null;
  txFrequency?: string | null;
  rxFrequency?: string | null;
}): string | null {
  if (item.selectedFrequency?.trim()) {
    return item.selectedFrequency.trim();
  }
  const parts: string[] = [];
  if (item.txFrequency?.trim()) parts.push(`TX: ${item.txFrequency.trim()}`);
  if (item.rxFrequency?.trim()) parts.push(`RX: ${item.rxFrequency.trim()}`);
  return parts.length ? parts.join(" · ") : null;
}

export function formatItemDisplayName(item: {
  productName: string;
  variantLabel?: string | null;
  selectedFrequency?: string | null;
  txFrequency?: string | null;
  rxFrequency?: string | null;
}): string {
  let name = item.variantLabel
    ? `${item.productName} (${item.variantLabel})`
    : item.productName;
  const freq = formatItemFrequency(item);
  if (freq) name += ` — ${freq}`;
  return name;
}

export type OrderItemSnapshot = Pick<
  OrderItem,
  | "productName"
  | "variantLabel"
  | "quantity"
  | "unitPriceCents"
  | "txFrequency"
  | "rxFrequency"
  | "selectedFrequency"
>;
