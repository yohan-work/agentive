"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/common/button";
import { getLocaleFromPathname, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// not-found boundaries don't receive route params, so the locale comes from the URL.
export function NotFoundContent() {
  const locale = getLocaleFromPathname(usePathname());
  const { notFound } = getDictionary(locale);

  return (
    <div className="py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">404</p>
      <h1 className="text-4xl font-semibold text-primary">{notFound.title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-secondary">{notFound.description}</p>
      <div className="mt-6">
        <ButtonLink href={withLocale("/agents", locale)} variant="primary">
          {notFound.browse}
        </ButtonLink>
      </div>
    </div>
  );
}
