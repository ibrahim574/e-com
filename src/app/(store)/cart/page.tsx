import Link from "next/link";
import Image from "next/image";
import { getCart, getVariantLabel } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { getProductPrice, getVariantPrice } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CartItemQuantity } from "@/components/cart/cart-item-quantity";
import { removeCartItemAction } from "@/app/actions/cart";
import { getShippingCentsForCountry } from "@/lib/shipping";
import { calcOrderTax, resolveTaxRules } from "@/lib/tax-rules";
import { formatItemFrequency } from "@/lib/order-item-frequency";

export default async function CartPage() {
  const [cart, currency] = await Promise.all([getCart(), getCurrency()]);
  const items = cart?.items ?? [];

  let subtotalCents = 0;
  const lines = items.map((item) => {
    const pricing = item.variant
      ? getVariantPrice(item.variant, item.product, currency)
      : getProductPrice(item.product, currency);
    const lineTotal = pricing.currentCents * item.quantity;
    return { item, pricing, lineTotal };
  });

  subtotalCents = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const defaultCountry = currency === "CAD" ? "CA" : "US";
  const shippingCents = await getShippingCentsForCountry(
    subtotalCents,
    defaultCountry,
    currency,
  );
  const taxRules = await resolveTaxRules(defaultCountry, "ON");
  const tax = calcOrderTax(subtotalCents, shippingCents, taxRules);
  const totalCents = subtotalCents + shippingCents + tax.taxCents;

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Your Cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600">Your cart is empty.</p>
          <Button className="mt-4" asChild>
            <Link href="/search">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {lines.map(({ item, pricing, lineTotal }) => {
              const frequency = formatItemFrequency(item);
              return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  <Image
                    src={item.product.images[0] ?? "/placeholder-product.svg"}
                    alt={item.product.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {item.product.name}
                  </Link>
                  {getVariantLabel(item.variant) && (
                    <p className="text-sm text-slate-500">
                      {getVariantLabel(item.variant)}
                    </p>
                  )}
                  {frequency && (
                    <p className="text-sm text-slate-500">{frequency}</p>
                  )}
                  <p className="mt-1 font-medium">
                    {formatPrice(pricing.currentCents, currency)}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <CartItemQuantity
                      itemId={item.id}
                      quantity={item.quantity}
                      max={item.variant?.stock ?? item.product.stock}
                    />
                    <form action={removeCartItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="text-right font-semibold">
                  {formatPrice(lineTotal, currency)}
                </div>
              </div>
            );
            })}
          </div>

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
                  {shippingCents === 0
                    ? "FREE"
                    : formatPrice(shippingCents, currency)}
                </span>
              </div>
              {tax.taxCents > 0 && (
                <div className="flex justify-between">
                  <span>{tax.taxLabel}</span>
                  <span>{formatPrice(tax.taxCents, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(totalCents, currency)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tax calculated at checkout based on your shipping address.
            </p>
            <Button className="mt-6 w-full" size="lg" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
