import { cache } from "react";
import { prisma } from "./prisma";
import { calcTaxCents } from "./tax";

export type TaxRuleResolved = {
  id: string;
  label: string;
  rate: number;
};

export function normalizeCountry(country: string): string {
  const c = country.trim().toUpperCase();
  if (c === "CANADA" || c === "CA") return "CA";
  if (c === "UNITED STATES" || c === "USA" || c === "US") return "US";
  return c.length === 2 ? c : c.slice(0, 2);
}

export function normalizeProvince(province: string | null | undefined): string | null {
  if (!province?.trim()) return null;
  return province.trim().toUpperCase();
}

export const getTaxRules = cache(async () => {
  return prisma.taxRule.findMany({ where: { isEnabled: true } });
});

export async function resolveTaxRules(
  country: string,
  province?: string | null,
): Promise<TaxRuleResolved[]> {
  const normalizedCountry = normalizeCountry(country);
  const normalizedProvince = normalizeProvince(province);

  const allRules = await getTaxRules();

  let matched = allRules.filter(
    (r) =>
      r.country === normalizedCountry &&
      r.province &&
      normalizeProvince(r.province) === normalizedProvince,
  );

  if (matched.length === 0) {
    matched = allRules.filter(
      (r) => r.country === normalizedCountry && !r.province,
    );
  }

  if (matched.length === 0) {
    matched = allRules.filter((r) => r.isDefault);
  }

  return matched.map((r) => ({ id: r.id, label: r.label, rate: r.rate }));
}

export function calcOrderTax(
  subtotalCents: number,
  shippingCents: number,
  rules: TaxRuleResolved[],
): { taxCents: number; taxLabel: string; taxRatePercent: number } {
  const taxableBase = subtotalCents + shippingCents;
  if (taxableBase <= 0 || rules.length === 0) {
    return { taxCents: 0, taxLabel: "", taxRatePercent: 0 };
  }

  let totalTax = 0;
  let totalRate = 0;
  const labels: string[] = [];

  for (const rule of rules) {
    totalTax += calcTaxCents(taxableBase, rule.rate);
    totalRate += rule.rate;
    const rateStr = Number.isInteger(rule.rate)
      ? rule.rate.toString()
      : rule.rate.toFixed(2).replace(/\.?0+$/, "");
    labels.push(`${rule.label} ${rateStr}%`);
  }

  return {
    taxCents: totalTax,
    taxLabel: labels.join(" + "),
    taxRatePercent: totalRate,
  };
}
