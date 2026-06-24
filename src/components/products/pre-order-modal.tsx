"use client";

import { useState } from "react";
import { submitPreOrderAction } from "@/app/actions/quote";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function PreOrderModal({
  productName,
  open,
  onClose,
}: {
  productName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await submitPreOrderAction(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Pre-Order Request</h2>
        {success ? (
          <p className="mt-4 text-sm text-emerald-600">
            Thank you! We&apos;ve received your pre-order request and will be in touch shortly.
          </p>
        ) : (
          <form action={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="preorder-name">Full Name *</Label>
              <Input id="preorder-name" name="name" required />
            </div>
            <div>
              <Label htmlFor="preorder-email">Email *</Label>
              <Input id="preorder-email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="preorder-phone">Phone *</Label>
              <Input id="preorder-phone" name="phone" type="tel" required />
            </div>
            <div>
              <Label htmlFor="preorder-product">Product</Label>
              <Input
                id="preorder-product"
                name="productName"
                defaultValue={productName}
                readOnly
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label htmlFor="preorder-qty">Quantity Needed *</Label>
              <Input id="preorder-qty" name="quantity" type="number" min="1" required />
            </div>
            <div>
              <Label htmlFor="preorder-notes">Notes / Timeline</Label>
              <textarea
                id="preorder-notes"
                name="notes"
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Submit Pre-Order</Button>
            </div>
          </form>
        )}
        {success && (
          <Button className="mt-4 w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
