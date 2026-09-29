import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { siteConfig } from "@/lib/site";
import "../globals.css";

// Only the known locales are generated; anything else is a 404 in the static export.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  // A static file (not an opengraph-image route) so the export has a stable, extension-bearing URL.
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImagePath, width: 1200, height: 630, alt: siteConfig.name }]
  },
  twitter: {
    card: "summary_large_image",
    images: [siteConfig.ogImagePath]
  }
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
