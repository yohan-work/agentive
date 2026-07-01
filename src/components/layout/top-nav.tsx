"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Bot, Github, Menu, Moon, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/common/button";
import { SidebarNav } from "./sidebar-nav";

export function TopNav() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/agents?query=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/88 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1480px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-elevated text-secondary lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link href="/" className="flex min-w-fit items-center gap-2 font-semibold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/25 bg-accent/12 text-sky-200">
            <Bot className="h-4 w-4" />
          </span>
          Agent Archive
        </Link>
        <form onSubmit={onSubmit} className="mx-1 hidden flex-1 md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents, workflows, roles..."
              className="h-10 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" className="hidden sm:inline-flex">
            <Sparkles className="h-4 w-4" />
            Ask Assistant
          </Button>
          <Link
            href="https://github.com"
            className="hidden h-9 items-center gap-2 rounded-md border border-line bg-elevated px-3 text-sm text-secondary transition hover:border-accent/35 hover:text-primary sm:inline-flex"
          >
            <Github className="h-4 w-4" />
            Star
            <span className="text-muted">1.2k</span>
          </Link>
          <button
            type="button"
            aria-label="Theme toggle"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-elevated text-secondary"
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden">
          <aside className="h-full w-[310px] max-w-[86vw] border-r border-line bg-canvas p-4 shadow-glow">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-primary">Navigation</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-elevated text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </header>
  );
}
