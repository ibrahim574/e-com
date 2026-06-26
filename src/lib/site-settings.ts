import { cache } from "react";
import { prisma } from "./prisma";
import { cacheGet, cacheSet } from "./cache";

export type SiteSettings = {
  id: string;
  dualCurrencyEnabled: boolean;
  taxLabel: string;
  taxRatePercent: number;
  companyName: string;
  quoteRecipients: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPasswordEnc: string | null;
  smtpFrom: string | null;
  sessionTimeoutMinutes: number;
  announcementText: string;
  announcementEnabled: boolean;
  proudlyCanadianEnabled: boolean;
  siteLogoUrl: string | null;
  siteFaviconUrl: string | null;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappGreeting: string | null;
  cashOnPickupEnabled: boolean;
  cashPickupInstructions: string | null;
  interacEnabled: boolean;
  interacEmail: string | null;
  interacInstructions: string | null;
  fraudHighValueCents: number;
  updatedAt: Date;
};

const DEFAULTS = {
  dualCurrencyEnabled: true,
  taxLabel: "HST",
  taxRatePercent: 13,
  companyName: "Hytera Radios - Operated by WirelessCom.ca Inc.",
  quoteRecipients: "abu@wirelesscom.ca, service@wirelesscom.ca",
  sessionTimeoutMinutes: 30,
  announcementText: "Free shipping available on eligible products and orders.",
  announcementEnabled: true,
  proudlyCanadianEnabled: true,
};

/** Returns the singleton SiteSettings row, creating it if missing. Cached per request. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const cached = cacheGet<SiteSettings>("site-settings");
  if (cached) return cached;

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", ...DEFAULTS },
  });

  cacheSet("site-settings", settings);
  return settings;
});

export function parseQuoteRecipients(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
