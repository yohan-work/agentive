import { CopyButton } from "./copy-button";

export function CodeBlock({ value }: { value: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[#08090c]">
      <div className="flex items-center justify-between border-b border-line bg-elevated px-4 py-3">
        <span className="font-mono text-xs text-muted">prompt.md</span>
        <CopyButton value={value} />
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-secondary">
        {value}
      </pre>
    </div>
  );
}
