import { SearchX } from "lucide-react";

export function EmptyState({
  title = "No agents found.",
  description = "Try searching by role, task, tool, or workflow."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel/45 p-8 text-center">
      <SearchX className="mx-auto h-8 w-8 text-muted" />
      <h3 className="mt-4 text-base font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-secondary">{description}</p>
    </div>
  );
}
