import { cache } from "react";
import { prisma } from "./prisma";
import {
  FREE_SHIPPING_THRESHOLD_CAD_CENTS,
  FREE_SHIPPING_THRESHOLD_USD_CENTS,
  SHIPPING_FLAT_RATE_CAD_CENTS,
  SHIPPING_FLAT_RATE_USD_CENTS,
} from "./constants";
import { normalizeCountry } from "./tax-rules";

export type ShippingRegionData = {
  country: string;
  freeShippingEnabled: boolean;
  thresholdCents: number;
  flatRateCents: number;
  displayMessage: string | null;
};

export const getShippingRegions = cache(async (): Promise<ShippingRegionData[]> => {
  try {
    return await prisma.shippingRegion.findMany({
      orderBy: { country: "asc" },
    });
  } catch {
    return [
      {
        country: "CA",
        freeShippingEnabled: true,
        thresholdCents: FREE_SHIPPING_THRESHOLD_CAD_CENTS,
        flatRateCents: SHIPPING_FLAT_RATE_CAD_CENTS,
        displayMessage: null,
      },
      {
        country: "US",
        freeShippingEnabled: true,
        thresholdCents: FREE_SHIPPING_THRESHOLD_USD_CENTS,
        flatRateCents: SHIPPING_FLAT_RATE_USD_CENTS,
        displayMessage: null,
      },
    ];
  }
});

function fallbackShippingCents(
  subtotalCents: number,
  currency: "CAD" | "USD",
): number {
  const threshold =
    currency === "CAD"
      ? FREE_SHIPPING_THRESHOLD_CAD_CENTS
      : FREE_SHIPPING_THRESHOLD_USD_CENTS;
  const flatRate =
    currency === "CAD"
      ? SHIPPING_FLAT_RATE_CAD_CENTS
      : SHIPPING_FLAT_RATE_USD_CENTS;
  return subtotalCents >= threshold ? 0 : flatRate;
}

export async function getShippingCentsForCountry(
  subtotalCents: number,
  country: string,
  currency: "CAD" | "USD",
): Promise<number> {
  const normalized = normalizeCountry(country);

  try {
    const region = await prisma.shippingRegion.findUnique({
      where: { country: normalized },
    });

    if (!region) {
      return fallbackShippingCents(subtotalCents, currency);
    }

    if (!region.freeShippingEnabled) {
      return region.flatRateCents;
    }

    return subtotalCents >= region.thresholdCents ? 0 : region.flatRateCents;
  } catch {
    return fallbackShippingCents(subtotalCents, currency);
  }
}

export async function getFreeShippingMessage(): Promise<string | null> {
  const regions = await getShippingRegions();
  const enabled = regions.filter((r) => r.freeShippingEnabled);
  if (enabled.length === 0) return null;

  const custom = enabled.map((r) => r.displayMessage).filter(Boolean);
  if (custom.length > 0) return custom.join(" ");

  return "Free shipping available on eligible orders and products.";
}
