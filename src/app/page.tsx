import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentGrid } from "@/components/agents/agent-grid";
import { ButtonLink } from "@/components/common/button";
import { Card } from "@/components/common/card";
import { SectionHeading } from "@/components/common/section-heading";
import { AppShell } from "@/components/layout/app-shell";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { featuredAgents } from "@/data/agents";
import { categories, roles, taskTags } from "@/data/taxonomy";
import { workflows } from "@/data/workflows";

const toc = [
  { title: "Overview", href: "#overview" },
  { title: "Featured Agents", href: "#featured-agents" },
  { title: "Browse by Role", href: "#browse-by-role" },
  { title: "Browse by Task", href: "#browse-by-task" },
  { title: "Workflow Packs", href: "#workflow-packs" }
];

export default function HomePage() {
  return (
    <AppShell toc={toc}>
      <section className="border-b border-line pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">AI agent archive</p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-primary sm:text-6xl">Agent Archive</h1>
        <p className="mt-4 max-w-3xl text-xl leading-8 text-secondary">
          Find, use, and organize AI agents for every workflow.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary">
          A curated archive of AI agents, prompts, and workflow recipes for real work across planning, design,
          development, marketing, sales, and operations.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href="/agents" variant="primary">
            Browse agents <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/workflows">Explore workflows</ButtonLink>
        </div>
      </section>

      <section id="overview" className="border-b border-line py-10">
        <SectionHeading
          title="Overview"
          description="Agent Archive is not just a prompt list. Each entry is framed as a reusable work recipe with inputs, expected outputs, practical limits, and related agents."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {["Context first", "Copy-ready prompts", "Workflow packs"].map((item) => (
            <Card key={item} className="p-5">
              <h3 className="font-semibold text-primary">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Agents are organized around actual jobs to be done, not abstract prompt tricks.
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="featured-agents" className="border-b border-line py-10">
        <SectionHeading title="Featured Agents" description="A starting set of practical agents for common work handoffs." />
        <AgentGrid agents={featuredAgents} />
      </section>

      <section id="browse-by-role" className="border-b border-line py-10">
        <SectionHeading title="Browse by Role" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.slice(0, 6).map((role) => (
            <Link key={role.slug} href={`/roles/${role.slug}`} className="rounded-lg border border-line bg-panel p-4 transition hover:border-accent/35 hover:bg-elevated">
              <h3 className="font-semibold text-primary">{role.name}</h3>
              <p className="mt-1 text-sm leading-6 text-secondary">{role.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="browse-by-task" className="border-b border-line py-10">
        <SectionHeading title="Browse by Task" />
        <div className="flex flex-wrap gap-2">
          {[...taskTags, ...categories.slice(0, 4).map((category) => category.slug)].map((task) => (
            <Link key={task} href={`/agents?query=${task}`} className="rounded-md border border-line bg-elevated px-3 py-2 text-sm text-secondary transition hover:border-accent/35 hover:text-primary">
              {task}
            </Link>
          ))}
        </div>
      </section>

      <section id="workflow-packs" className="py-10">
        <SectionHeading title="Workflow Packs" description="Multi-agent playbooks for complete business and production workflows." />
        <div className="grid gap-4">
          {workflows.slice(0, 4).map((workflow) => (
            <WorkflowCard key={workflow.slug} workflow={workflow} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
