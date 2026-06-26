"use client";

import { useState } from "react";
import { previewReportAction, downloadReportAction } from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const REPORT_TYPES = [
  { id: "sales", label: "Sales Report" },
  { id: "tax", label: "Tax Report" },
  { id: "shipping", label: "Shipping Report" },
  { id: "expenses", label: "Expense Report" },
  { id: "pnl", label: "Profit & Loss" },
  { id: "inventory", label: "Inventory Valuation" },
  { id: "payments", label: "Payment Records" },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);
const yearStartStr = () =>
  new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

export function ReportsClient() {
  const [type, setType] = useState<string>("sales");
  const [from, setFrom] = useState<string>(yearStartStr());
  const [to, setTo] = useState<string>(todayStr());
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: Record<string, string | number>[];
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview(formData: FormData) {
    setLoading(true);
    formData.set("type", type);
    formData.set("from", from);
    formData.set("to", to);
    const result = await previewReportAction(formData);
    setPreview(result);
    setLoading(false);
  }

  async function handleDownload(format: "pdf" | "xlsx" | "csv") {
    const formData = new FormData();
    formData.set("type", type);
    formData.set("format", format);
    // Use the currently selected range so the export matches the preview.
    formData.set("from", from);
    formData.set("to", to);
    const result = await downloadReportAction(formData);
    if (!result) return;
    const blob = new Blob([new Uint8Array(result.buffer)], { type: result.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setType(r.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              type === r.id ? "bg-slate-900 text-white" : "border border-slate-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form
        action={handlePreview}
        className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-6"
      >
        <div>
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            name="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            name="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Generate Preview"}
        </Button>
      </form>

      {preview && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{preview.title}</h2>
            <div className="flex gap-2">
              {(["pdf", "xlsx", "csv"] as const).map((fmt) => (
                <Button
                  key={fmt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(fmt)}
                >
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  {preview.headers.map((h) => (
                    <th key={h} className="p-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.rows.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((h) => (
                      <td key={h} className="p-2">{String(row[h] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 50 && (
              <p className="mt-2 text-xs text-slate-500">Showing first 50 of {preview.rows.length} rows.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
