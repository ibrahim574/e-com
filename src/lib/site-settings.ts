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
  updatedAt: Date;
};

const DEFAULTS = {
  dualCurrencyEnabled: true,
  taxLabel: "HST",
  taxRatePercent: 13,
  companyName: "WirelessCom",
  quoteRecipients: "abu@wirelesscom.ca, service@wirelesscom.ca",
  sessionTimeoutMinutes: 30,
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
