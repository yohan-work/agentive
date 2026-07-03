import Link from "next/link";
import { ArrowRight, CheckCircle2, GitBranch, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { getAgentBySlug } from "@/data/agents";
import { defaultLocale, type Locale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { ImpactScenario } from "@/types/impact";

export function ImpactShowcase({ scenarios, locale = defaultLocale }: { scenarios: ImpactScenario[]; locale?: Locale }) {
  return (
    <div className="space-y-5">
      {scenarios.map((scenario) => (
        <ImpactScenarioCard key={scenario.slug} scenario={scenario} locale={locale} />
      ))}
    </div>
  );
}

function ImpactScenarioCard({ scenario, locale }: { scenario: ImpactScenario; locale: Locale }) {
  const agents = scenario.agentSlugs.map((slug) => getAgentBySlug(slug)).filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
  const dictionary = getDictionary(locale);
  const content = getScenarioContent(scenario, locale);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-elevated/45 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone="accent">{content.audience}</Badge>
          <Badge tone="success">{agents.length} {dictionary.nav.agents}</Badge>
          {scenario.primaryWorkflowSlug ? <Badge>{dictionary.impact.workflowLinked}</Badge> : null}
          {content.effectTags.map((tag) => (
            <Badge key={tag} tone="warning">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-primary">{content.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">{content.problem}</p>
          </div>
          {scenario.primaryWorkflowSlug ? (
            <Link href={withLocale(`/workflows/${scenario.primaryWorkflowSlug}`, locale)} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-sky-200">
              {dictionary.common.viewWorkflow} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ValueNote label={dictionary.impact.benefit} value={content.plainBenefit} />
          <ValueNote label={dictionary.impact.bestStart} value={content.recommendedStart} />
        </div>
      </div>

      <div className="grid gap-px bg-line lg:grid-cols-[1fr_1.1fr_1fr]">
        <Panel title={dictionary.impact.before} icon={<TriangleAlert className="h-4 w-4" />} tone="warning" items={content.before} />
        <AgentFlow agents={agents} outputs={content.outputs} locale={locale} />
        <Panel title={dictionary.impact.after} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" items={content.after} />
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-3">
        {content.impactMetrics.map((metric) => (
          <div key={metric.label} className="bg-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{metric.label}</p>
            <p className="mt-2 text-sm leading-6 text-primary">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function getScenarioContent(scenario: ImpactScenario, locale: Locale) {
  const translation = scenario.translations?.[locale as "ko"];

  return {
    title: translation?.title ?? scenario.title,
    audience: translation?.audience ?? scenario.audience,
    problem: translation?.problem ?? scenario.problem,
    before: translation?.before ?? scenario.before,
    outputs: translation?.outputs ?? scenario.outputs,
    after: translation?.after ?? scenario.after,
    impactMetrics: translation?.impactMetrics ?? scenario.impactMetrics,
    plainBenefit: translation?.plainBenefit ?? scenario.plainBenefit,
    effectTags: translation?.effectTags ?? scenario.effectTags,
    recommendedStart: translation?.recommendedStart ?? scenario.recommendedStart
  };
}

function ValueNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-panel/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-primary">{value}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  tone,
  items
}: {
  title: string;
  icon: React.ReactNode;
  tone: "warning" | "success";
  items: string[];
}) {
  return (
    <div className="bg-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={
            tone === "warning"
              ? "flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-300"
              : "flex h-8 w-8 items-center justify-center rounded-md border border-green-500/25 bg-green-500/10 text-green-300"
          }
        >
          {icon}
        </span>
        <h4 className="font-semibold text-primary">{title}</h4>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentFlow({ agents, outputs, locale }: { agents: ReturnType<typeof getAgentBySlug>[]; outputs: string[]; locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <div className="bg-[#08090c] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-sky-200">
          <GitBranch className="h-4 w-4" />
        </span>
        <h4 className="font-semibold text-primary">{dictionary.impact.flow}</h4>
      </div>
      <ol className="space-y-3">
        {agents.map((agent, index) =>
          agent ? (
            <li key={agent.slug} className="relative rounded-md border border-line bg-panel px-3 py-3">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-xs font-semibold text-sky-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Link href={withLocale(`/agents/${agent.slug}`, locale)} className="font-medium text-primary transition hover:text-sky-200">
                    {agent.name}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-secondary">{agent.summary}</p>
                </div>
              </div>
            </li>
          ) : null
        )}
      </ol>
      <div className="mt-4 rounded-md border border-accent/20 bg-accent/10 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
          <Sparkles className="h-3.5 w-3.5" />
          {dictionary.impact.outputs}
        </div>
        <p className="text-sm leading-6 text-secondary">{outputs.join(" · ")}</p>
      </div>
    </div>
  );
}
