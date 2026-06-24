export function calcTaxCents(subtotalCents: number, taxRatePercent: number): number {
  if (taxRatePercent <= 0 || subtotalCents <= 0) return 0;
  return Math.round(subtotalCents * (taxRatePercent / 100));
}

export function formatTaxLabel(taxLabel: string, taxRatePercent: number): string {
  const rate = Number.isInteger(taxRatePercent)
    ? taxRatePercent.toString()
    : taxRatePercent.toFixed(2).replace(/\.?0+$/, "");
  return `${taxLabel} (${rate}%)`;
}
