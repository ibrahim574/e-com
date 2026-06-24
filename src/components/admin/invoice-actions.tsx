"use client";

import { useState } from "react";
import { regenerateInvoiceAction } from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";

export function InvoiceActions({
  orderId,
  invoiceId,
  invoiceNumber,
}: {
  orderId: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {invoiceId && (
        <>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noreferrer">
              Preview
            </a>
          </Button>
        </>
      )}
      <form
        action={async (fd) => {
          fd.set("orderId", orderId);
          const result = await regenerateInvoiceAction(fd);
          if (result?.success) {
            setMessage(`Invoice ${result.invoiceNumber} generated.`);
            window.location.reload();
          }
        }}
      >
        <Button type="submit" variant="outline" size="sm">
          {invoiceId ? "Re-generate Invoice" : "Generate Invoice"}
        </Button>
      </form>
      {message && <p className="w-full text-sm text-emerald-600">{message}</p>}
      {invoiceNumber && (
        <p className="w-full text-xs text-slate-500">Invoice #{invoiceNumber}</p>
      )}
    </div>
  );
}
