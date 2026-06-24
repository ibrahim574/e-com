"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: "CAD" | "USD";
  createdAt: Date;
  invoiceId: string | null;
  items: Array<{ productName: string; quantity: number }>;
};

export function CustomerOrdersList({ orders }: { orders: OrderRow[] }) {
  const [emailing, setEmailing] = useState<string | null>(null);

  async function emailInvoice(invoiceId: string) {
    setEmailing(invoiceId);
    await fetch(`/api/invoices/${invoiceId}/email`, { method: "POST" });
    setEmailing(null);
    alert("Invoice emailed if SMTP is configured.");
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-slate-200 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900">{order.orderNumber}</p>
              <p className="text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {formatPrice(order.totalCents, order.currency)}
              </p>
              <p className="text-sm capitalize text-slate-600">
                {order.status.toLowerCase()}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.quantity}x {item.productName}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/account/orders/${order.id}`}>View Details</Link>
            </Button>
            {order.status === "PAID" && order.invoiceId && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/api/invoices/${order.invoiceId}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Invoice
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => emailInvoice(order.invoiceId!)}
                  disabled={emailing === order.invoiceId}
                >
                  Email Invoice
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/account/orders/${order.id}?print=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Print Receipt
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
