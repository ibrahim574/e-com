"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
  toggleCouponAction,
} from "@/app/actions/coupons";

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  value: number;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
  allowedEmails: string[];
  buyQty: number | null;
  getQty: number | null;
  productIds: string[];
  startsAt: string | null;
  expiresAt: string | null;
  enabled: boolean;
};

const TYPE_LABELS: Record<CouponRow["type"], string> = {
  PERCENTAGE: "Percentage",
  FIXED: "Fixed amount",
  FREE_SHIPPING: "Free shipping",
  BUY_X_GET_Y: "Buy X get Y",
};

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950";

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function describeValue(c: CouponRow): string {
  switch (c.type) {
    case "PERCENTAGE":
      return `${c.value}%`;
    case "FIXED":
      return `$${(c.value / 100).toFixed(2)}`;
    case "FREE_SHIPPING":
      return "Free shipping";
    case "BUY_X_GET_Y":
      return `Buy ${c.buyQty ?? 1} get ${c.getQty ?? 1}`;
  }
}

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [type, setType] = useState<CouponRow["type"]>("PERCENTAGE");

  const editId = editing?.id ?? null;

  function startEdit(c: CouponRow) {
    setEditing(c);
    setType(c.type);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelEdit() {
    setEditing(null);
    setType("PERCENTAGE");
  }

  async function handleSubmit(formData: FormData) {
    const action = editId ? updateCouponAction : createCouponAction;
    const result = await action(formData);
    if (result?.error) {
      showToast(result.error, "error");
      return;
    }
    showToast(result?.message ?? "Saved.");
    cancelEdit();
    router.refresh();
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      const result = await toggleCouponAction(id, enabled);
      if (result?.error) showToast(result.error, "error");
      else {
        showToast(result?.message ?? "Updated.");
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const result = await deleteCouponAction(id);
    if (result?.error) showToast(result.error, "error");
    else {
      showToast(result?.message ?? "Deleted.");
      if (editId === id) cancelEdit();
      router.refresh();
    }
  }

  const valuePrefill =
    editing == null
      ? ""
      : editing.type === "FIXED"
        ? (editing.value / 100).toFixed(2)
        : editing.type === "PERCENTAGE"
          ? String(editing.value)
          : "";

  return (
    <div className="space-y-6">
      <form
        key={editId ?? "new"}
        action={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {editId ? `Edit coupon ${editing?.code}` : "Create coupon"}
          </h2>
          {editId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>

        {editId && <input type="hidden" name="id" value={editId} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Code
            </span>
            <input
              name="code"
              required
              defaultValue={editing?.code ?? ""}
              placeholder="SAVE10"
              className={`${inputClass} uppercase`}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Type
            </span>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as CouponRow["type"])}
              className={inputClass}
            >
              {Object.entries(TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {(type === "PERCENTAGE" || type === "FIXED") && (
            <label className="text-sm">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {type === "PERCENTAGE" ? "Percent off (1-100)" : "Amount off ($)"}
              </span>
              <input
                name="value"
                type="number"
                step={type === "FIXED" ? "0.01" : "1"}
                min="0"
                required
                defaultValue={valuePrefill}
                className={inputClass}
              />
            </label>
          )}
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Min. subtotal ($)
            </span>
            <input
              name="minSubtotal"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                editing ? (editing.minSubtotalCents / 100).toFixed(2) : ""
              }
              className={inputClass}
            />
          </label>
        </div>

        {type === "BUY_X_GET_Y" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Buy quantity
              </span>
              <input
                name="buyQty"
                type="number"
                min="1"
                defaultValue={editing?.buyQty ?? 1}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Get free
              </span>
              <input
                name="getQty"
                type="number"
                min="1"
                defaultValue={editing?.getQty ?? 1}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Product IDs (optional, comma-separated)
              </span>
              <input
                name="productIds"
                defaultValue={editing?.productIds.join(", ") ?? ""}
                placeholder="all products if blank"
                className={inputClass}
              />
            </label>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Max total uses
            </span>
            <input
              name="maxRedemptions"
              type="number"
              min="0"
              placeholder="unlimited"
              defaultValue={editing?.maxRedemptions ?? ""}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Per-customer limit
            </span>
            <input
              name="perCustomerLimit"
              type="number"
              min="0"
              placeholder="unlimited"
              defaultValue={editing?.perCustomerLimit ?? ""}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Starts at
            </span>
            <input
              name="startsAt"
              type="date"
              defaultValue={toDateInput(editing?.startsAt ?? null)}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Expires at
            </span>
            <input
              name="expiresAt"
              type="date"
              defaultValue={toDateInput(editing?.expiresAt ?? null)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Description (internal)
          </span>
          <input
            name="description"
            defaultValue={editing?.description ?? ""}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Restrict to emails (optional, comma or newline separated)
          </span>
          <textarea
            name="allowedEmails"
            rows={2}
            defaultValue={editing?.allowedEmails.join(", ") ?? ""}
            placeholder="leave blank for everyone"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="firstOrderOnly"
              defaultChecked={editing?.firstOrderOnly ?? false}
              className="h-4 w-4"
            />
            First order only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabled"
              value="on"
              defaultChecked={editing?.enabled ?? true}
              className="h-4 w-4"
            />
            Enabled
          </label>
          <div className="ml-auto">
            <Button type="submit">{editId ? "Save changes" : "Create coupon"}</Button>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Code</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Type</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Value</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Used</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Expires</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No coupons yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {TYPE_LABELS[c.type]}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {describeValue(c)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.usedCount}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.expiresAt ? toDateInput(c.expiresAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleToggle(c.id, !c.enabled)}
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <ConfirmButton
                        message={`Delete coupon ${c.code}?`}
                        title="Delete coupon"
                        confirmLabel="Delete"
                        onConfirm={() => handleDelete(c.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
