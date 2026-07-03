import type { Metadata } from "next";
import { CaseExplorer } from "@/components/cases/case-explorer";
import { SectionHeading } from "@/components/common/section-heading";
import { ImpactShowcase } from "@/components/impact/impact-showcase";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { impactScenarios } from "@/data/impact-scenarios";
import { categories, roles } from "@/data/taxonomy";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";
import { getAgentUseCases } from "@/lib/use-cases";

export const metadata: Metadata = {
  title: "Use Cases"
};

function CasesPageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const useCases = getAgentUseCases(agents);
  const workflows = Array.from(
    new Set(useCases.map((useCase) => useCase.recommendedWorkflow).filter((value): value is string => Boolean(value)))
  ).sort();

  return (
    <AppShell toc={[{ title: dictionary.cases.title, href: "#cases" }, { title: "Impact", href: "#impact" }, { title: dictionary.agents.filters, href: "#filters" }]}>
      <header id="cases" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.cases.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.cases.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          {dictionary.cases.description}
        </p>
      </header>
      <section id="impact" className="border-b border-line pb-8">
        <SectionHeading
          title={dictionary.cases.impactTitle}
          description={dictionary.cases.impactDescription}
        />
        <ImpactShowcase scenarios={impactScenarios} locale={locale} />
      </section>
      <div id="filters">
        <CaseExplorer
          useCases={useCases}
          roles={roles.map((role) => role.slug)}
          categories={categories.map((category) => category.slug)}
          workflows={workflows}
          labels={dictionary.cases}
          locale={locale}
        />
      </div>
    </AppShell>
  );
}

export default async function CasesPage() {
  return <CasesPageContent locale={await getRequestLocale()} />;
}
