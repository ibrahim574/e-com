"use client";

import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "./compare-context";

export function CompareBar() {
  const { ids, clear } = useCompare();

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="container-page flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <GitCompare className="h-4 w-4 text-blue-600" />
          {ids.length} {ids.length === 1 ? "product" : "products"} selected to compare
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" /> Clear
          </button>
          <Link
            href="/compare"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  );
}
