import { cn, formatStatus, titleCase } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "accent";
  className?: string;
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium",
        tone === "default" && "border-line bg-elevated text-secondary",
        tone === "success" && "border-green-500/25 bg-green-500/10 text-green-300",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-300",
        tone === "accent" && "border-accent/25 bg-accent/10 text-sky-200",
        className
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = difficulty === "advanced" ? "warning" : difficulty === "intermediate" ? "accent" : "default";
  return <Badge tone={tone}>{titleCase(difficulty)}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "expert" || status === "tested" ? "success" : status === "community" ? "accent" : "default";
  return <Badge tone={tone}>{formatStatus(status)}</Badge>;
}
