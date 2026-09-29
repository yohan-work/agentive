import Link from "next/link";
import { Hash } from "lucide-react";
import { withLocale, type Locale } from "@/i18n/config";

export function Tag({ value, locale }: { value: string; locale: Locale }) {
  return (
    <Link
      href={`${withLocale("/agents", locale)}?query=${encodeURIComponent(value)}`}
      className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-panel px-2 text-xs text-secondary transition hover:border-accent/35 hover:text-primary"
    >
      <Hash className="h-3 w-3" />
      {value}
    </Link>
  );
}
