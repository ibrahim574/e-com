import Link from "next/link";
import {
  ShoppingCart,
  CreditCard,
  Clock,
  XCircle,
  Package,
  Layers,
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  PackageCheck,
  Truck,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { FinancialDashboard } from "@/components/admin/financial-dashboard";
import {
  getFinancialKpis,
  getMonthlyRevenueChart,
  getYearlyRevenueChart,
} from "@/lib/financial-dashboard";
import {
  ORDER_STATUS_LIST,
  ORDER_STATUS_META,
  PAID_STATUSES,
} from "@/lib/order-status";
import type { OrderStatus, Currency } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const now = new Date();
  const range = {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  };

  const [
    kpis,
    monthlyChart,
    yearlyChart,
    statusGroups,
    revenueGroups,
    orderCount,
    productCount,
    activeProductCount,
    categoryCount,
    industryCount,
    customerCount,
    subscriberCount,
    recentOrders,
    lowStockProducts,
    lowStockVariants,
    topItems,
  ] = await Promise.all([
    getFinancialKpis(range),
    getMonthlyRevenueChart(now.getFullYear(), "revenue"),
    getYearlyRevenueChart("revenue"),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.groupBy({
      by: ["currency"],
      where: { status: { in: PAID_STATUSES } },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.category.count(),
    prisma.industry.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.newsletterSubscriber.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true, items: true },
    }),
    prisma.product.findMany({
      where: { hasVariants: false, stock: { lte: 20 } },
      orderBy: { stock: "asc" },
      take: 20,
      select: { id: true, name: true, slug: true, stock: true, lowStockThreshold: true },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, sku: true, stock: true, product: { select: { name: true, id: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { status: { in: PAID_STATUSES } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const countFor = (status: OrderStatus) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const paidCount = PAID_STATUSES.reduce((sum, s) => sum + countFor(s), 0);
  const pendingCount = countFor("PENDING");
  const cancelledCount = countFor("CANCELLED");

  const revenueByCurrency = revenueGroups.map((g) => ({
    currency: g.currency as Currency,
    totalCents: g._sum.totalCents ?? 0,
    orders: g._count._all,
  }));

  const lowStockProductsFiltered = lowStockProducts.filter(
    (p) => p.stock <= p.lowStockThreshold,
  ).slice(0, 6);

  const lowStockCount = lowStockProductsFiltered.length + lowStockVariants.length;

  const primaryStats = [
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingCart,
      tone: "bg-white text-slate-900",
      iconWrap: "bg-blue-100 text-blue-600",
      href: "/admin/orders",
    },
    {
      label: "Payment Completed",
      value: paidCount,
      icon: CreditCard,
      tone: "bg-white text-slate-900",
      iconWrap: "bg-emerald-100 text-emerald-600",
      href: "/admin/orders?status=PAID",
    },
    {
      label: "Waiting for Payment",
      value: pendingCount,
      icon: Clock,
      tone: "bg-white text-slate-900",
      iconWrap: "bg-amber-100 text-amber-600",
      href: "/admin/orders?status=PENDING",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: XCircle,
      tone: "bg-white text-slate-900",
      iconWrap: "bg-rose-100 text-rose-600",
      href: "/admin/orders?status=CANCELLED",
    },
  ];

  const catalogStats = [
    { label: "Products", value: productCount, sub: `${activeProductCount} active`, icon: Package, href: "/admin/products" },
    { label: "Categories", value: categoryCount, sub: "Storefront groups", icon: Layers, href: "/admin/categories" },
    { label: "Industries", value: industryCount, sub: "Use cases", icon: Building2, href: "/admin/industries" },
    { label: "Customers", value: customerCount, sub: `${subscriberCount} subscribers`, icon: Users, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">
            Welcome back, {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Package className="h-4 w-4" /> Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Orders
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Financial Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Current month — cached 15 min</p>
        <div className="mt-4">
          <FinancialDashboard
            kpis={kpis}
            monthlyChart={monthlyChart}
            yearlyChart={yearlyChart}
            currency="CAD"
          />
        </div>
      </div>

      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <TrendingUp className="h-4 w-4" /> Total Revenue (paid)
          </div>
          {revenueByCurrency.length === 0 ? (
            <p className="mt-4 text-3xl font-bold">$0.00</p>
          ) : (
            <div className="mt-4 space-y-1">
              {revenueByCurrency.map((r) => (
                <p key={r.currency} className="text-3xl font-bold leading-tight">
                  {formatPrice(r.totalCents, r.currency)}
                  <span className="ml-2 text-base font-medium text-blue-100">
                    {r.currency}
                  </span>
                </p>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm text-blue-100">
            From {paidCount} paid {paidCount === 1 ? "order" : "orders"}
          </p>
        </div>

        {/* Primary order stats */}
        <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group flex flex-col justify-between rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${stat.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-60" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className={`text-sm ${stat.tone.includes("text-white") ? "text-slate-300" : "text-slate-500"}`}>
                    {stat.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Order pipeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Order Pipeline</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-blue-600 hover:underline">
            Manage orders
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUS_LIST.map((status) => {
            const meta = ORDER_STATUS_META[status];
            const count = countFor(status);
            const share = orderCount > 0 ? Math.round((count / orderCount) * 100) : 0;
            return (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {status.toLowerCase()}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-400">{share}% of orders</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Catalog stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {catalogStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{stat.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold">Order</th>
                    <th className="pb-3 pr-4 font-semibold">Customer</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 pr-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => {
                    const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                          <p className="text-xs text-slate-400">
                            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="truncate">{order.user?.email ?? order.guestEmail ?? "Guest"}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-slate-900">
                          {formatPrice(order.totalCents, order.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Top Sellers</h2>
          </div>
          {topItems.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topItems.map((item, i) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-slate-700">
                    {item.productName}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {item._sum.quantity ?? 0}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Low Stock Alerts</h2>
            {lowStockCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {lowStockCount}
              </span>
            )}
          </div>
          <Link href="/admin/products" className="text-sm font-medium text-blue-600 hover:underline">
            Manage stock
          </Link>
        </div>
        {lowStockCount === 0 ? (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-600">
            <Truck className="h-4 w-4" /> All products are well stocked.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockProductsFiltered.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <span className="truncate pr-3 text-sm font-medium text-slate-700">{p.name}</span>
                <span className={`shrink-0 text-sm font-bold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>
                  {p.stock} left
                </span>
              </Link>
            ))}
            {lowStockVariants.map((v) => (
              <Link
                key={v.id}
                href={`/admin/products/${v.product.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <span className="truncate pr-3 text-sm font-medium text-slate-700">
                  {v.product.name}
                  <span className="block text-xs text-slate-400">{v.sku}</span>
                </span>
                <span className={`shrink-0 text-sm font-bold ${v.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>
                  {v.stock} left
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
