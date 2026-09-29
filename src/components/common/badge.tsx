import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { Difficulty, VerifiedStatus } from "@/types/agent";

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

export function DifficultyBadge({ difficulty, locale = defaultLocale }: { difficulty: Difficulty; locale?: Locale }) {
  const tone = difficulty === "advanced" ? "warning" : difficulty === "intermediate" ? "accent" : "default";
  return <Badge tone={tone}>{getDictionary(locale).agentMeta.difficulty[difficulty]}</Badge>;
}

export function StatusBadge({ status, locale = defaultLocale }: { status: VerifiedStatus; locale?: Locale }) {
  const tone = status === "expert" || status === "tested" ? "success" : status === "community" ? "accent" : "default";
  return <Badge tone={tone}>{getDictionary(locale).agentMeta.status[status]}</Badge>;
}
