import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, DifficultyBadge } from "@/components/common/badge";
import { AppShell } from "@/components/layout/app-shell";
import { WorkflowSteps } from "@/components/workflows/workflow-steps";
import { getWorkflowBySlug, workflows } from "@/data/workflows";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";
import { titleCase } from "@/lib/utils";

export function generateStaticParams() {
  return workflows.map((workflow) => ({ slug: workflow.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const workflow = getWorkflowBySlug(slug);
  return {
    title: workflow?.name ?? "Workflow"
  };
}

async function WorkflowDetailPageContent({
  params,
  locale = defaultLocale
}: {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}) {
  const { slug } = await params;
  const workflow = getWorkflowBySlug(slug);
  const dictionary = getDictionary(locale);

  if (!workflow) {
    notFound();
  }

  return (
    <AppShell toc={[{ title: dictionary.nav.overview, href: "#overview" }, { title: dictionary.workflows.steps, href: "#steps" }, { title: dictionary.common.finalOutput, href: "#final-output" }]}>
      <header id="overview" className="border-b border-line pb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <DifficultyBadge difficulty={workflow.difficulty} />
          <Badge tone="accent">{workflow.estimatedTime}</Badge>
          <Badge>{workflow.steps.length} steps</Badge>
        </div>
        <h1 className="text-4xl font-semibold text-primary">{workflow.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">{workflow.summary}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary">{workflow.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {workflow.targetUsers.map((role) => (
            <Badge key={role}>{titleCase(role)}</Badge>
          ))}
          {workflow.categories.map((category) => (
            <Badge key={category}>{titleCase(category)}</Badge>
          ))}
        </div>
      </header>
      <section id="steps" className="border-b border-line py-8">
        <h2 className="mb-5 text-2xl font-semibold text-primary">{dictionary.workflows.steps}</h2>
        <WorkflowSteps steps={workflow.steps} locale={locale} />
      </section>
      <section id="final-output" className="py-8">
        <h2 className="mb-4 text-2xl font-semibold text-primary">{dictionary.common.finalOutput}</h2>
        <p className="rounded-lg border border-line bg-panel p-5 text-sm leading-7 text-secondary">{workflow.finalOutput}</p>
      </section>
    </AppShell>
  );
}

export default async function WorkflowDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WorkflowDetailPageContent params={params} locale={await getRequestLocale()} />;
}
