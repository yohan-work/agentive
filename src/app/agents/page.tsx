import type { Metadata } from "next";
import { AgentSearchPanel } from "@/components/agents/agent-search-panel";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories, roles } from "@/data/taxonomy";

export const metadata: Metadata = {
  title: "Agents"
};

export default async function AgentsPage({
  searchParams
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell toc={[{ title: "Agent Library", href: "#agents" }, { title: "Filters", href: "#filters" }]}>
      <header id="agents" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Library</p>
        <h1 className="text-4xl font-semibold text-primary">Agents</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Search and filter practical AI agents by role, task, tool, automation level, and verification status.
        </p>
      </header>
      <div id="filters">
        <AgentSearchPanel
          agents={agents}
          initialQuery={params?.query ?? ""}
          roles={roles.map((role) => role.slug)}
          categories={categories.map((category) => category.slug)}
        />
      </div>
    </AppShell>
  );
}
