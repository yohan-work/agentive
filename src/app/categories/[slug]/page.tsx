import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentGrid } from "@/components/agents/agent-grid";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories } from "@/data/taxonomy";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const matchingAgents = agents.filter((agent) => agent.categories.includes(category.slug));

  return (
    <AppShell toc={[{ title: category.name, href: "#category" }, { title: "Agents", href: "#agents" }]}>
      <header id="category" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Category</p>
        <h1 className="text-4xl font-semibold text-primary">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{category.description}</p>
      </header>
      <section id="agents">
        <AgentGrid agents={matchingAgents} />
      </section>
    </AppShell>
  );
}
