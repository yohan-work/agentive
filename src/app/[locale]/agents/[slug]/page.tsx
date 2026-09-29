import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentDetailHeader } from "@/components/agents/agent-detail-header";
import { AgentEffectSummary } from "@/components/agents/agent-effect-summary";
import { AgentEvaluationPanel } from "@/components/agents/agent-evaluation";
import { AgentExportPanel } from "@/components/agents/agent-export-panel";
import { AgentRunbookPanel } from "@/components/agents/agent-runbook";
import { AgentUseCaseList } from "@/components/agents/agent-use-case-list";
import { DetailSection } from "@/components/agents/detail-section";
import { RelatedAgents } from "@/components/agents/related-agents";
import { CodeBlock } from "@/components/common/code-block";
import { Tag } from "@/components/common/tag";
import { AppShell } from "@/components/layout/app-shell";
import { agents, getAgentBySlug } from "@/data/agents";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale, type LocaleParams } from "@/i18n/server";

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  return {
    title: agent?.name ?? "Agent"
  };
}

async function AgentDetailPageContent({
  params,
  locale = defaultLocale
}: {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const labels = dictionary.agentDetail;
  const sections = labels.sections;
  const toc = [
    { title: labels.effectSummaryTitle, href: "#expected-effect" },
    { title: sections.whatItDoes, href: "#what-this-agent-does" },
    { title: sections.useThisAgent, href: "#use-this-agent" },
    { title: sections.howToRun, href: "#how-to-run-this-agent" },
    { title: sections.qualityEvaluation, href: "#quality-evaluation" },
    { title: sections.decisionGuide, href: "#decision-guide" },
    { title: sections.whenToUse, href: "#when-to-use" },
    { title: sections.inputs, href: "#inputs" },
    { title: sections.outputs, href: "#outputs" },
    { title: sections.prompt, href: "#prompt" },
    { title: sections.example, href: "#example" },
    { title: sections.realUseCases, href: "#real-use-cases" },
    { title: sections.bestPractices, href: "#best-practices" },
    { title: sections.limitations, href: "#limitations" },
    { title: sections.relatedAgents, href: "#related-agents" }
  ];
  const related = (agent.relatedAgents ?? [])
    .map((relatedSlug) => getAgentBySlug(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <AppShell toc={toc}>
      <AgentDetailHeader agent={agent} labels={labels} locale={locale} />
      <div id="expected-effect">
        <AgentEffectSummary agent={agent} relatedAgent={related[0]} labels={labels} />
      </div>
      <DetailSection id="what-this-agent-does" title={sections.whatItDoes}>
        <p>{agent.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.tags.map((tag) => (
            <Tag key={tag} value={tag} locale={locale} />
          ))}
        </div>
      </DetailSection>
      <DetailSection id="use-this-agent" title={sections.useThisAgent}>
        <AgentExportPanel agent={agent} labels={dictionary.agentExport} />
      </DetailSection>
      <DetailSection id="how-to-run-this-agent" title={sections.howToRun}>
        <AgentRunbookPanel runbook={agent.runbook} labels={dictionary.agentRunbook} />
      </DetailSection>
      <DetailSection id="quality-evaluation" title={sections.qualityEvaluation}>
        <AgentEvaluationPanel evaluation={agent.evaluation} labels={dictionary.agentEvaluation} />
      </DetailSection>
      {agent.decisionGuide?.length ? (
        <DetailSection id="decision-guide" title={sections.decisionGuide}>
          <div className="grid gap-4">
            {agent.decisionGuide.map((item) => {
              const alternative = item.alternativeAgentSlug ? getAgentBySlug(item.alternativeAgentSlug) : undefined;

              return (
                <div key={item.question} className="rounded-lg border border-line bg-panel p-4">
                  <h3 className="text-sm font-semibold text-primary">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{item.guidance}</p>
                  {alternative ? (
                    <p className="mt-3 text-xs text-muted">
                      {labels.relatedOption} <span className="text-sky-200">{alternative.name}</span>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DetailSection>
      ) : null}
      <DetailSection id="when-to-use" title={sections.whenToUse}>
        <List items={agent.useCases} />
      </DetailSection>
      <DetailSection id="inputs" title={sections.inputs}>
        <List items={agent.inputs} />
      </DetailSection>
      <DetailSection id="outputs" title={sections.outputs}>
        <List items={agent.outputs} />
      </DetailSection>
      <DetailSection id="prompt" title={sections.prompt}>
        <CodeBlock value={agent.prompt} />
      </DetailSection>
      <DetailSection id="example" title={sections.example}>
        <div className="grid gap-4 md:grid-cols-2">
          <ExampleBlock title={labels.exampleInput} value={agent.exampleInput ?? labels.noExampleInput} />
          <ExampleBlock title={labels.exampleOutput} value={agent.exampleOutput ?? labels.noExampleOutput} />
        </div>
      </DetailSection>
      <DetailSection id="real-use-cases" title={sections.realUseCases}>
        <AgentUseCaseList useCases={agent.realUseCases ?? []} />
      </DetailSection>
      <DetailSection id="best-practices" title={sections.bestPractices}>
        <List items={agent.bestPractices ?? []} />
      </DetailSection>
      <DetailSection id="limitations" title={sections.limitations}>
        <List items={agent.limitations ?? []} />
      </DetailSection>
      <DetailSection id="related-agents" title={sections.relatedAgents}>
        <RelatedAgents agents={related} locale={locale} />
      </DetailSection>
    </AppShell>
  );
}

export default async function AgentDetailPage({ params }: { params: LocaleParams<{ slug: string }> }) {
  return <AgentDetailPageContent params={params} locale={await resolveLocale(params)} />;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-line bg-panel px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ExampleBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-2 text-sm font-semibold text-primary">{title}</h3>
      <p className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6 text-secondary">{value}</p>
    </div>
  );
}
