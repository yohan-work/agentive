// Replaces the exported 404.html with a static page for GitHub Pages.
// Old links without a locale (e.g. /agents/pr-review-agent) are forwarded to the default locale;
// anything else shows a plain "not found" page.
//
// GitHub Pages can't send real HTTP redirects, so this forwarding is client-side and the response is
// still a 404 for crawlers and no-JS clients.
import { readFileSync, writeFileSync } from "node:fs";

// Read locales from the app's config so this page never drifts from the routes that were exported.
const i18nConfig = readFileSync("src/i18n/config.ts", "utf8");
const locales = JSON.parse(i18nConfig.match(/export const locales = (\[[^\]]*\])/)[1]);
const defaultLocale = i18nConfig.match(/export const defaultLocale: Locale = "([^"]+)"/)[1];
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Agent Archive</title>
<script>
(function () {
  var base = ${JSON.stringify(basePath)};
  var locales = ${JSON.stringify(locales)};
  var path = location.pathname.slice(base.length) || "/";
  if (locales.indexOf(path.split("/")[1]) === -1) {
    location.replace(base + ${JSON.stringify(`/${defaultLocale}`)} + path + location.search + location.hash);
  }
})();
</script>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #0b0b0f; color: #f4f4f5; font: 16px/1.6 system-ui, sans-serif; }
  main { max-width: 32rem; padding: 2rem; }
  p.eyebrow { color: #60a5fa; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; margin: 0 0 .75rem; }
  h1 { margin: 0; font-size: 2rem; }
  a { color: #bae6fd; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">404</p>
  <h1>Page not found</h1>
  <p>The requested page does not exist in this archive. <a href="${basePath}/${defaultLocale}/agents/">Browse agents</a></p>
</main>
</body>
</html>
`;

writeFileSync("out/404.html", html);
console.log(`Wrote out/404.html (locales: ${locales.join(", ")}; default: ${defaultLocale})`);
