import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WorkflowStep } from "@/types/workflow";
import { getAgentBySlug } from "@/data/agents";

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => {
        const agent = getAgentBySlug(step.agentSlug);
        return (
          <li key={step.order} className="rounded-lg border border-line bg-panel p-5">
            <div className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-sm font-semibold text-sky-200">
                {step.order}
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-secondary">{step.description}</p>
                <p className="mt-3 text-sm text-muted">Expected output: {step.expectedOutput}</p>
                {agent ? (
                  <Link href={`/agents/${agent.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                    Use {agent.name} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
