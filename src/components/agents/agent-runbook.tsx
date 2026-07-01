import type { AgentRunbook } from "@/types/agent";
import { Card } from "@/components/common/card";

export function AgentRunbookPanel({ runbook }: { runbook?: AgentRunbook }) {
  if (!runbook) {
    return (
      <Card className="p-5">
        <p className="text-sm text-secondary">A project runbook has not been curated for this agent yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-primary">Project context to prepare</h3>
        <ul className="mt-4 grid gap-2 text-sm text-secondary md:grid-cols-2">
          {runbook.projectContext.map((item) => (
            <li key={item} className="rounded-md border border-line bg-elevated px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ExampleCard title="Good input" value={runbook.goodInputExample} />
        <ExampleCard title="Weak input" value={runbook.badInputExample} />
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-primary">Output checklist</h3>
        <ul className="mt-4 space-y-2 text-sm text-secondary">
          {runbook.outputChecklist.map((item) => (
            <li key={item} className="rounded-md border border-line bg-elevated px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Failure modes" items={runbook.failureModes} />
        <ListCard title="Handoff tips" items={runbook.handoffTips} />
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
