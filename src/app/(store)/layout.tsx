import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppWidget } from "@/components/layout/whatsapp-widget";
import { ToastProvider } from "@/components/ui/toast-provider";
import { CompareProvider } from "@/components/compare/compare-context";
import { CompareBar } from "@/components/compare/compare-bar";
import { auth } from "@/lib/auth";
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
  const [cart, currency, categories, industries, settings, session] =
    await Promise.all([
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
      auth(),
    ]);
  const cartCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, avatarUrl: true },
      })
    : null;

  return (
    <ToastProvider>
      <CompareProvider>
        <Header
          cartCount={cartCount}
          currency={currency}
          dualCurrency={settings.dualCurrencyEnabled}
          categories={categories}
          industries={industries}
          announcementText={settings.announcementText}
          announcementEnabled={settings.announcementEnabled}
          logoUrl={settings.siteLogoUrl}
          avatarUrl={currentUser?.avatarUrl}
          userName={currentUser?.name}
        />
        <main className="flex-1">{children}</main>
        <Footer
          dualCurrency={settings.dualCurrencyEnabled}
          proudlyCanadianEnabled={settings.proudlyCanadianEnabled}
          logoUrl={settings.siteLogoUrl}
        />
        {settings.whatsappEnabled && settings.whatsappNumber && (
          <WhatsAppWidget
            number={settings.whatsappNumber}
            greeting={settings.whatsappGreeting}
          />
        )}
        <CompareBar />
      </CompareProvider>
    </ToastProvider>
  );
}
