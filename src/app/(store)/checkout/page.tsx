import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { getShippingCentsForCountry } from "@/lib/shipping";
import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveCartDiscount } from "@/lib/coupons";

export default async function CheckoutPage() {
  const session = await auth();
  const [cart, currency, settings] = await Promise.all([
    getCart(),
    getCurrency(),
    getSiteSettings(),
  ]);

  if (!cart?.items.length) {
    redirect("/cart");
  }

  let subtotalCents = 0;
  const couponItems: { productId: string; quantity: number; unitPriceCents: number }[] = [];
  for (const item of cart.items) {
    const pricing = item.variant
      ? getVariantPrice(item.variant, item.product, currency)
      : getProductPrice(item.product, currency);
    subtotalCents += pricing.currentCents * item.quantity;
    couponItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: pricing.currentCents,
    });
  }

  const profile = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          addressCity: true,
          addressState: true,
          addressPostal: true,
          addressCountry: true,
        },
      })
    : null;

  const defaultCountry =
    profile?.addressCountry ?? (currency === "CAD" ? "CA" : "US");
  const defaultState = profile?.addressState ?? "ON";

  const discount = await resolveCartDiscount(cart.couponCode ?? null, {
    subtotalCents,
    shippingCents: 0,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    items: couponItems,
  });
  const discountCents = discount?.discountCents ?? 0;
  const freeShipping = discount?.freeShipping ?? false;

  const rawShippingCents = await getShippingCentsForCountry(
    subtotalCents,
    defaultCountry,
    currency,
  );
  const shippingCents = freeShipping ? 0 : rawShippingCents;
  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);
  const taxRules = await resolveTaxRules(defaultCountry, defaultState);
  const tax = calcOrderTax(discountedSubtotal, shippingCents, taxRules);
  const totalCents = discountedSubtotal + shippingCents + tax.taxCents;

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Checkout</h1>
      <div className="mt-8">
        <CheckoutClient
          currency={currency}
          subtotalCents={subtotalCents}
          discountCents={discountCents}
          freeShipping={freeShipping}
          couponLabel={discount?.label ?? null}
          shippingCents={shippingCents}
          taxCents={tax.taxCents}
          taxLabel={tax.taxLabel}
          totalCents={totalCents}
          isLoggedIn={!!session?.user}
          userEmail={session?.user?.email}
          userName={session?.user?.name}
          shippingDefaults={{
            line1: profile?.addressLine1 ?? "",
            line2: profile?.addressLine2 ?? "",
            city: profile?.addressCity ?? "",
            state: defaultState,
            postal: profile?.addressPostal ?? "",
            country: defaultCountry,
          }}
          paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""}
          offlineMethods={{
            cash: settings.cashOnPickupEnabled,
            interac: settings.interacEnabled,
          }}
        />
      </div>
    </div>
  );
}
