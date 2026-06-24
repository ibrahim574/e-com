"use client";

import { useState } from "react";
import { issueRefundAction } from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export function RefundForm({
  orderId,
  orderTotalCents,
  currency,
}: {
  orderId: string;
  orderTotalCents: number;
  currency: "CAD" | "USD";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"FULL" | "PARTIAL">("FULL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Issue Refund
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setMessage(null);
        setError(null);
        fd.set("orderId", orderId);
        fd.set("type", type);
        const result = await issueRefundAction(fd);
        if (result?.error) setError(result.error);
        else {
          setMessage("Refund recorded and customer notified.");
          setOpen(false);
        }
      }}
      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
    >
      <h3 className="font-bold">Issue Refund</h3>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={type === "FULL"}
            onChange={() => setType("FULL")}
          />
          Full ({formatPrice(orderTotalCents, currency)})
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={type === "PARTIAL"}
            onChange={() => setType("PARTIAL")}
          />
          Partial
        </label>
      </div>
      {type === "PARTIAL" && (
        <div>
          <Label htmlFor="amountDollars">Refund amount ($)</Label>
          <Input
            id="amountDollars"
            name="amountDollars"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input id="reason" name="reason" />
      </div>
      <div>
        <Label htmlFor="transactionReference">Transaction reference (optional)</Label>
        <Input id="transactionReference" name="transactionReference" />
      </div>
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">Confirm Refund</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
