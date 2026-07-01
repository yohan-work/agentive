"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { readBookmarks, writeBookmarks } from "@/lib/bookmarks";
import { cn } from "@/lib/utils";

export function BookmarkButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(readBookmarks().includes(slug));
  }, [slug]);

  function toggle() {
    const current = readBookmarks();
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    writeBookmarks(next);
    setBookmarked(next.includes(slug));
    window.dispatchEvent(new CustomEvent("agent-archive:bookmarks-changed"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "inline-flex items-center justify-center rounded-md border transition",
        compact ? "h-8 w-8" : "h-9 gap-2 px-3 text-sm",
        bookmarked
          ? "border-accent/40 bg-accent/15 text-sky-200"
          : "border-line bg-elevated text-secondary hover:border-accent/35 hover:text-primary"
      )}
    >
      <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
      {compact ? null : bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
