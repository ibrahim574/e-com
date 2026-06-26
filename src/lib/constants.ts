export const SITE_NAME = "Hytera Radios";
export const SITE_TAGLINE = "Professional Two-Way Radios & Communication Solutions";
export const SITE_PHONE = "1-800-705-3189";
export const SITE_EMAIL = "service@wirelesscom.ca";

/** Display name for all transactional / OTP emails */
export const EMAIL_BRAND_NAME = "Hytera Radios - Operated by WirelessCom.ca Inc.";

export const PARENT_COMPANY = "WirelessCom.ca Inc.";
export const PARENT_COMPANY_URL = "https://www.wirelesscom.org/";
export const SITE_DOMAIN = "Hyteraradio.ca";

export const SITE_ADDRESS_LINES = [
  "WirelessCom.ca Inc.",
  "97 White Oak Drive East",
  "Sault Ste. Marie, ON P6B 4J7",
] as const;

export const SITE_ADDRESS_QUERY = "WirelessCom.ca Inc, 97 White Oak Drive East, Sault Ste. Marie, ON P6B 4J7";

export const SITE_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(
  SITE_ADDRESS_QUERY,
)}&z=15&hl=en&output=embed`;

export const SITE_MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SITE_ADDRESS_QUERY,
)}`;

export const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal"] as const;

export const SHIPPING_FLAT_RATE_CAD_CENTS = 1500;
export const SHIPPING_FLAT_RATE_USD_CENTS = 1200;
export const FREE_SHIPPING_THRESHOLD_CAD_CENTS = 12500;
export const FREE_SHIPPING_THRESHOLD_USD_CENTS = 10000;

export function getShippingCents(subtotalCents: number, currency: "CAD" | "USD") {
  const threshold =
    currency === "CAD"
      ? FREE_SHIPPING_THRESHOLD_CAD_CENTS
      : FREE_SHIPPING_THRESHOLD_USD_CENTS;
  const flatRate =
    currency === "CAD"
      ? SHIPPING_FLAT_RATE_CAD_CENTS
      : SHIPPING_FLAT_RATE_USD_CENTS;

  return subtotalCents >= threshold ? 0 : flatRate;
}
