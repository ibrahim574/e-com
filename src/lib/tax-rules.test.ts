import { describe, expect, it } from "vitest";
import { calcOrderTax } from "./tax-rules";

describe("calcOrderTax", () => {
  it("applies HST to subtotal plus shipping", () => {
    const tax = calcOrderTax(10000, 1500, [{ label: "HST", rate: 13 }]);
    expect(tax.taxCents).toBe(1495);
    expect(tax.taxLabel).toBe("HST 13%");
  });

  it("returns zero tax when rate is zero", () => {
    const tax = calcOrderTax(5000, 0, [{ label: "Tax", rate: 0 }]);
    expect(tax.taxCents).toBe(0);
  });
});
