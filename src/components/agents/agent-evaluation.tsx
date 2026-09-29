import type { AgentEvaluation } from "@/types/agent";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import type { Dictionary } from "@/i18n/dictionaries";

export function AgentEvaluationPanel({
  evaluation,
  labels
}: {
  evaluation?: AgentEvaluation;
  labels: Dictionary["agentEvaluation"];
}) {
  if (!evaluation) {
    return (
      <Card className="p-5">
        <p className="text-sm text-secondary">{labels.notCurated}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">{labels.snapshotTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">{labels.snapshotDescription}</p>
          </div>
          <Badge tone={evaluation.qualityScore >= 4 ? "success" : "warning"}>
            {labels.quality} {evaluation.qualityScore}/5
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {evaluation.testedWith.map((target) => (
            <Badge key={target}>{target}</Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title={labels.recommendedFor} items={evaluation.recommendedFor} />
        <ListCard title={labels.notRecommendedFor} items={evaluation.notRecommendedFor} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title={labels.evaluationCriteria} items={evaluation.evaluationCriteria} />
        <ListCard title={labels.knownWeaknesses} items={evaluation.knownWeaknesses} />
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-primary">{labels.sampleRuns}</h3>
        <div className="mt-4 space-y-4">
          {evaluation.sampleRuns.map((sample) => (
            <div key={sample.title} className="rounded-md border border-line bg-elevated p-4">
              <h4 className="font-semibold text-primary">{sample.title}</h4>
              <dl className="mt-3 space-y-3 text-sm leading-6">
                <div>
                  <dt className="font-medium text-primary">{labels.sampleInput}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-secondary">{sample.input}</dd>
                </div>
                <div>
                  <dt className="font-medium text-primary">{labels.expectedOutput}</dt>
                  <dd className="mt-1 text-secondary">{sample.expectedOutputSummary}</dd>
                </div>
                <div>
                  <dt className="font-medium text-primary">{labels.sampleOutput}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-secondary">{sample.sampleOutput}</dd>
                </div>
              </dl>
              <ul className="mt-3 space-y-2 text-sm text-secondary">
                {sample.reviewNotes.map((note) => (
                  <li key={note} className="rounded-md border border-line bg-panel px-3 py-2">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-secondary">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-line bg-elevated px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
