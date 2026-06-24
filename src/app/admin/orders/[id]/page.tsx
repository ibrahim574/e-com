import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LIST, ORDER_STATUS_META } from "@/lib/order-status";
import { OrderEditor } from "@/components/admin/order-editor";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { RefundForm } from "@/components/admin/refund-form";

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
      items: true,
      user: true,
      invoices: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!order) notFound();

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
