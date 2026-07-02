import type { Metadata } from "next";
import { CaseExplorer } from "@/components/cases/case-explorer";
import { SectionHeading } from "@/components/common/section-heading";
import { ImpactShowcase } from "@/components/impact/impact-showcase";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { impactScenarios } from "@/data/impact-scenarios";
import { categories, roles } from "@/data/taxonomy";
import { getAgentUseCases } from "@/lib/use-cases";

export const metadata: Metadata = {
  title: "Use Cases"
};

export default function CasesPage() {
  const useCases = getAgentUseCases(agents);
  const workflows = Array.from(
    new Set(useCases.map((useCase) => useCase.recommendedWorkflow).filter((value): value is string => Boolean(value)))
  ).sort();

  return (
    <AppShell toc={[{ title: "Use Case Library", href: "#cases" }, { title: "Impact", href: "#impact" }, { title: "Filters", href: "#filters" }]}>
      <header id="cases" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Applied library</p>
        <h1 className="text-4xl font-semibold text-primary">Use Cases</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          Browse practical Korean work scenarios connected to reusable agents. Start from a problem, then open the agent that can produce the output.
        </p>
      </header>
      <section id="impact" className="border-b border-line pb-8">
        <SectionHeading
          title="Before and after"
          description="Start here if agents are new to you. Each scenario shows the work state before, the agents used, and the visible output after."
        />
        <ImpactShowcase scenarios={impactScenarios} />
      </section>
      <div id="filters">
        <CaseExplorer
          useCases={useCases}
          roles={roles.map((role) => role.slug)}
          categories={categories.map((category) => category.slug)}
          workflows={workflows}
        />
      </div>
    </AppShell>
  );
}
