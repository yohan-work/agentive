import { ArrowRight, FileCheck2, ListChecks, WandSparkles } from "lucide-react";
import type { Agent } from "@/types/agent";
import { Card } from "@/components/common/card";

type AgentEffectSummaryLabels = {
  effectSummaryTitle: string;
  effectSummaryDescription: string;
  reducesWork: string;
  createsOutput: string;
  nextStep: string;
};

export function AgentEffectSummary({
  agent,
  relatedAgent,
  labels
}: {
  agent: Agent;
  relatedAgent?: Agent;
  labels: AgentEffectSummaryLabels;
}) {
  const primaryUseCase = agent.useCases[0] ?? agent.summary;
  const primaryOutputs = agent.outputs.slice(0, 2).join(", ");
  const nextStep = relatedAgent
    ? `${relatedAgent.name}: ${relatedAgent.summary}`
    : agent.bestPractices?.[0] ?? agent.limitations?.[0] ?? agent.summary;

  return (
    <section className="border-b border-line py-8">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-primary">{labels.effectSummaryTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">{labels.effectSummaryDescription}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<WandSparkles className="h-4 w-4" />} label={labels.reducesWork} value={primaryUseCase} />
        <SummaryCard icon={<FileCheck2 className="h-4 w-4" />} label={labels.createsOutput} value={primaryOutputs} />
        <SummaryCard icon={<ListChecks className="h-4 w-4" />} label={labels.nextStep} value={nextStep} />
      </div>
    </section>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-sky-200">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      </div>
      <p className="text-sm leading-6 text-primary">{value}</p>
      <ArrowRight className="mt-4 h-4 w-4 text-muted" />
    </Card>
  );
}
