"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import {
  createRedirectAction,
  deleteRedirectAction,
  toggleRedirectAction,
} from "@/app/actions/redirects";

type RedirectRow = {
  id: string;
  source: string;
  destination: string;
  statusCode: number;
  enabled: boolean;
};

export function RedirectsManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    const result = await createRedirectAction(formData);
    if (result?.error) {
      showToast(result.error, "error");
      return;
    }
    showToast(result?.message ?? "Redirect created.");
    router.refresh();
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      const result = await toggleRedirectAction(id, enabled);
      if (result?.error) showToast(result.error, "error");
      else {
        showToast(result?.message ?? "Updated.");
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const result = await deleteRedirectAction(id);
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
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto] dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Source path
          </span>
          <input
            name="source"
            required
            placeholder="/old-product"
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Destination (path or URL)
          </span>
          <input
            name="destination"
            required
            placeholder="/products/new-product"
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Type
          </span>
          <select
            name="statusCode"
            defaultValue="308"
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="308">308 Permanent</option>
            <option value="301">301 Permanent (legacy)</option>
            <option value="307">307 Temporary</option>
            <option value="302">302 Temporary (legacy)</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit">Add redirect</Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Source</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Destination</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Type</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No redirects yet.
                </td>
              </tr>
            ) : (
              redirects.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.source}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.destination}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.statusCode}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleToggle(r.id, !r.enabled)}
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        r.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmButton
                      message={`Delete redirect ${r.source}?`}
                      title="Delete redirect"
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
    </div>
  );
}
