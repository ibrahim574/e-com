import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { LeadsExportButton } from "@/components/admin/leads-export-button";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  QUOTE: "Quote",
  PREORDER: "Pre-order",
  STAY_CONNECTED: "Stay connected",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();
  const { type = "ALL" } = await searchParams;

  const where =
    type !== "ALL"
      ? { type: type as "QUOTE" | "PREORDER" | "STAY_CONNECTED" }
      : undefined;

  const [leads, counts] = await Promise.all([
    prisma.quoteSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.quoteSubmission.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.type, c._count._all]));
  const total = counts.reduce((s, c) => s + c._count._all, 0);

  const filters = [
    { id: "ALL", label: `All (${total})` },
    { id: "STAY_CONNECTED", label: `Stay connected (${countMap.STAY_CONNECTED ?? 0})` },
    { id: "PREORDER", label: `Pre-order (${countMap.PREORDER ?? 0})` },
    { id: "QUOTE", label: `Quote (${countMap.QUOTE ?? 0})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leads</h1>
          <p className="mt-1 text-slate-600">Quote, pre-order, and stay-connected submissions</p>
        </div>
        <LeadsExportButton type={type} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={f.id === "ALL" ? "/admin/leads" : `/admin/leads?type=${f.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              type === f.id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Contact</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Product / interest</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Qty</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {lead.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {TYPE_LABELS[lead.type] ?? lead.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-slate-600">{lead.email}</p>
                    {lead.phone && <p className="text-slate-500">{lead.phone}</p>}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-700">
                    {lead.productInterest ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.quantity ?? "—"}</td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">
                    <p className="line-clamp-3 whitespace-pre-wrap">{lead.notes ?? "—"}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
