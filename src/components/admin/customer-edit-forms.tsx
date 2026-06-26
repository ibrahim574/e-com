"use client";

import { useState, useTransition } from "react";
import {
  updateCustomerDetailsAction,
  updateCustomerEmailAction,
  resetCustomerPasswordAction,
} from "@/app/actions/admin-customers";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

type CustomerEditData = {
  id: string;
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

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900";

export function CustomerEditForms({
  customer,
  isSuperAdmin,
}: {
  customer: CustomerEditData;
  isSuperAdmin: boolean;
}) {
  const { showToast } = useToast();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ActionForm
        action={updateCustomerDetailsAction}
        successMessage="Customer details updated."
        className={`${cardClass} md:col-span-2`}
      >
        <input type="hidden" name="id" value={customer.id} />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Edit details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" name="name" defaultValue={customer.name ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-phone">Phone</Label>
            <Input id="c-phone" name="phone" defaultValue={customer.phone ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-l1">Address line 1</Label>
            <Input id="c-l1" name="addressLine1" defaultValue={customer.addressLine1 ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-l2">Address line 2</Label>
            <Input id="c-l2" name="addressLine2" defaultValue={customer.addressLine2 ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-city">City</Label>
            <Input id="c-city" name="addressCity" defaultValue={customer.addressCity ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-state">State / Province</Label>
            <Input id="c-state" name="addressState" defaultValue={customer.addressState ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-postal">Postal code</Label>
            <Input id="c-postal" name="addressPostal" defaultValue={customer.addressPostal ?? ""} />
          </div>
          <div>
            <Label htmlFor="c-country">Country</Label>
            <Input
              id="c-country"
              name="addressCountry"
              maxLength={2}
              defaultValue={customer.addressCountry ?? ""}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit">Save details</Button>
        </div>
      </ActionForm>

      {isSuperAdmin && (
        <>
          <EmailForm customerId={customer.id} currentEmail={customer.email} showToast={showToast} />
          <PasswordForm customerId={customer.id} showToast={showToast} />
        </>
      )}
    </div>
  );
}

function EmailForm({
  customerId,
  currentEmail,
  showToast,
}: {
  customerId: string;
  currentEmail: string;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    const fd = new FormData();
    fd.set("id", customerId);
    fd.set("email", email);
    startTransition(async () => {
      const result = await updateCustomerEmailAction(fd);
      setOpen(false);
      if (result?.error) showToast(result.error, "error");
      else showToast("Customer email updated.");
    });
  }

  return (
    <div className={cardClass}>
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Change email
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        The customer signs in with this email. Super admin only.
      </p>
      <div className="mt-4">
        <Label htmlFor="c-email">Email</Label>
        <Input
          id="c-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          disabled={pending || !email || email === currentEmail}
          onClick={() => setOpen(true)}
        >
          Update email
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Change customer email"
        message={`Change this customer's sign-in email to ${email}?`}
        confirmLabel="Change email"
        busy={pending}
        onConfirm={submit}
        onCancel={() => (pending ? undefined : setOpen(false))}
      />
    </div>
  );
}

function PasswordForm({
  customerId,
  showToast,
}: {
  customerId: string;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    const fd = new FormData();
    fd.set("id", customerId);
    fd.set("password", password);
    fd.set("confirmPassword", confirm);
    startTransition(async () => {
      const result = await resetCustomerPasswordAction(fd);
      setOpen(false);
      if (result?.error) {
        showToast(result.error, "error");
      } else {
        showToast("Customer password reset.");
        setPassword("");
        setConfirm("");
      }
    });
  }

  return (
    <div className={cardClass}>
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Reset password
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Sets a new password for the customer. Super admin only.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="c-pw">New password</Label>
          <PasswordInput
            id="c-pw"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="c-pw2">Confirm password</Label>
          <PasswordInput
            id="c-pw2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          disabled={pending || !password || !confirm}
          onClick={() => setOpen(true)}
        >
          Reset password
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Reset customer password"
        message="Set a new password for this customer? They will need the new password to sign in."
        confirmLabel="Reset password"
        destructive
        busy={pending}
        onConfirm={submit}
        onCancel={() => (pending ? undefined : setOpen(false))}
      />
    </div>
  );
}
