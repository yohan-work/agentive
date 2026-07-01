"use client";

import { useEffect, useMemo, useState } from "react";
import type { Agent } from "@/types/agent";
import { readBookmarks } from "@/lib/bookmarks";
import { AgentGrid } from "./agent-grid";
import { EmptyState } from "@/components/common/empty-state";

export function BookmarksList({ agents }: { agents: Agent[] }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    function sync() {
      setBookmarks(readBookmarks());
    }

    sync();
    window.addEventListener("agent-archive:bookmarks-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("agent-archive:bookmarks-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const bookmarkedAgents = useMemo(
    () => agents.filter((agent) => bookmarks.includes(agent.slug)),
    [agents, bookmarks]
  );

  if (!bookmarkedAgents.length) {
    return <EmptyState title="No bookmarks yet." description="Save agents from cards or detail pages to build your working library." />;
  }

  return <AgentGrid agents={bookmarkedAgents} />;
}
