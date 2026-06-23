import { cache } from "react";
import { prisma } from "./prisma";

export type SiteSettings = {
  id: string;
  dualCurrencyEnabled: boolean;
  updatedAt: Date;
};

/** Returns the singleton SiteSettings row, creating it if missing. Cached per
 * request via React.cache so multiple consumers don't re-query. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", dualCurrencyEnabled: true },
  });
  return settings;
});
