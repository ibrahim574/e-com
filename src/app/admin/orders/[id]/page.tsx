import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LIST, ORDER_STATUS_META } from "@/lib/order-status";
import { OrderEditor } from "@/components/admin/order-editor";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { RefundForm } from "@/components/admin/refund-form";
import { getShipmentBreakdown } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          product: { include: { shippingClass: true } },
          variant: { include: { shippingClass: true } },
        },
      },
      user: true,
      invoices: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!order) notFound();

  const shipment = await getShipmentBreakdown(order);

  const latestInvoice = order.invoices[0];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to orders
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{order.orderNumber}</h1>
        <p className="text-slate-600">
          {order.user?.email ?? order.guestEmail ?? "Guest"} ·{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {order.status === "PAID" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-bold text-slate-900">Invoice</h2>
          <div className="mt-2">
            <InvoiceActions
              orderId={order.id}
              invoiceId={latestInvoice?.id}
              invoiceNumber={latestInvoice?.invoiceNumber}
            />
          </div>
        </div>
      )}

      {order.status === "PAID" && (
        <RefundForm
          orderId={order.id}
          orderTotalCents={order.totalCents}
          currency={order.currency}
        />
      )}

      <OrderEditor order={order} statuses={ORDER_STATUS_LIST} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">
        <h2 className="font-bold text-slate-900">Shipment</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Destination</dt>
            <dd className="font-medium">{shipment.destination}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Zone</dt>
            <dd className="font-medium">{shipment.zoneName ?? "Country flat rate"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total weight</dt>
            <dd className="font-medium">{(shipment.totalWeightGrams / 1000).toFixed(2)} kg</dd>
          </div>
          <div>
            <dt className="text-slate-500">Shipping class</dt>
            <dd className="font-medium">{shipment.shippingClassSummary}</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {order.items.map((item) => {
            const src = item.variant ?? item.product;
            return (
              <li key={item.id} className="flex justify-between gap-4 text-xs text-slate-600">
                <span>
                  {item.productName} × {item.quantity}
                  {src?.weightGrams ? ` · ${src.weightGrams}g each` : ""}
                </span>
                <span>{src?.shippingClass?.name ?? "Standard"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">
        <h2 className="font-bold text-slate-900">Totals</h2>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents, order.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingCents, order.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>{order.taxLabel ?? "Tax"}</span>
            <span>{formatPrice(order.taxCents, order.currency)}</span>
          </div>
          {order.adjustmentCents !== 0 && (
            <div className="flex justify-between">
              <span>Adjustment</span>
              <span>{formatPrice(order.adjustmentCents, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total</span>
            <span>{formatPrice(order.totalCents, order.currency)}</span>
          </div>
        </div>
        <p className="mt-2 text-slate-500">
          Status: {ORDER_STATUS_META[order.status].label}
        </p>
      </div>
    </div>
  );
}
