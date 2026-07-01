import type { Metadata } from "next";
import { BookmarksList } from "@/components/agents/bookmarks-list";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";

export const metadata: Metadata = {
  title: "Bookmarks"
};

export default function BookmarksPage() {
  return (
    <AppShell toc={[{ title: "Bookmarks", href: "#bookmarks" }]}>
      <header id="bookmarks" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Saved</p>
        <h1 className="text-4xl font-semibold text-primary">Bookmarks</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Your locally saved agents. Bookmarks are stored in this browser only.
        </p>
      </header>
      <BookmarksList agents={agents} />
    </AppShell>
  );
}
