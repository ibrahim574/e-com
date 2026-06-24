"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ForgotPasswordForm({
  admin = false,
  backHref,
}: {
  admin?: boolean;
  backHref: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    setError(null);
    if (admin) formData.set("admin", "true");
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          If an account exists for that email, we sent a password reset link. Check your inbox
          (and spam folder).
        </p>
        <Link href={backHref} className="text-sm font-semibold text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={handle} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        <Link href={backHref} className="font-semibold text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
