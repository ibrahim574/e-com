import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { getShippingCentsForCountry } from "@/lib/shipping";
import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";

export default async function CheckoutPage() {
  const session = await auth();
  const [cart, currency] = await Promise.all([getCart(), getCurrency()]);

  if (!cart?.items.length) {
    redirect("/cart");
  }

  let subtotalCents = 0;
  for (const item of cart.items) {
    const pricing = item.variant
      ? getVariantPrice(item.variant, item.product, currency)
      : getProductPrice(item.product, currency);
    subtotalCents += pricing.currentCents * item.quantity;
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

  const shippingCents = await getShippingCentsForCountry(
    subtotalCents,
    defaultCountry,
    currency,
  );
  const taxRules = await resolveTaxRules(defaultCountry, defaultState);
  const tax = calcOrderTax(subtotalCents, shippingCents, taxRules);
  const totalCents = subtotalCents + shippingCents + tax.taxCents;

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Checkout</h1>
      <div className="mt-8">
        <CheckoutClient
          currency={currency}
          subtotalCents={subtotalCents}
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
        />
      </div>
    </div>
  );
}
