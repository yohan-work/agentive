import Link from "next/link";
import { ArrowRight, Bot, FileInput, FileText } from "lucide-react";
import type { WorkflowStep } from "@/types/workflow";
import { Badge } from "@/components/common/badge";
import { getAgentBySlug } from "@/data/agents";
import { defaultLocale, type Locale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function WorkflowSteps({ steps, locale = defaultLocale }: { steps: WorkflowStep[]; locale?: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <ol className="space-y-5">
      {steps.map((step) => {
        const agent = getAgentBySlug(step.agentSlug);
        return (
          <li key={step.order} className="overflow-hidden rounded-lg border border-line bg-panel">
            <div className="border-b border-line bg-elevated/45 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-sm font-semibold text-sky-200">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-secondary">{step.description}</p>
                  </div>
                </div>
                {agent?.installTargets?.length ? <Badge tone="success">Project-ready</Badge> : null}
              </div>
            </div>
            <div className="grid gap-px bg-line md:grid-cols-3">
              <WorkflowField
                icon={<FileInput className="h-4 w-4" />}
                label={dictionary.common.input}
                value={agent?.inputs.slice(0, 2).join(" + ") ?? "Project context"}
              />
              <WorkflowField
                icon={<Bot className="h-4 w-4" />}
                label={dictionary.common.agent}
                value={agent?.name ?? step.agentSlug}
                href={agent ? withLocale(`/agents/${agent.slug}`, locale) : undefined}
              />
              <WorkflowField icon={<FileText className="h-4 w-4" />} label={dictionary.common.output} value={step.expectedOutput} />
            </div>
            {agent ? (
              <div className="p-5">
                <Link href={withLocale(`/agents/${agent.slug}`, locale)} className="inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                  Use {agent.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function WorkflowField({
  icon,
  label,
  value,
  href
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="text-sky-200">{icon}</span>
        {label}
      </div>
      <p className="text-sm leading-6 text-secondary">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block bg-panel p-4 transition hover:bg-elevated">
        {content}
      </Link>
    );
  }

  return <div className="bg-panel p-4">{content}</div>;
}
