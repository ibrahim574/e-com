import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status as "PAID" | "PENDING" | "FAILED" | "REFUNDED" | undefined;

  const payments = await prisma.paymentRecord.findMany({
    where: status ? { status } : undefined,
    include: { order: true },
    orderBy: { paymentDate: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Payment Records</h1>

      <div className="flex flex-wrap gap-2">
        {["", "PAID", "PENDING", "FAILED", "REFUNDED"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/accounting/payments?status=${s}` : "/admin/accounting/payments"}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              (status ?? "") === s || (!status && !s)
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Method</th>
              <th className="p-3">Reference</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="p-3">{p.paymentDate.toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${p.orderId}`} className="text-blue-600 hover:underline">
                    {p.order.orderNumber}
                  </Link>
                </td>
                <td className="p-3">{p.customerName}</td>
                <td className="p-3">{p.method}</td>
                <td className="p-3 text-xs text-slate-500">{p.transactionReference ?? "—"}</td>
                <td className="p-3 text-right">{formatPrice(p.amountPaidCents, p.order.currency)}</td>
                <td className="p-3 capitalize">{p.status.toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
