import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { ORDER_STATUS_LIST, ORDER_STATUS_META } from "@/lib/order-status";
import type { OrderStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUS_LIST as string[]).includes(value);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();

  const { status, q = "", from = "", to = "" } = await searchParams;
  const activeStatus = isOrderStatus(status) ? status : null;
  const query = q.trim();

  const activeOrdersWhere: Prisma.OrderWhereInput = { deletedAt: null };

  const where: Prisma.OrderWhereInput = {
    ...activeOrdersWhere,
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { guestEmail: { contains: query, mode: "insensitive" } },
            { shippingName: { contains: query, mode: "insensitive" } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const [orders, statusGroups, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: activeOrdersWhere,
      _count: { _all: true },
    }),
    prisma.order.count({ where: activeOrdersWhere }),
  ]);

  const countFor = (s: OrderStatus) =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;

  const filters: Array<{ key: OrderStatus | "ALL"; label: string; count: number }> = [
    { key: "ALL", label: "All", count: totalCount },
    ...ORDER_STATUS_LIST.map((s) => ({
      key: s,
      label: ORDER_STATUS_META[s].label,
      count: countFor(s),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-slate-600">
            {activeStatus
              ? `${orders.length} ${ORDER_STATUS_META[activeStatus].label.toLowerCase()} ${orders.length === 1 ? "order" : "orders"}`
              : `${totalCount} total ${totalCount === 1 ? "order" : "orders"}`}
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href = f.key === "ALL" ? "/admin/orders" : `/admin/orders?status=${f.key}`;
          const isActive =
            f.key === "ALL" ? !activeStatus : activeStatus === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.count}
              </span>
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search order #, customer..."
          className="h-10 flex-1 min-w-[200px] rounded-md border border-slate-200 px-3 text-sm"
        />
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        />
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        />
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <button
          type="submit"
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No orders {activeStatus ? `with status "${ORDER_STATUS_META[activeStatus].label}"` : "yet"}.
          </div>
        ) : (
          orders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const isOverdue =
              order.status === "PENDING" &&
              Date.now() - order.createdAt.getTime() > 3 * 24 * 60 * 60 * 1000;
            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  isOverdue ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-blue-600"
                      >
                        {order.orderNumber}
                      </Link>
                      <OrderStatusBadge status={order.status} />
                      {isOverdue && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.user?.email ?? order.guestEmail ?? "Guest"} ·{" "}
                      {new Date(order.createdAt).toLocaleString()} ·{" "}
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatPrice(order.totalCents, order.currency)}
                      </p>
                      <p className="text-xs text-slate-400">{order.currency}</p>
                    </div>
                    <OrderStatusControl orderId={order.id} status={order.status} />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Shipping
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.shippingName}
                      <br />
                      {order.shippingLine1}
                      {order.shippingLine2 && (
                        <>
                          <br />
                          {order.shippingLine2}
                        </>
                      )}
                      <br />
                      {order.shippingCity}, {order.shippingState} {order.shippingPostal}
                      <br />
                      {order.shippingCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Items
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>
                            {item.quantity}× {item.productName}
                            {item.variantLabel ? ` (${item.variantLabel})` : ""}
                          </span>
                          <span className="shrink-0 font-medium text-slate-700">
                            {formatPrice(item.unitPriceCents * item.quantity, order.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotalCents, order.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Shipping</span>
                        <span>
                          {order.shippingCents === 0
                            ? "FREE"
                            : formatPrice(order.shippingCents, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tax</span>
                        <span>{formatPrice(order.taxCents, order.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
