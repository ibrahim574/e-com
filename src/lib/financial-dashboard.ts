import { cacheGet, cacheSet } from "./cache";
import { prisma } from "./prisma";
import { PAID_STATUSES } from "./order-status";

export type DateRange = { from: Date; to: Date };

export type FinancialKpis = {
  salesCount: number;
  revenueCents: number;
  shippingRevenueCents: number;
  taxCollectedCents: number;
  refundsCents: number;
  unpaidCount: number;
  statusBreakdown: Record<string, number>;
  salesChangePct: number;
  revenueChangePct: number;
  shippingChangePct: number;
  taxChangePct: number;
  refundsChangePct: number;
};

function periodLengthMs(range: DateRange) {
  return range.to.getTime() - range.from.getTime();
}

function priorRange(range: DateRange): DateRange {
  const len = periodLengthMs(range);
  return {
    from: new Date(range.from.getTime() - len),
    to: new Date(range.from.getTime()),
  };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function aggregatePeriod(range: DateRange) {
  const [orders, refunds, statusGroups, unpaidCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: PAID_STATUSES },
        deletedAt: null,
      },
      select: {
        totalCents: true,
        shippingCents: true,
        taxCents: true,
      },
    }),
    prisma.refund.aggregate({
      where: { refundDate: { gte: range.from, lte: range.to } },
      _sum: { amountCents: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: range.from, lte: range.to },
        deletedAt: null,
      },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: "PENDING",
        deletedAt: null,
      },
    }),
  ]);

  const revenueCents = orders.reduce((s, o) => s + o.totalCents, 0);
  const shippingRevenueCents = orders.reduce((s, o) => s + o.shippingCents, 0);
  const taxCollectedCents = orders.reduce((s, o) => s + o.taxCents, 0);

  const statusBreakdown: Record<string, number> = {};
  for (const g of statusGroups) {
    statusBreakdown[g.status] = g._count._all;
  }

  return {
    salesCount: orders.length,
    revenueCents,
    shippingRevenueCents,
    taxCollectedCents,
    refundsCents: refunds._sum.amountCents ?? 0,
    unpaidCount,
    statusBreakdown,
  };
}

export async function getFinancialKpis(range: DateRange): Promise<FinancialKpis> {
  const cacheKey = `financial-kpis-${range.from.toISOString()}-${range.to.toISOString()}`;
  const cached = cacheGet<FinancialKpis>(cacheKey);
  if (cached) return cached;

  const prior = priorRange(range);
  const [current, previous] = await Promise.all([
    aggregatePeriod(range),
    aggregatePeriod(prior),
  ]);

  const kpis: FinancialKpis = {
    ...current,
    salesChangePct: pctChange(current.salesCount, previous.salesCount),
    revenueChangePct: pctChange(current.revenueCents, previous.revenueCents),
    shippingChangePct: pctChange(
      current.shippingRevenueCents,
      previous.shippingRevenueCents,
    ),
    taxChangePct: pctChange(current.taxCollectedCents, previous.taxCollectedCents),
    refundsChangePct: pctChange(current.refundsCents, previous.refundsCents),
  };

  cacheSet(cacheKey, kpis, 15 * 60 * 1000);
  return kpis;
}

export type ChartPoint = { label: string; value: number };

export async function getMonthlyRevenueChart(
  year: number,
  metric: "revenue" | "orders" | "refunds" | "tax",
): Promise<ChartPoint[]> {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const points: ChartPoint[] = [];

  for (const month of months) {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59);
    const label = from.toLocaleString("en", { month: "short" });

    if (metric === "refunds") {
      const agg = await prisma.refund.aggregate({
        where: { refundDate: { gte: from, lte: to } },
        _sum: { amountCents: true },
      });
      points.push({ label, value: (agg._sum.amountCents ?? 0) / 100 });
    } else {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: PAID_STATUSES },
          deletedAt: null,
        },
        select: { totalCents: true, taxCents: true },
      });
      let value = 0;
      if (metric === "orders") value = orders.length;
      else if (metric === "tax")
        value = orders.reduce((s, o) => s + o.taxCents, 0) / 100;
      else value = orders.reduce((s, o) => s + o.totalCents, 0) / 100;
      points.push({ label, value });
    }
  }

  return points;
}

export async function getYearlyRevenueChart(
  metric: "revenue" | "orders" | "refunds" | "tax",
): Promise<ChartPoint[]> {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const points: ChartPoint[] = [];

  for (const year of years) {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    if (metric === "refunds") {
      const agg = await prisma.refund.aggregate({
        where: { refundDate: { gte: from, lte: to } },
        _sum: { amountCents: true },
      });
      points.push({ label: String(year), value: (agg._sum.amountCents ?? 0) / 100 });
    } else {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: PAID_STATUSES },
          deletedAt: null,
        },
        select: { totalCents: true, taxCents: true },
      });
      let value = 0;
      if (metric === "orders") value = orders.length;
      else if (metric === "tax")
        value = orders.reduce((s, o) => s + o.taxCents, 0) / 100;
      else value = orders.reduce((s, o) => s + o.totalCents, 0) / 100;
      points.push({ label: String(year), value });
    }
  }

  return points;
}
