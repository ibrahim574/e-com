"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { createPurchaseRequestAction } from "@/app/actions/purchase-requests";

export function PurchaseRequestForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createPurchaseRequestAction(formData);
    if (result?.error) {
      showToast(result.error, "error");
      return;
    }
    showToast(result?.message ?? "Request submitted.");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        Thanks! We&apos;ll reach out as soon as {productName} is available.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Request This Product
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
    >
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Request {productName}
      </p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productName" value={productName} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pr-name">Name *</Label>
          <Input id="pr-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="pr-email">Email *</Label>
          <Input id="pr-email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="pr-phone">Phone</Label>
          <Input id="pr-phone" name="phone" />
        </div>
        <div>
          <Label htmlFor="pr-qty">Quantity</Label>
          <Input id="pr-qty" name="quantity" type="number" min="1" defaultValue={1} />
        </div>
      </div>
      <div>
        <Label htmlFor="pr-message">Message</Label>
        <textarea
          id="pr-message"
          name="message"
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex h-10 flex-1 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
        >
          Submit Request
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
