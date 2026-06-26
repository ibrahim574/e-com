import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-settings";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; method?: string }>;
}) {
  const { order, method } = await searchParams;

  let instructionsTitle: string | null = null;
  let instructions: string | null = null;
  if (method === "cash" || method === "interac") {
    const settings = await getSiteSettings();
    if (method === "cash") {
      instructionsTitle = "Cash on Pickup";
      instructions =
        settings.cashPickupInstructions ||
        "Your order is reserved. Please bring payment when you pick up your order.";
    } else {
      instructionsTitle = "Interac e-Transfer";
      const email = settings.interacEmail
        ? `\nSend your e-Transfer to: ${settings.interacEmail}`
        : "";
      instructions =
        (settings.interacInstructions ||
          "Please complete your Interac e-Transfer to finish your order.") + email;
    }
  }

  return (
    <div className="container-page py-16 text-center">
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-10 dark:border-green-900/50 dark:bg-green-950/20">
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-300">
          Thank You!
        </h1>
        <p className="mt-4 text-slate-700 dark:text-slate-300">
          Your order has been placed successfully.
        </p>
        {order && (
          <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
            Order number: {order}
          </p>
        )}
        {instructions && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              {instructionsTitle} — payment instructions
            </h2>
            <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">
              {instructions}
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/search">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">View Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
