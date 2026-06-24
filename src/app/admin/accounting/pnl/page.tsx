import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { getReportPreview } from "@/lib/reports/generate";

export const dynamic = "force-dynamic";

const PRESETS = [
  { id: "ytd", label: "Year to date" },
  { id: "month", label: "This month" },
  { id: "quarter", label: "This quarter" },
] as const;

function presetRange(id: string) {
  const now = new Date();
  if (id === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (id === "quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return { from: new Date(now.getFullYear(), qMonth, 1), to: now };
  }
  return { from: new Date(now.getFullYear(), 0, 1), to: now };
}

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  await requireAdmin();
  const { preset = "ytd" } = await searchParams;
  const range = presetRange(preset);
  const preview = await getReportPreview("pnl", range);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profit &amp; Loss</h1>
        <p className="mt-1 text-slate-600">Revenue, expenses, and net profit for the selected period.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <a
            key={p.id}
            href={`/admin/accounting/pnl?preset=${p.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              preset === p.id ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">{preview.title}</h2>
        <p className="text-sm text-slate-500">
          {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()}
        </p>
        <table className="mt-4 w-full max-w-lg text-sm">
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.Line} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-700">{row.Line}</td>
                <td className="py-2 text-right text-slate-900">{row.Amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/admin/accounting/reports"
        className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Open full reports
      </Link>
    </div>
  );
}
