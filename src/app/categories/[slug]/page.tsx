import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentGrid } from "@/components/agents/agent-grid";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories } from "@/data/taxonomy";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return { title: category?.name ?? "Category" };
}

async function CategoryPageContent({
  params,
  locale = defaultLocale
}: {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  const dictionary = getDictionary(locale);

  if (!category) {
    notFound();
  }

  const matchingAgents = agents.filter((agent) => agent.categories.includes(category.slug));

  return (
    <AppShell toc={[{ title: category.name, href: "#category" }, { title: dictionary.nav.agents, href: "#agents" }]}>
      <header id="category" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.categories.title}</p>
        <h1 className="text-4xl font-semibold text-primary">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{category.description}</p>
      </header>
      <section id="agents">
        <AgentGrid agents={matchingAgents} locale={locale} />
      </section>
    </AppShell>
  );
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryPageContent params={params} locale={await getRequestLocale()} />;
}
