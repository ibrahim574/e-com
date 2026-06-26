"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Controlled, styled confirmation modal. */
export function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              destructive ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600" : ""
            }
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ConfirmButtonProps = {
  onConfirm: () => void | Promise<void>;
  message: string;
  title?: string;
  confirmLabel?: string;
  destructive?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

/**
 * A button that opens a styled ConfirmDialog before invoking `onConfirm`.
 * Drop-in replacement for `window.confirm(...)` flows.
 */
export function ConfirmButton({
  onConfirm,
  message,
  title,
  confirmLabel,
  destructive = true,
  className,
  children,
  disabled,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        destructive={destructive}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => (busy ? undefined : setOpen(false))}
      />
    </>
  );
}
