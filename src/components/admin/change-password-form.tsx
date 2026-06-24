"use client";

import { useRef, useState, useTransition } from "react";
import { changeAdminPasswordAction } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handle(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await changeAdminPasswordAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess("Password updated.");
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handle}
      className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-slate-900">Change password</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign-out is not required after changing your password.
      </p>
      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            required
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            minLength={8}
            required
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}
      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
