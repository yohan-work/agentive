import type { Metadata } from "next";
import { AgentSearchPanel } from "@/components/agents/agent-search-panel";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories, roles } from "@/data/taxonomy";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Agents"
};

async function AgentsPageContent({
  searchParams,
  locale = defaultLocale
}: {
  searchParams?: Promise<{ query?: string }>;
  locale?: Locale;
}) {
  const params = await searchParams;
  const dictionary = getDictionary(locale);

  return (
    <AppShell toc={[{ title: dictionary.agents.tocLibrary, href: "#agents" }, { title: dictionary.agents.filters, href: "#filters" }]}>
      <header id="agents" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.agents.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.agents.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          {dictionary.agents.description}
        </p>
      </header>
      <div id="filters">
        <AgentSearchPanel
          agents={agents}
          initialQuery={params?.query ?? ""}
          roles={roles.map((role) => role.slug)}
          categories={categories.map((category) => category.slug)}
          locale={locale}
        />
      </div>
    </AppShell>
  );
}

export default async function AgentsPage({ searchParams }: { searchParams?: Promise<{ query?: string }> }) {
  return <AgentsPageContent searchParams={searchParams} locale={await getRequestLocale()} />;
}
