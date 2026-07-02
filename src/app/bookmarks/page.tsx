import type { Metadata } from "next";
import { BookmarksList } from "@/components/agents/bookmarks-list";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Bookmarks"
};

function BookmarksPageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <AppShell toc={[{ title: dictionary.bookmarks.title, href: "#bookmarks" }]}>
      <header id="bookmarks" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.bookmarks.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.bookmarks.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          {dictionary.bookmarks.description}
        </p>
      </header>
      <BookmarksList agents={agents} />
    </AppShell>
  );
}

export default async function BookmarksPage() {
  return <BookmarksPageContent locale={await getRequestLocale()} />;
}
