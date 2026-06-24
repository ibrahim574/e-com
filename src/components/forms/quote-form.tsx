"use client";

import { useState } from "react";
import { submitQuoteRequestAction } from "@/app/actions/quote";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function QuoteForm({ defaultProduct = "" }: { defaultProduct?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await submitQuoteRequestAction(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-800">Request received!</h2>
        <p className="mt-2 text-emerald-700">
          Thank you for your interest. We&apos;ve sent a confirmation to your email
          and will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" name="company" />
        </div>
      </div>
      <div>
        <Label htmlFor="productInterest">Product / Service Interested In *</Label>
        <Textarea
          id="productInterest"
          name="productInterest"
          defaultValue={defaultProduct}
          rows={3}
          required
        />
      </div>
      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Submit Quote Request
      </Button>
    </form>
  );
}
