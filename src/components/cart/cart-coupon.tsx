"use client";

import { useState, useTransition } from "react";
import { applyCouponAction, removeCouponAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function CartCoupon({
  appliedCode,
  isValid,
}: {
  appliedCode: string | null;
  isValid: boolean;
}) {
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  function apply() {
    const value = code.trim();
    if (!value) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("code", value);
      const res = await applyCouponAction(formData);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        showToast(res?.message ?? "Coupon applied.");
        setCode("");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCouponAction();
      showToast("Coupon removed.");
    });
  }

  if (appliedCode) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">{appliedCode}</span>
            {!isValid && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                no longer valid
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Coupon code"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase placeholder:normal-case dark:border-slate-600 dark:bg-slate-900"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
      />
      <Button type="button" onClick={apply} disabled={pending || !code.trim()}>
        Apply
      </Button>
    </div>
  );
}
