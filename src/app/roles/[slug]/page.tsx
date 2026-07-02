import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentGrid } from "@/components/agents/agent-grid";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { roles } from "@/data/taxonomy";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export function generateStaticParams() {
  return roles.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = roles.find((item) => item.slug === slug);
  return { title: role?.name ?? "Role" };
}

async function RolePageContent({
  params,
  locale = defaultLocale
}: {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}) {
  const { slug } = await params;
  const role = roles.find((item) => item.slug === slug);
  const dictionary = getDictionary(locale);

  if (!role) {
    notFound();
  }

  const matchingAgents = agents.filter((agent) => agent.roles.includes(role.slug));

  return (
    <AppShell toc={[{ title: role.name, href: "#role" }, { title: dictionary.nav.agents, href: "#agents" }]}>
      <header id="role" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.roles.title}</p>
        <h1 className="text-4xl font-semibold text-primary">{role.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{role.description}</p>
      </header>
      <section id="agents">
        <AgentGrid agents={matchingAgents} locale={locale} />
      </section>
    </AppShell>
  );
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  return <RolePageContent params={params} locale={await getRequestLocale()} />;
}
