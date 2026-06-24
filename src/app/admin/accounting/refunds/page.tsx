import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  await requireAdmin();

  const refunds = await prisma.refund.findMany({
    include: { order: true },
    orderBy: { refundDate: "desc" },
    take: 200,
  });

  const totalCents = refunds.reduce((s, r) => s + r.amountCents, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Refunds</h1>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {refunds.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.refundDate.toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${r.orderId}`} className="text-blue-600 hover:underline">
                    {r.order.orderNumber}
                  </Link>
                </td>
                <td className="p-3">{r.customerName}</td>
                <td className="p-3 capitalize">{r.type.toLowerCase()}</td>
                <td className="p-3 text-right">{formatPrice(r.amountCents, r.order.currency)}</td>
                <td className="p-3 capitalize">{r.status.toLowerCase()}</td>
                <td className="p-3 text-slate-500">{r.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <td className="p-3" colSpan={4}>Total Refunded</td>
              <td className="p-3 text-right">{formatPrice(totalCents, "CAD")}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
