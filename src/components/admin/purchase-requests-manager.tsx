"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import {
  updatePurchaseRequestStatusAction,
  deletePurchaseRequestAction,
} from "@/app/actions/purchase-requests";

export type PurchaseRequestRow = {
  id: string;
  productName: string;
  name: string;
  email: string;
  phone: string | null;
  quantity: number;
  message: string | null;
  status: string;
  createdAt: string;
};

const STATUSES = ["OPEN", "CONTACTED", "CLOSED"];

export function PurchaseRequestsManager({
  requests,
}: {
  requests: PurchaseRequestRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleStatus(id: string, status: string) {
    startTransition(async () => {
      const result = await updatePurchaseRequestStatusAction(id, status);
      if (result?.error) showToast(result.error, "error");
      else {
        showToast(result?.message ?? "Updated.");
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const result = await deletePurchaseRequestAction(id);
    if (result?.error) showToast(result.error, "error");
    else {
      showToast(result?.message ?? "Deleted.");
      router.refresh();
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left dark:bg-slate-800/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Date</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Product</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Customer</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Qty</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Message</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                No purchase requests yet.
              </td>
            </tr>
          ) : (
            requests.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                  {r.productName}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  <div>{r.name}</div>
                  <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">
                    {r.email}
                  </a>
                  {r.phone && <div className="text-xs text-slate-500">{r.phone}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.quantity}</td>
                <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300">
                  {r.message ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    disabled={pending}
                    onChange={(e) => handleStatus(r.id, e.target.value)}
                    className="h-8 rounded-md border border-slate-300 px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmButton
                    message={`Delete request from ${r.name}?`}
                    title="Delete request"
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(r.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ConfirmButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
