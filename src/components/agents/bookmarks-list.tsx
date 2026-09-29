"use client";

import { useMemo } from "react";
import type { Agent } from "@/types/agent";
import { useBookmarks } from "@/lib/bookmarks";
import { AgentGrid } from "./agent-grid";
import { EmptyState } from "@/components/common/empty-state";

export function BookmarksList({ agents }: { agents: Agent[] }) {
  const bookmarks = useBookmarks();

  const bookmarkedAgents = useMemo(
    () => agents.filter((agent) => bookmarks.includes(agent.slug)),
    [agents, bookmarks]
  );

  if (!bookmarkedAgents.length) {
    return <EmptyState title="No bookmarks yet." description="Save agents from cards or detail pages to build your working library." />;
  }

  return <AgentGrid agents={bookmarkedAgents} />;
}
