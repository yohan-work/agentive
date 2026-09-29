import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { siteConfig } from "@/lib/site";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(params)).about.title };
}

export default async function AboutPage({ params }: { params: LocaleParams }) {
  const { about } = getDictionary(await resolveLocale(params));

  return (
    <AppShell toc={[{ title: about.tocWhat, href: "#what-it-is" }, { title: about.tocOpenSource, href: "#open-source" }]}>
      <header id="what-it-is" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{about.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{siteConfig.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">{about.description}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {about.principles.map(([title, description]) => (
          <Card key={title} className="p-5">
            <h2 className="font-semibold text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>
          </Card>
        ))}
      </section>
      <section id="open-source" className="mt-10 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold text-primary">{about.openSourceTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">{about.openSourceBody}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href={siteConfig.repoUrl} className="rounded-md border border-line bg-panel px-3 py-2 text-sky-200 hover:border-accent/35">
            {about.repoLink}
          </Link>
          <Link
            href={`${siteConfig.repoUrl}/blob/main/CONTRIBUTING.md`}
            className="rounded-md border border-line bg-panel px-3 py-2 text-sky-200 hover:border-accent/35"
          >
            {about.contributingLink}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
