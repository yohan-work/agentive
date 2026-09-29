import type { MetadataRoute } from "next";
import { agents } from "@/data/agents";
import { categories, roles } from "@/data/taxonomy";
import { workflows } from "@/data/workflows";
import { defaultLocale, locales } from "@/i18n/config";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

// Bookmarks is left out: it only shows what the visitor saved in this browser.
const staticPaths = ["", "/agents", "/workflows", "/categories", "/roles", "/cases", "/install", "/submit", "/about"];

type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedUrl(locale: string, path: string) {
  return `${siteConfig.url}/${locale}${path}/`;
}

function entry(path: string, lastModified?: string): SitemapEntry[] {
  const languages = Object.fromEntries(locales.map((locale) => [locale, localizedUrl(locale, path)]));
  const alternates = { languages: { ...languages, "x-default": localizedUrl(defaultLocale, path) } };

  return locales.map((locale) => ({
    url: localizedUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticPaths.flatMap((path) => entry(path)),
    ...agents.flatMap((agent) => entry(`/agents/${agent.slug}`, agent.updatedAt)),
    ...workflows.flatMap((workflow) => entry(`/workflows/${workflow.slug}`)),
    ...categories.flatMap((category) => entry(`/categories/${category.slug}`)),
    ...roles.flatMap((role) => entry(`/roles/${role.slug}`))
  ];
}
