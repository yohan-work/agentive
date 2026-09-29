import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitForm } from "@/components/submit/submit-form";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).submit.title };
}

export default async function SubmitPage({ params }: { params: LocaleParams }) {
  const dictionary = getDictionary(await resolveLocale(params));

  return (
    <AppShell toc={[{ title: dictionary.submit.title, href: "#submit" }]}>
      <header id="submit" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.submit.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.submit.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{dictionary.submit.description}</p>
      </header>
      <SubmitForm buttonLabel={dictionary.submit.button} helpText={dictionary.submit.help} />
    </AppShell>
  );
}
