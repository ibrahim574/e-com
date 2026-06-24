"use client";

import { useState } from "react";
import {
  updateOrderAction,
  softDeleteOrderAction,
  updateOrderItemQuantityAction,
  removeOrderItemAction,
} from "@/app/actions/orders";
import { AddOrderItemForm } from "@/components/admin/add-order-item-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { formatItemFrequency } from "@/lib/order-item-frequency";

type OrderEditorProps = {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    currency: "CAD" | "USD";
    trackingNumber: string | null;
    adjustmentCents: number;
    shippingCents: number;
    taxCents: number;
    taxLabel: string | null;
    shippingOverride: boolean;
    taxOverride: boolean;
    shippingName: string;
    shippingLine1: string;
    shippingLine2: string | null;
    shippingCity: string;
    shippingState: string;
    shippingPostal: string;
    shippingCountry: string;
    billingName: string | null;
    billingLine1: string | null;
    billingLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPostal: string | null;
    billingCountry: string | null;
    items: Array<{
      id: string;
      productName: string;
      variantLabel: string | null;
      quantity: number;
      unitPriceCents: number;
      selectedFrequency: string | null;
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
            <Label htmlFor="adjustmentCents">Discount / adjustment ($)</Label>
            <Input
              id="adjustmentCents"
              name="adjustmentCents"
              type="number"
              step="0.01"
              defaultValue={(order.adjustmentCents / 100).toFixed(2)}
            />
            <p className="mt-1 text-xs text-slate-500">Use negative values for discounts.</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Shipping &amp; tax overrides</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="shippingOverride" defaultChecked={order.shippingOverride} />
              Manual shipping amount
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="taxOverride" defaultChecked={order.taxOverride} />
              Manual tax amount
            </label>
            <div>
              <Label htmlFor="shippingCents">Shipping ($)</Label>
              <Input
                id="shippingCents"
                name="shippingCents"
                type="number"
                step="0.01"
                defaultValue={(order.shippingCents / 100).toFixed(2)}
              />
            </div>
            <div>
              <Label htmlFor="taxCents">Tax ($)</Label>
              <Input
                id="taxCents"
                name="taxCents"
                type="number"
                step="0.01"
                defaultValue={(order.taxCents / 100).toFixed(2)}
              />
            </div>
            <div>
              <Label htmlFor="taxLabel">Tax label</Label>
              <Input id="taxLabel" name="taxLabel" defaultValue={order.taxLabel ?? "HST"} />
            </div>
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

        <h3 className="font-semibold text-slate-900">Billing Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="billingName">Name</Label>
            <Input id="billingName" name="billingName" defaultValue={order.billingName ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="billingLine1">Address Line 1</Label>
            <Input id="billingLine1" name="billingLine1" defaultValue={order.billingLine1 ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="billingLine2">Address Line 2</Label>
            <Input id="billingLine2" name="billingLine2" defaultValue={order.billingLine2 ?? ""} />
          </div>
          <div>
            <Label htmlFor="billingCity">City</Label>
            <Input id="billingCity" name="billingCity" defaultValue={order.billingCity ?? ""} />
          </div>
          <div>
            <Label htmlFor="billingState">State/Province</Label>
            <Input id="billingState" name="billingState" defaultValue={order.billingState ?? ""} />
          </div>
          <div>
            <Label htmlFor="billingPostal">Postal Code</Label>
            <Input id="billingPostal" name="billingPostal" defaultValue={order.billingPostal ?? ""} />
          </div>
          <div>
            <Label htmlFor="billingCountry">Country</Label>
            <Input id="billingCountry" name="billingCountry" defaultValue={order.billingCountry ?? ""} />
          </div>
        </div>

        <Button type="submit">Save Changes</Button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Line Items</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => {
            const freq = formatItemFrequency(item);
            return (
              <li key={item.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.variantLabel && <p className="text-slate-500">{item.variantLabel}</p>}
                    {freq && <p className="text-xs text-slate-500">{freq}</p>}
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
            );
          })}
        </ul>
        <AddOrderItemForm orderId={order.id} currency={order.currency} />
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
