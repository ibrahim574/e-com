"use client";

import { useState } from "react";
import {
  updateOrderAction,
  softDeleteOrderAction,
  updateOrderItemQuantityAction,
  removeOrderItemAction,
} from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

type OrderEditorProps = {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    currency: "CAD" | "USD";
    trackingNumber: string | null;
    adjustmentCents: number;
    shippingName: string;
    shippingLine1: string;
    shippingLine2: string | null;
    shippingCity: string;
    shippingState: string;
    shippingPostal: string;
    shippingCountry: string;
    items: Array<{
      id: string;
      productName: string;
      variantLabel: string | null;
      quantity: number;
      unitPriceCents: number;
      txFrequency: string | null;
      rxFrequency: string | null;
    }>;
  };
  statuses: OrderStatus[];
};

export function OrderEditor({ order, statuses }: OrderEditorProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpdate(formData: FormData) {
    const result = await updateOrderAction(formData);
    if (result?.error) setMessage(result.error);
    else setMessage("Order updated.");
  }

  async function handleDelete(formData: FormData) {
    await softDeleteOrderAction(formData);
    window.location.href = "/admin/orders";
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <form
        action={handleUpdate}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <input type="hidden" name="orderId" value={order.id} />
        <h2 className="text-lg font-bold">Edit Order</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={order.status}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="adjustmentCents">Price Adjustment</Label>
            <Input
              id="adjustmentCents"
              name="adjustmentCents"
              type="number"
              step="0.01"
              defaultValue={(order.adjustmentCents / 100).toFixed(2)}
            />
          </div>
        </div>

        <h3 className="font-semibold text-slate-900">Shipping Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="shippingName">Name</Label>
            <Input id="shippingName" name="shippingName" defaultValue={order.shippingName} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shippingLine1">Address Line 1</Label>
            <Input id="shippingLine1" name="shippingLine1" defaultValue={order.shippingLine1} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shippingLine2">Address Line 2</Label>
            <Input id="shippingLine2" name="shippingLine2" defaultValue={order.shippingLine2 ?? ""} />
          </div>
          <div>
            <Label htmlFor="shippingCity">City</Label>
            <Input id="shippingCity" name="shippingCity" defaultValue={order.shippingCity} />
          </div>
          <div>
            <Label htmlFor="shippingState">State/Province</Label>
            <Input id="shippingState" name="shippingState" defaultValue={order.shippingState} />
          </div>
          <div>
            <Label htmlFor="shippingPostal">Postal Code</Label>
            <Input id="shippingPostal" name="shippingPostal" defaultValue={order.shippingPostal} />
          </div>
          <div>
            <Label htmlFor="shippingCountry">Country</Label>
            <Input id="shippingCountry" name="shippingCountry" defaultValue={order.shippingCountry} />
          </div>
        </div>

        <Button type="submit">Save Changes</Button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Line Items</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-slate-500">{item.variantLabel}</p>
                  )}
                  {(item.txFrequency || item.rxFrequency) && (
                    <p className="text-xs text-slate-500">
                      TX: {item.txFrequency || "—"} · RX: {item.rxFrequency || "—"}
                    </p>
                  )}
                  <p className="text-slate-600">
                    {formatPrice(item.unitPriceCents, order.currency)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={updateOrderItemQuantityAction} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <Input
                      name="quantity"
                      type="number"
                      min="1"
                      defaultValue={item.quantity}
                      className="w-20"
                    />
                    <Button type="submit" size="sm">
                      Update
                    </Button>
                  </form>
                  <form action={removeOrderItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {!deleteOpen ? (
          <Button variant="outline" className="text-red-600" onClick={() => setDeleteOpen(true)}>
            Delete Order
          </Button>
        ) : (
          <form action={handleDelete} className="rounded-xl border border-red-200 bg-red-50 p-4">
            <input type="hidden" name="orderId" value={order.id} />
            <p className="text-sm text-red-800">
              Are you sure? This cannot be undone. The order will be hidden from the admin list.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Confirm Delete
              </Button>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
