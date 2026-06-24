"use client";

import Link from "next/link";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <form action={handleSubmit} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value="/account" />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" name="password" required />
          </div>
          <p className="text-right text-sm">
            <Link href="/account/forgot-password" className="font-medium text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="font-semibold text-blue-600">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
