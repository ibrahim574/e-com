"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import type { FinancialKpis, ChartPoint } from "@/lib/financial-dashboard";

type FinancialDashboardProps = {
  kpis: FinancialKpis;
  monthlyChart: ChartPoint[];
  yearlyChart: ChartPoint[];
  currency: "CAD" | "USD";
};

function ChangeBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}
    >
      {positive ? "+" : ""}
      {pct}% vs prior period
    </span>
  );
}

export function FinancialDashboard({
  kpis,
  monthlyChart,
  yearlyChart,
  currency,
}: FinancialDashboardProps) {
  const [metric, setMetric] = useState<"revenue" | "orders" | "refunds" | "tax">(
    "revenue",
  );

  const kpiCards = [
    {
      label: "Total Sales",
      value: String(kpis.salesCount),
      change: kpis.salesChangePct,
    },
    {
      label: "Total Revenue",
      value: formatPrice(kpis.revenueCents, currency),
      change: kpis.revenueChangePct,
    },
    {
      label: "Shipping Revenue",
      value: formatPrice(kpis.shippingRevenueCents, currency),
      change: kpis.shippingChangePct,
    },
    {
      label: "Tax Collected",
      value: formatPrice(kpis.taxCollectedCents, currency),
      change: kpis.taxChangePct,
    },
    {
      label: "Refunds Issued",
      value: formatPrice(kpis.refundsCents, currency),
      change: kpis.refundsChangePct,
    },
    {
      label: "Unpaid Orders",
      value: String(kpis.unpaidCount),
      change: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
            {card.change !== 0 && <ChangeBadge pct={card.change} />}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["revenue", "orders", "refunds", "tax"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              metric === m
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Monthly ({metric})</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Yearly ({metric})</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
