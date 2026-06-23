"use client";

import { useState, useTransition } from "react";
import {
  demoteAdminAction,
  deleteAdminAction,
  promoteAdminAction,
} from "@/app/actions/admin-users";

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

  function run(action: (fd: FormData) => Promise<{ error?: string }>) {
    setError(null);
    const fd = new FormData();
    fd.set("id", userId);
    startTransition(async () => {
      const result = await action(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isSuperAdmin && (
        <div className="flex flex-wrap justify-end gap-2">
          {role === "ADMIN" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(promoteAdminAction)}
              className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              Promote
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(demoteAdminAction)}
              className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
            >
              Demote
            </button>
          )}
          {!isSelf && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Delete this admin? They will no longer be able to sign in.",
                  )
                ) {
                  return;
                }
                run(deleteAdminAction);
              }}
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
