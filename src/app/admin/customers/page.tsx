import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PAID_STATUSES } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: {
        where: { status: { in: PAID_STATUSES } },
        select: { totalCents: true, currency: true },
      },
      _count: { select: { orders: true } },
    },
  });

  function spendByCurrency(
    orders: { totalCents: number; currency: "CAD" | "USD" }[],
  ) {
    return orders.reduce(
      (acc, o) => {
        acc[o.currency] = (acc[o.currency] ?? 0) + o.totalCents;
        return acc;
      },
      {} as Record<"CAD" | "USD", number>,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Customers
        </h1>
        <p className="mt-1 text-slate-600">
          {customers.length} {customers.length === 1 ? "customer" : "customers"} registered
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Joined</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Orders</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Total spent</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const totals = spendByCurrency(
                  c.orders as { totalCents: number; currency: "CAD" | "USD" }[],
                );
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {c.name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.phone ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c._count.orders}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {totals.CAD || totals.USD ? (
                        <div className="flex flex-col">
                          {totals.CAD ? (
                            <span>{formatPrice(totals.CAD, "CAD")}</span>
                          ) : null}
                          {totals.USD ? (
                            <span className="text-xs text-slate-500">
                              {formatPrice(totals.USD, "USD")}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
