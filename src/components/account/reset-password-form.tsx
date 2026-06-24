"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/app/actions/password-reset";
import { passwordPolicyHint } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordForm({
  token,
  loginHref,
}: {
  token: string;
  loginHref: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    setError(null);
    formData.set("token", token);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Invalid reset link.{" "}
        <Link href={loginHref.replace("/login", "/forgot-password")} className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-emerald-600">Your password has been updated.</p>
        <Link href={loginHref} className="text-sm font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={handle} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
        <p className="mt-1 text-xs text-slate-500">{passwordPolicyHint()}</p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Reset password"}
      </Button>
    </form>
  );
}
