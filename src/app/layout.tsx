import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveFaviconUrl } from "@/lib/site-favicon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let iconUrl: string | null = null;
  try {
    const settings = await getSiteSettings();
    iconUrl = resolveFaviconUrl(settings.siteFaviconUrl, settings.siteLogoUrl);
  } catch {
    // settings unavailable (e.g. during build) — fall back to default icon
  }

  return {
    title: {
      default: `${SITE_NAME} | ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_TAGLINE,
    icons: iconUrl ? { icon: iconUrl } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
