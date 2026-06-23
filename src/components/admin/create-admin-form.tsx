"use client";

import { useRef, useState, useTransition } from "react";
import { createAdminAction } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CreateAdminForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handle(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createAdminAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess("Admin created.");
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handle}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-slate-900">Add new admin</h2>
      <p className="mt-1 text-sm text-slate-600">
        Creates a regular admin account. They can manage products, orders, and
        customers, and add other admins.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Jane Smith" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="password">Initial password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            They can change it from their own admin profile.
          </p>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}
      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add admin"}
        </Button>
      </div>
    </form>
  );
}
