"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  createCheckoutOrderAction,
  captureCheckoutOrderAction,
  cancelCheckoutOrderAction,
} from "@/app/actions/checkout";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel: () => void;
        onError: (err: unknown) => void;
      }) => { render: (el: HTMLElement) => void };
    };
  }
}

type CheckoutClientProps = {
  currency: "CAD" | "USD";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  isLoggedIn: boolean;
  userEmail?: string | null;
  userName?: string | null;
  paypalClientId: string;
};

export function CheckoutClient({
  currency,
  subtotalCents,
  shippingCents,
  totalCents,
  isLoggedIn,
  userEmail,
  userName,
  paypalClientId,
}: CheckoutClientProps) {
  const router = useRouter();
  const paypalRef = useRef<HTMLDivElement>(null);
  const orderIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!paypalClientId) return;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [paypalClientId, currency]);

  useEffect(() => {
    if (!ready || !paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: async () => {
          setError(null);
          if (!formRef.current) throw new Error("Form not ready");

          const formData = new FormData(formRef.current);
          const result = await createCheckoutOrderAction(formData);

          if (result.error || !result.paypalOrderId || !result.orderId) {
            setError(result.error ?? "Failed to create order.");
            throw new Error(result.error ?? "Failed to create order.");
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
        onError: () => {
          setError("PayPal checkout encountered an error.");
        },
      })
      .render(paypalRef.current);
  }, [ready, router]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form ref={formRef} className="space-y-4 lg:col-span-2">
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
          <Input id="shippingLine1" name="shippingLine1" required />
        </div>
        <div>
          <Label htmlFor="shippingLine2">Address Line 2</Label>
          <Input id="shippingLine2" name="shippingLine2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shippingCity">City *</Label>
            <Input id="shippingCity" name="shippingCity" required />
          </div>
          <div>
            <Label htmlFor="shippingState">State/Province *</Label>
            <Input id="shippingState" name="shippingState" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shippingPostal">Postal Code *</Label>
            <Input id="shippingPostal" name="shippingPostal" required />
          </div>
          <div>
            <Label htmlFor="shippingCountry">Country *</Label>
            <Input
              id="shippingCountry"
              name="shippingCountry"
              defaultValue={currency === "CAD" ? "CA" : "US"}
              required
            />
          </div>
        </div>

        {isLoggedIn && userEmail && (
          <p className="text-sm text-slate-600">Checkout as {userEmail}</p>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold">Pay with PayPal</h3>
          {!paypalClientId ? (
            <p className="mt-2 text-sm text-amber-700">
              PayPal is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your .env file.
            </p>
          ) : (
            <div ref={paypalRef} className="mt-4" />
          )}
          {error && <p className="mt-2 text-sm text-blue-600">{error}</p>}
        </div>
      </form>

      <div className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shippingCents === 0 ? "FREE" : formatPrice(shippingCents, currency)}
            </span>
          </div>
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
