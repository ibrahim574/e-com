"use client";

import { useState, useTransition } from "react";
import { updateCustomerProfileAction, changeCustomerPasswordAction } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { passwordPolicyHint } from "@/lib/password-policy";

export type ProfileDefaults = {
  name: string | null;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdPending, startPwdTransition] = useTransition();

  function handlePassword(formData: FormData) {
    setPwdError(null);
    setPwdSuccess(null);
    startPwdTransition(async () => {
      const result = await changeCustomerPasswordAction(formData);
      if (result?.error) {
        setPwdError(result.error);
        return;
      }
      setPwdSuccess("Password updated.");
    });
  }

  function handle(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateCustomerProfileAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess("Profile saved.");
    });
  }

  return (
    <form
      action={handle}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <section>
        <h2 className="text-base font-bold text-slate-900">About you</h2>
        <p className="mt-1 text-xs text-slate-500">
          Your email is locked to your account and cannot be changed here.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={defaults.name ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              defaultValue={defaults.email}
              disabled
              readOnly
              className="bg-slate-50 text-slate-500"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaults.phone ?? ""}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900">Default shipping address</h2>
        <p className="mt-1 text-xs text-slate-500">
          We&apos;ll use this to pre-fill your checkout shipping fields.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={defaults.addressLine1 ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={defaults.addressLine2 ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="addressCity">City</Label>
            <Input
              id="addressCity"
              name="addressCity"
              defaultValue={defaults.addressCity ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="addressState">State / Province</Label>
            <Input
              id="addressState"
              name="addressState"
              defaultValue={defaults.addressState ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="addressPostal">Postal code</Label>
            <Input
              id="addressPostal"
              name="addressPostal"
              defaultValue={defaults.addressPostal ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="addressCountry">Country</Label>
            <Input
              id="addressCountry"
              name="addressCountry"
              defaultValue={defaults.addressCountry ?? "CA"}
              maxLength={2}
            />
            <p className="mt-1 text-xs text-slate-500">2-letter code (CA, US)</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <h2 className="text-base font-bold text-slate-900">Change password</h2>
        <form action={handlePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" />
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput id="newPassword" name="newPassword" required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} autoComplete="new-password" />
          </div>
          <p className="sm:col-span-2 text-xs text-slate-500">{passwordPolicyHint()}</p>
          {pwdError && <p className="sm:col-span-2 text-sm text-red-600">{pwdError}</p>}
          {pwdSuccess && <p className="sm:col-span-2 text-sm text-emerald-600">{pwdSuccess}</p>}
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="outline" disabled={pwdPending}>
              {pwdPending ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
