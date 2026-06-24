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

export type ShippingLineItem = {
  quantity: number;
  weightGrams: number | null;
  shippingEnabled: boolean;
  shippingClassSurchargeCents: number;
};

const DEFAULT_WEIGHT_GRAMS = 500;

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

async function getRegionShippingCents(
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

function totalShippableWeightGrams(items: ShippingLineItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.shippingEnabled) return sum;
    const perUnit = item.weightGrams ?? DEFAULT_WEIGHT_GRAMS;
    return sum + perUnit * item.quantity;
  }, 0);
}

function totalClassSurchargeCents(items: ShippingLineItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.shippingEnabled) return sum;
    return sum + item.shippingClassSurchargeCents * item.quantity;
  }, 0);
}

async function getZoneShippingCents(
  subtotalCents: number,
  country: string,
  province: string | null,
  items: ShippingLineItem[],
): Promise<number | null> {
  try {
    const normalized = normalizeCountry(country);
    const provinceCode = province?.trim().toUpperCase() ?? "";

    const zones = await prisma.shippingZone.findMany({
      where: { country: normalized, isEnabled: true },
      orderBy: { createdAt: "asc" },
    });

    const zone =
      zones.find(
        (z) =>
          z.provinces.length === 0 ||
          (provinceCode && z.provinces.map((p) => p.toUpperCase()).includes(provinceCode)),
      ) ?? zones[0];

    if (!zone) return null;

    const weightKg = Math.ceil(totalShippableWeightGrams(items) / 1000);
    let cost = zone.baseCostCents + weightKg * zone.costPerKgCents;
    cost += totalClassSurchargeCents(items);

    if (zone.freeThresholdCents != null && subtotalCents >= zone.freeThresholdCents) {
      return 0;
    }

    return cost;
  } catch {
    return null;
  }
}

export async function calculateShippingCents(params: {
  subtotalCents: number;
  country: string;
  province?: string | null;
  currency: "CAD" | "USD";
  items?: ShippingLineItem[];
}): Promise<number> {
  const items = params.items ?? [];
  const hasProductShipping = items.some((i) => i.shippingEnabled && i.weightGrams != null);

  if (hasProductShipping) {
    const zoneCost = await getZoneShippingCents(
      params.subtotalCents,
      params.country,
      params.province ?? null,
      items,
    );
    if (zoneCost != null) return zoneCost;
  }

  return getRegionShippingCents(params.subtotalCents, params.country, params.currency);
}

export async function getShippingCentsForCountry(
  subtotalCents: number,
  country: string,
  currency: "CAD" | "USD",
  province?: string | null,
  items?: ShippingLineItem[],
): Promise<number> {
  return calculateShippingCents({
    subtotalCents,
    country,
    province,
    currency,
    items,
  });
}

export async function getFreeShippingMessage(): Promise<string | null> {
  const regions = await getShippingRegions();
  const enabled = regions.filter((r) => r.freeShippingEnabled);
  if (enabled.length === 0) return null;

  const custom = enabled.map((r) => r.displayMessage).filter(Boolean);
  if (custom.length > 0) return custom.join(" ");

  return "Free shipping available on eligible orders and products.";
}

export type ShipmentBreakdown = {
  zoneName: string | null;
  totalWeightGrams: number;
  shippingClassSummary: string;
  destination: string;
};

export async function getShipmentBreakdown(order: {
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  items: Array<{
    quantity: number;
    productName: string;
    product?: {
      weightGrams: number | null;
      shippingEnabled: boolean;
      shippingClass?: { name: string; surchargeCents: number } | null;
    } | null;
    variant?: {
      weightGrams: number | null;
      shippingEnabled: boolean;
      shippingClass?: { name: string; surchargeCents: number } | null;
    } | null;
  }>;
}): Promise<ShipmentBreakdown> {
  const lineItems: ShippingLineItem[] = order.items.map((item) => {
    const src = item.variant ?? item.product;
    return {
      quantity: item.quantity,
      weightGrams: src?.weightGrams ?? null,
      shippingEnabled: src?.shippingEnabled ?? true,
      shippingClassSurchargeCents: src?.shippingClass?.surchargeCents ?? 0,
    };
  });

  const totalWeightGrams = totalShippableWeightGrams(lineItems);
  const classNames = new Set<string>();
  for (const item of order.items) {
    const cls = item.variant?.shippingClass ?? item.product?.shippingClass;
    if (cls?.name) classNames.add(cls.name);
  }

  let zoneName: string | null = null;
  try {
    const normalized = normalizeCountry(order.shippingCountry);
    const provinceCode = order.shippingState.trim().toUpperCase();
    const zones = await prisma.shippingZone.findMany({
      where: { country: normalized, isEnabled: true },
    });
    const zone =
      zones.find(
        (z) =>
          z.provinces.length === 0 ||
          (provinceCode && z.provinces.map((p) => p.toUpperCase()).includes(provinceCode)),
      ) ?? zones[0];
    zoneName = zone?.name ?? null;
  } catch {
    zoneName = null;
  }

  return {
    zoneName,
    totalWeightGrams,
    shippingClassSummary: classNames.size ? [...classNames].join(", ") : "Standard",
    destination: `${order.shippingCity}, ${order.shippingState} ${order.shippingCountry}`,
  };
}
