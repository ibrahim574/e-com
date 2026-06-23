"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CURRENCY_COOKIE } from "@/lib/currency-server";
import { getSiteSettings } from "@/lib/site-settings";

export async function setCurrencyAction(currency: "CAD" | "USD") {
  const settings = await getSiteSettings();
  if (!settings.dualCurrencyEnabled) {
    // Ignore: store is locked to CAD only.
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
