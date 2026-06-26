"use client";

import { GitCompare, Check } from "lucide-react";
import { useCompare } from "./compare-context";
import { useToast } from "@/components/ui/toast-provider";

export function CompareButton({ productId }: { productId: string }) {
  const { has, toggle, ids, max } = useCompare();
  const { showToast } = useToast();
  const active = has(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!active && ids.length >= max) {
      showToast(`You can compare up to ${max} products.`, "error");
      return;
    }
    toggle(productId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title={active ? "Remove from compare" : "Add to compare"}
      className={`relative z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white/90 text-slate-600 hover:bg-white hover:text-blue-600 dark:bg-slate-800/90 dark:text-slate-200"
      }`}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : <GitCompare className="h-3.5 w-3.5" />}
      {active ? "Comparing" : "Compare"}
    </button>
  );
}
