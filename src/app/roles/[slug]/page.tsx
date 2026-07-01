import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentGrid } from "@/components/agents/agent-grid";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { roles } from "@/data/taxonomy";

export function generateStaticParams() {
  return roles.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = roles.find((item) => item.slug === slug);
  return { title: role?.name ?? "Role" };
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = roles.find((item) => item.slug === slug);

  if (!role) {
    notFound();
  }

  const matchingAgents = agents.filter((agent) => agent.roles.includes(role.slug));

  return (
    <AppShell toc={[{ title: role.name, href: "#role" }, { title: "Agents", href: "#agents" }]}>
      <header id="role" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Role</p>
        <h1 className="text-4xl font-semibold text-primary">{role.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">{role.description}</p>
      </header>
      <section id="agents">
        <AgentGrid agents={matchingAgents} />
      </section>
    </AppShell>
  );
}
