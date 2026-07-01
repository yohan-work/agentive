import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { workflows } from "@/data/workflows";

export const metadata: Metadata = {
  title: "Workflows"
};

export default function WorkflowsPage() {
  return (
    <AppShell toc={[{ title: "Workflow Packs", href: "#workflows" }]}>
      <header id="workflows" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Playbooks</p>
        <h1 className="text-4xl font-semibold text-primary">Workflow Packs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Multi-agent workflows that combine planning, research, copy, development, and operations into complete playbooks.
        </p>
      </header>
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.slug} workflow={workflow} />
        ))}
      </div>
    </AppShell>
  );
}
