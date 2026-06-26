import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_EMAIL, SITE_PHONE } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { resolveFaviconUrl } from "@/lib/site-favicon";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

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

  const defaultTitle = `${SITE_NAME} | ${SITE_TAGLINE}`;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: defaultTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_TAGLINE,
    applicationName: SITE_NAME,
    icons: iconUrl ? { icon: iconUrl } : undefined,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: defaultTitle,
      description: SITE_TAGLINE,
      url: getSiteUrl(),
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: SITE_TAGLINE,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_TAGLINE,
    logo: absoluteUrl("/logo.png"),
    email: SITE_EMAIL,
    telephone: SITE_PHONE,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <JsonLd data={[organizationLd, websiteLd]} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
