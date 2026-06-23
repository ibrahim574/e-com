import { cookies } from "next/headers";
import type { Currency } from "./currency";
import { getSiteSettings } from "./site-settings";

export const CURRENCY_COOKIE = "store_currency";

export async function getCurrency(): Promise<Currency> {
  const settings = await getSiteSettings();
  if (!settings.dualCurrencyEnabled) {
    return "CAD";
  }
  const cookieStore = await cookies();
  const value = cookieStore.get(CURRENCY_COOKIE)?.value;
  return value === "USD" ? "USD" : "CAD";
}

export type { Currency };
