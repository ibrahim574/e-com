import { describe, expect, it } from "vitest";
import type { ShippingLineItem } from "./shipping";

function totalShippableWeightGrams(items: ShippingLineItem[]): number {
  const DEFAULT_WEIGHT_GRAMS = 500;
  return items.reduce((sum, item) => {
    if (!item.shippingEnabled) return sum;
    const perUnit = item.weightGrams ?? DEFAULT_WEIGHT_GRAMS;
    return sum + perUnit * item.quantity;
  }, 0);
}

describe("shipping weight helpers", () => {
  it("sums enabled line weights with default fallback", () => {
    const grams = totalShippableWeightGrams([
      { quantity: 2, weightGrams: 300, shippingEnabled: true, shippingClassSurchargeCents: 0 },
      { quantity: 1, weightGrams: null, shippingEnabled: true, shippingClassSurchargeCents: 0 },
      { quantity: 5, weightGrams: 100, shippingEnabled: false, shippingClassSurchargeCents: 0 },
    ]);
    expect(grams).toBe(1100);
  });
});
