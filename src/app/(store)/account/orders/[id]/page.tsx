import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { formatItemDisplayName } from "@/lib/order-item-frequency";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const { id } = await params;
  const sp = await searchParams;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: true,
      invoices: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!order) notFound();

  const invoice = order.invoices[0];
  const isPrint = sp.print === "1";

  return (
    <div className={`container-page py-10 ${isPrint ? "print:p-0" : ""}`}>
      {!isPrint && (
        <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to orders
        </Link>
      )}
      <div className="mt-4 rounded-xl border border-slate-200 p-8 print:border-0">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        <p className="text-sm text-slate-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">Ship to</h2>
            <p className="mt-1 text-sm text-slate-600">
              {order.shippingName}
              <br />
              {order.shippingLine1}
              <br />
              {order.shippingCity}, {order.shippingState} {order.shippingPostal}
              <br />
              {order.shippingCountry}
            </p>
          </div>
          {invoice && (
            <div>
              <h2 className="font-semibold">Invoice</h2>
              <p className="mt-1 text-sm">{invoice.invoiceNumber}</p>
            </div>
          )}
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2">Item</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2">{formatItemDisplayName(item)}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatPrice(item.unitPriceCents * item.quantity, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
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
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total</span>
            <span>{formatPrice(order.totalCents, order.currency)}</span>
          </div>
        </div>
      </div>
      {isPrint && (
        <script
          dangerouslySetInnerHTML={{
            __html: "window.onload = () => window.print();",
          }}
        />
      )}
    </div>
  );
}
