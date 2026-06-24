"use server";

import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";
import { getShippingCentsForCountry } from "@/lib/shipping";

export async function previewTaxAction(input: {
  subtotalCents: number;
  country: string;
  province?: string;
  currency: "CAD" | "USD";
}) {
  const shippingCents = await getShippingCentsForCountry(
    input.subtotalCents,
    input.country,
    input.currency,
  );
  const rules = await resolveTaxRules(input.country, input.province);
  const tax = calcOrderTax(input.subtotalCents, shippingCents, rules);
  const totalCents = input.subtotalCents + shippingCents + tax.taxCents;

  return {
    shippingCents,
    taxCents: tax.taxCents,
    taxLabel: tax.taxLabel,
    taxRatePercent: tax.taxRatePercent,
    totalCents,
  };
}
