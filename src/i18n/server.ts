import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const headerLocale = (await headers()).get("x-locale") ?? undefined;
  if (isLocale(headerLocale)) {
    return headerLocale;
  }

  return defaultLocale;
}
