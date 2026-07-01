import Link from "next/link";
import { ArrowRight, Clock, Layers } from "lucide-react";
import type { Workflow } from "@/types/workflow";
import { Badge, DifficultyBadge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { titleCase } from "@/lib/utils";

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <DifficultyBadge difficulty={workflow.difficulty} />
        <Badge tone="accent">{workflow.steps.length} steps</Badge>
      </div>
      <h3 className="text-xl font-semibold text-primary">{workflow.name}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{workflow.summary}</p>
      <div className="mt-5 grid gap-2 text-sm text-secondary sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          {workflow.estimatedTime}
        </p>
        <p className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted" />
          {workflow.categories.map(titleCase).join(", ")}
        </p>
      </div>
      <Link href={`/workflows/${workflow.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
        View workflow <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
