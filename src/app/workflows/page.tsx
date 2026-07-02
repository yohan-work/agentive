import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { workflows } from "@/data/workflows";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Workflows"
};

function WorkflowsPageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <AppShell toc={[{ title: dictionary.workflows.title, href: "#workflows" }]}>
      <header id="workflows" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.workflows.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.workflows.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          {dictionary.workflows.description}
        </p>
      </header>
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.slug} workflow={workflow} locale={locale} />
        ))}
      </div>
    </AppShell>
  );
}

export default async function WorkflowsPage() {
  return <WorkflowsPageContent locale={await getRequestLocale()} />;
}
