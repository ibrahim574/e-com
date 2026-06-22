"use client";

import Link from "next/link";
import { useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await registerAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <form action={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {error && <p className="text-sm text-blue-600">{error}</p>}
          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/account/login" className="font-semibold text-blue-600">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
