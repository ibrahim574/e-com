import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const from = sp.from ? new Date(sp.from) : new Date(new Date().getFullYear(), 0, 1);
  const to = sp.to ? new Date(sp.to) : new Date();
  to.setHours(23, 59, 59, 999);

  const entries = await prisma.incomeLedgerEntry.findMany({
    where: { orderDate: { gte: from, lte: to } },
    include: { order: true },
    orderBy: { orderDate: "desc" },
  });

  const totalNet = entries.reduce((s, e) => s + e.netRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Income Ledger</h1>
          <p className="text-slate-600">Auto-recorded from paid orders (read-only)</p>
        </div>
        <Link href="/admin/accounting/reports" className="text-sm text-blue-600 hover:underline">
          Export reports →
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="rounded border px-2 py-1 text-sm" />
        <input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className="rounded border px-2 py-1 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Shipping</th>
              <th className="p-3 text-right">Tax</th>
              <th className="p-3 text-right">Discount</th>
              <th className="p-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="p-3">{e.orderDate.toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${e.orderId}`} className="text-blue-600 hover:underline">
                    {e.order.orderNumber}
                  </Link>
                </td>
                <td className="p-3">{e.customerName}</td>
                <td className="p-3 text-right">{formatPrice(e.revenueAmount, e.order.currency)}</td>
                <td className="p-3 text-right">{formatPrice(e.shippingIncome, e.order.currency)}</td>
                <td className="p-3 text-right">{formatPrice(e.taxCollected, e.order.currency)}</td>
                <td className="p-3 text-right">-{formatPrice(e.discountAmount, e.order.currency)}</td>
                <td className="p-3 text-right font-semibold">{formatPrice(e.netRevenue, e.order.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <td className="p-3" colSpan={7}>Total Net Revenue</td>
              <td className="p-3 text-right">{formatPrice(totalNet, "CAD")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
