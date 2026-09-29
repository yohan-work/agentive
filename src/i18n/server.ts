import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

export type LocaleParams<T extends Record<string, string> = Record<never, string>> = Promise<{ locale: string } & T>;

/** Reads the locale segment from route params; unknown locales 404. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return locale;
}
