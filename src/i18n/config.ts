export const locales = ["en", "ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}

export function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (!isLocale(maybeLocale)) {
    return pathname || "/";
  }

  const stripped = `/${segments.slice(2).join("/")}`.replace(/\/$/, "");
  return stripped || "/";
}

export function getLocaleFromPathname(pathname: string): Locale {
  const maybeLocale = pathname.split("/")[1];
  return isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}

export function withLocale(pathname: string, locale: Locale) {
  const cleanPath = stripLocale(pathname);
  return cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`;
}
