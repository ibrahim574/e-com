import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCart } from "@/lib/cart";
import { getCurrency } from "@/lib/currency-server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, currency, categories, industries, settings] = await Promise.all([
    getCart(),
    getCurrency(),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.industry.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    getSiteSettings(),
  ]);
  const cartCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <>
      <Header
        cartCount={cartCount}
        currency={currency}
        dualCurrency={settings.dualCurrencyEnabled}
        categories={categories}
        industries={industries}
        announcementText={settings.announcementText}
        announcementEnabled={settings.announcementEnabled}
      />
      <main className="flex-1">{children}</main>
      <Footer
        dualCurrency={settings.dualCurrencyEnabled}
        proudlyCanadianEnabled={settings.proudlyCanadianEnabled}
      />
    </>
  );
}
