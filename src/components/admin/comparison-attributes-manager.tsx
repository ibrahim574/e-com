"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import {
  createComparisonAttributeAction,
  deleteComparisonAttributeAction,
  toggleComparisonAttributeAction,
} from "@/app/actions/comparison-attributes";
import { COMPARE_FIELD_KEYS } from "@/lib/compare";

export type AttributeRow = {
  id: string;
  label: string;
  source: string;
  key: string;
  position: number;
  enabled: boolean;
};

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950";

export function ComparisonAttributesManager({
  attributes,
}: {
  attributes: AttributeRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    const result = await createComparisonAttributeAction(formData);
    if (result?.error) {
      showToast(result.error, "error");
      return;
    }
    showToast(result?.message ?? "Added.");
    router.refresh();
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      const result = await toggleComparisonAttributeAction(id, enabled);
      if (result?.error) showToast(result.error, "error");
      else {
        showToast(result?.message ?? "Updated.");
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const result = await deleteComparisonAttributeAction(id);
    if (result?.error) showToast(result.error, "error");
    else {
      showToast(result?.message ?? "Deleted.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form
        action={handleCreate}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_1fr_auto_auto] dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Display label
          </span>
          <input name="label" required placeholder="Battery life" className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Source
          </span>
          <select name="source" defaultValue="spec" className={inputClass}>
            <option value="spec">Specification</option>
            <option value="field">Product field</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Key (spec label or field)
          </span>
          <input
            name="key"
            required
            placeholder="Battery life — or — brand"
            list="field-keys"
            className={inputClass}
          />
          <datalist id="field-keys">
            {COMPARE_FIELD_KEYS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </datalist>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Order
          </span>
          <input
            name="position"
            type="number"
            defaultValue={0}
            className={`${inputClass} w-20`}
          />
        </label>
        <div className="flex items-end">
          <Button type="submit">Add</Button>
        </div>
      </form>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Field keys: {COMPARE_FIELD_KEYS.map((f) => f.key).join(", ")}. For
        specifications, use the exact label that appears before the colon in a
        product&apos;s specifications.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Order</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Label</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Source</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Key</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {attributes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No comparison attributes yet.
                </td>
              </tr>
            ) : (
              attributes.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.position}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{a.label}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.source}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{a.key}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleToggle(a.id, !a.enabled)}
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        a.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmButton
                      message={`Delete attribute ${a.label}?`}
                      title="Delete attribute"
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(a.id)}
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
    </div>
  );
}
