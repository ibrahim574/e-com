"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  createCheckoutOrderAction,
  captureCheckoutOrderAction,
  cancelCheckoutOrderAction,
  createOfflineOrderAction,
} from "@/app/actions/checkout";
import { previewTaxAction } from "@/app/actions/tax";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel: () => void;
        onError: (err: unknown) => void;
      }) => { render: (el: HTMLElement) => void; close?: () => void };
    };
  }
}

type ShippingDefaults = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

type CheckoutClientProps = {
  currency: "CAD" | "USD";
  subtotalCents: number;
  discountCents: number;
  freeShipping: boolean;
  couponLabel: string | null;
  shippingCents: number;
  taxCents: number;
  taxLabel: string;
  totalCents: number;
  isLoggedIn: boolean;
  userEmail?: string | null;
  userName?: string | null;
  shippingDefaults?: ShippingDefaults;
  paypalClientId: string;
  offlineMethods: { cash: boolean; interac: boolean };
};

type PaymentMethod = "paypal" | "cash" | "interac";

export function CheckoutClient({
  currency,
  subtotalCents,
  discountCents,
  freeShipping,
  couponLabel,
  shippingCents: initialShipping,
  taxCents: initialTax,
  taxLabel: initialTaxLabel,
  totalCents: initialTotal,
  isLoggedIn,
  userEmail,
  userName,
  shippingDefaults,
  paypalClientId,
  offlineMethods,
}: CheckoutClientProps) {
  const router = useRouter();
  const paypalRef = useRef<HTMLDivElement>(null);
  const orderIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const paypalEnabled = Boolean(paypalClientId);
  const [method, setMethod] = useState<PaymentMethod>(
    paypalEnabled ? "paypal" : offlineMethods.cash ? "cash" : "interac",
  );
  const hasOffline = offlineMethods.cash || offlineMethods.interac;

  const [shippingCents, setShippingCents] = useState(initialShipping);
  const [taxCents, setTaxCents] = useState(initialTax);
  const [taxLabel, setTaxLabel] = useState(initialTaxLabel);
  const [totalCents, setTotalCents] = useState(initialTotal);

  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);

  const recalcTotals = useCallback(async () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const country = String(fd.get("shippingCountry") ?? "CA");
    const province = String(fd.get("shippingState") ?? "");
    const result = await previewTaxAction({
      subtotalCents: discountedSubtotal,
      country,
      province,
      currency,
    });
    const nextShipping = freeShipping ? 0 : result.shippingCents;
    setShippingCents(nextShipping);
    setTaxCents(result.taxCents);
    setTaxLabel(result.taxLabel);
    setTotalCents(discountedSubtotal + nextShipping + result.taxCents);
  }, [discountedSubtotal, freeShipping, currency]);

  useEffect(() => {
    if (!paypalClientId) return;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=${currency}&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Failed to load PayPal. Check your connection or client ID.");
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      setReady(false);
    };
  }, [paypalClientId, currency]);

  useEffect(() => {
    if (method !== "paypal") return;
    if (!ready || !paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = "";

    const buttons = window.paypal
      .Buttons({
        createOrder: async () => {
          setError(null);
          if (!formRef.current) throw new Error("Form not ready");

          const formData = new FormData(formRef.current);
          const result = await createCheckoutOrderAction(formData);

          if (result.error || !result.paypalOrderId || !result.orderId) {
            const msg = result.error ?? "Failed to create order.";
            setError(msg);
            throw new Error(msg);
          }

          orderIdRef.current = result.orderId;
          return result.paypalOrderId;
        },
        onApprove: async (data) => {
          const currentOrderId = orderIdRef.current;
          if (!currentOrderId) return;
          const result = await captureCheckoutOrderAction(currentOrderId, data.orderID);
          if (result.error) {
            setError(result.error);
            return;
          }
          router.push(`/checkout/success?order=${result.orderNumber}`);
        },
        onCancel: async () => {
          if (orderIdRef.current) {
            await cancelCheckoutOrderAction(orderIdRef.current);
          }
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "PayPal checkout encountered an error.";
          if (!message.includes("Form not ready")) {
            setError(message);
          }
        },
      });

    buttons.render(paypalRef.current);

    return () => {
      buttons.close?.();
    };
  }, [ready, router, currency, totalCents, method]);

  async function handleOfflineSubmit() {
    if (!formRef.current) return;
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(formRef.current);
      formData.set("paymentMethod", method);
      const result = await createOfflineOrderAction(formData);
      if (!result || result.error || !result.orderNumber) {
        setError(result?.error ?? "Could not place your order.");
        return;
      }
      router.push(
        `/checkout/success?order=${result.orderNumber}&method=${method}`,
      );
    } catch {
      setError("Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form
        ref={formRef}
        className="space-y-4 lg:col-span-2"
        onChange={() => void recalcTotals()}
      >
        <h2 className="text-xl font-bold">Shipping Information</h2>

        {!isLoggedIn && (
          <div>
            <Label htmlFor="guestEmail">Email *</Label>
            <Input id="guestEmail" name="guestEmail" type="email" required />
          </div>
        )}

        <div>
          <Label htmlFor="shippingName">Full Name *</Label>
          <Input
            id="shippingName"
            name="shippingName"
            defaultValue={userName ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="shippingLine1">Address Line 1 *</Label>
          <Input
            id="shippingLine1"
            name="shippingLine1"
            defaultValue={shippingDefaults?.line1 ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="shippingLine2">Address Line 2</Label>
          <Input
            id="shippingLine2"
            name="shippingLine2"
            defaultValue={shippingDefaults?.line2 ?? ""}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shippingCity">City *</Label>
            <Input
              id="shippingCity"
              name="shippingCity"
              defaultValue={shippingDefaults?.city ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="shippingState">State/Province *</Label>
            <Input
              id="shippingState"
              name="shippingState"
              defaultValue={shippingDefaults?.state ?? ""}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shippingPostal">Postal Code *</Label>
            <Input
              id="shippingPostal"
              name="shippingPostal"
              defaultValue={shippingDefaults?.postal ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="shippingCountry">Country *</Label>
            <Input
              id="shippingCountry"
              name="shippingCountry"
              defaultValue={
                shippingDefaults?.country ?? (currency === "CAD" ? "CA" : "US")
              }
              required
            />
          </div>
        </div>

        {isLoggedIn && userEmail && (
          <p className="text-sm text-slate-600">Checkout as {userEmail}</p>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-semibold">Payment Method</h3>

          {(paypalEnabled ? 1 : 0) + (hasOffline ? 1 : 0) > 0 && (
            <div className="mt-3 space-y-2">
              {paypalEnabled && (
                <MethodOption
                  id="pm-paypal"
                  label="Pay with PayPal / Card"
                  checked={method === "paypal"}
                  onSelect={() => setMethod("paypal")}
                />
              )}
              {offlineMethods.cash && (
                <MethodOption
                  id="pm-cash"
                  label="Cash on Pickup"
                  checked={method === "cash"}
                  onSelect={() => setMethod("cash")}
                />
              )}
              {offlineMethods.interac && (
                <MethodOption
                  id="pm-interac"
                  label="Interac e-Transfer"
                  checked={method === "interac"}
                  onSelect={() => setMethod("interac")}
                />
              )}
            </div>
          )}

          {method === "paypal" &&
            (!paypalEnabled ? (
              <p className="mt-3 text-sm text-amber-700">
                PayPal is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your
                .env file.
              </p>
            ) : (
              <div ref={paypalRef} className="mt-4" />
            ))}

          {method !== "paypal" && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {method === "cash"
                  ? "Place your order now and pay in cash when you pick it up. We'll confirm your order details."
                  : "Place your order now. After ordering you'll receive Interac e-Transfer instructions to complete payment."}
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={submitting}
                onClick={() => void handleOfflineSubmit()}
              >
                {submitting ? "Placing order…" : "Place order"}
              </Button>
            </div>
          )}

          {!paypalEnabled && !hasOffline && (
            <p className="mt-3 text-sm text-amber-700">
              No payment methods are currently available. Please contact us to
              complete your purchase.
            </p>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>

      <div className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents, currency)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount{couponLabel ? ` (${couponLabel})` : ""}</span>
              <span>-{formatPrice(discountCents, currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shippingCents === 0 ? "FREE" : formatPrice(shippingCents, currency)}
            </span>
          </div>
          {taxCents > 0 && (
            <div className="flex justify-between">
              <span>{taxLabel}</span>
              <span>{formatPrice(taxCents, currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(totalCents, currency)}</span>
          </div>
        </div>
        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/cart">Back to Cart</Link>
        </Button>
      </div>
    </div>
  );
}

function MethodOption({
  id,
  label,
  checked,
  onSelect,
}: {
  id: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
        checked
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="paymentMethodChoice"
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4"
      />
      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
    </label>
  );
}
