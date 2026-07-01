import Link from "next/link";
import { Hash } from "lucide-react";

export function Tag({ value }: { value: string }) {
  return (
    <Link
      href={`/agents?query=${encodeURIComponent(value)}`}
      className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-panel px-2 text-xs text-secondary transition hover:border-accent/35 hover:text-primary"
    >
      <Hash className="h-3 w-3" />
      {value}
    </Link>
  );
}
