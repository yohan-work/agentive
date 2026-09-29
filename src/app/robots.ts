import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

// Crawlers only read robots.txt at the origin root, so this takes effect when the site is served without a
// base path (e.g. a custom domain). Under a GitHub Pages sub-path, submit sitemap.xml in Search Console instead.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
