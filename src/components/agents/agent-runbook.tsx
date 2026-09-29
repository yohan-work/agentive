import type { AgentRunbook } from "@/types/agent";
import { Card } from "@/components/common/card";
import type { Dictionary } from "@/i18n/dictionaries";

export function AgentRunbookPanel({ runbook, labels }: { runbook?: AgentRunbook; labels: Dictionary["agentRunbook"] }) {
  if (!runbook) {
    return (
      <Card className="p-5">
        <p className="text-sm text-secondary">{labels.notCurated}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-primary">{labels.projectContext}</h3>
        {runbook.setupContextNotes?.length ? (
          <ul className="mt-4 space-y-2 text-sm text-secondary">
            {runbook.setupContextNotes.map((item) => (
              <li key={item} className="rounded-md border border-accent/20 bg-accent/10 px-3 py-2 text-sky-100">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="mt-4 grid gap-2 text-sm text-secondary md:grid-cols-2">
          {runbook.projectContext.map((item) => (
            <li key={item} className="rounded-md border border-line bg-elevated px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {runbook.starterInputs?.length ? (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-primary">{labels.starterInputs}</h3>
          <div className="mt-4 grid gap-4">
            {runbook.starterInputs.map((starter) => (
              <div key={starter.label} className="rounded-md border border-line bg-elevated p-4">
                <h4 className="font-semibold text-primary">{starter.label}</h4>
                <p className="mt-1 text-sm leading-6 text-secondary">{starter.description}</p>
                <p className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-[#08090c] p-3 font-mono text-xs leading-5 text-secondary">
                  {starter.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ExampleCard title={labels.goodInput} value={runbook.goodInputExample} />
        <ExampleCard title={labels.weakInput} value={runbook.badInputExample} />
      </div>

      {runbook.weakInputFixes?.length ? (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-primary">{labels.weakInputFixes}</h3>
          <div className="mt-4 grid gap-4">
            {runbook.weakInputFixes.map((fix) => (
              <div key={fix.weakInput} className="rounded-md border border-line bg-elevated p-4">
                <p className="text-sm font-semibold text-primary">{fix.weakInput}</p>
                <p className="mt-2 text-sm leading-6 text-secondary">{fix.whyItFails}</p>
                <p className="mt-3 whitespace-pre-wrap rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm leading-6 text-green-100">
                  {fix.strongerInput}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {runbook.expectedOutputShape?.length ? <ListCard title={labels.expectedOutputShape} items={runbook.expectedOutputShape} /> : null}

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-primary">{labels.outputChecklist}</h3>
        <ul className="mt-4 space-y-2 text-sm text-secondary">
          {runbook.outputChecklist.map((item) => (
            <li key={item} className="rounded-md border border-line bg-elevated px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title={labels.failureModes} items={runbook.failureModes} />
        <ListCard title={labels.handoffTips} items={runbook.handoffTips} />
      </div>
    </div>
  );
}

function ExampleCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-secondary">{value}</p>
    </Card>
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
