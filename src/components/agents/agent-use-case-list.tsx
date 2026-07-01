import type { AgentUseCase } from "@/types/agent";
import { Card } from "@/components/common/card";

export function AgentUseCaseList({ useCases }: { useCases: AgentUseCase[] }) {
  if (!useCases.length) {
    return (
      <Card className="p-5">
        <p className="text-sm text-secondary">No real use cases have been added yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {useCases.map((useCase) => (
        <Card key={useCase.title} className="p-5">
          <h3 className="text-lg font-semibold text-primary">{useCase.title}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <UseCaseField label="Context" value={useCase.context} />
            <UseCaseField label="Problem" value={useCase.problem} />
            <UseCaseField label="How to use" value={useCase.howToUse} />
            <UseCaseField label="Expected result" value={useCase.expectedResult} />
          </div>
          <div className="mt-4 rounded-md border border-line bg-[#08090c] p-4">
            <p className="mb-2 font-mono text-xs text-muted">example input</p>
            <p className="text-sm leading-6 text-secondary">{useCase.exampleInput}</p>
          </div>
          {useCase.recommendedWorkflow ? (
            <p className="mt-3 text-sm text-muted">Recommended workflow: {useCase.recommendedWorkflow}</p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function UseCaseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="text-sm leading-6 text-secondary">{value}</p>
    </div>
  );
}
