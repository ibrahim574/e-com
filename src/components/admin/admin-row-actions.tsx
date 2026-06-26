"use client";

import { useState, useTransition } from "react";
import {
  demoteAdminAction,
  deleteAdminAction,
  promoteAdminAction,
} from "@/app/actions/admin-users";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

type AdminRowActionsProps = {
  userId: string;
  role: "ADMIN" | "SUPER_ADMIN";
  isSelf: boolean;
  isSuperAdmin: boolean;
};

export function AdminRowActions({
  userId,
  role,
  isSelf,
  isSuperAdmin,
}: AdminRowActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function run(
    action: (fd: FormData) => Promise<{ error?: string }>,
    successMessage?: string,
  ) {
    setError(null);
    const fd = new FormData();
    fd.set("id", userId);
    startTransition(async () => {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
      } else if (successMessage) {
        showToast(successMessage);
      }
    });
  }

  async function deleteAdmin() {
    const fd = new FormData();
    fd.set("id", userId);
    const result = await deleteAdminAction(fd);
    if (result?.error) {
      setError(result.error);
      showToast(result.error, "error");
    } else {
      showToast("Admin deleted.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isSuperAdmin && (
        <div className="flex flex-wrap justify-end gap-2">
          {role === "ADMIN" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(promoteAdminAction, "Admin promoted to super admin.")}
              className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              Promote
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(demoteAdminAction, "Super admin demoted to admin.")}
              className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
            >
              Demote
            </button>
          )}
          {!isSelf && (
            <ConfirmButton
              disabled={pending}
              message="Delete this admin? They will no longer be able to sign in."
              title="Delete admin"
              confirmLabel="Delete"
              onConfirm={deleteAdmin}
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </ConfirmButton>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
