"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Bot, Github, Menu, Moon, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/common/button";
import { getLocaleFromPathname, locales, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const dictionary = getDictionary(locale);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`${withLocale("/agents", locale)}?query=${encodeURIComponent(query)}`);
  }

  return (
    <>
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
          <Link href={withLocale("/", locale)} className="flex min-w-fit items-center gap-2 font-semibold text-primary">
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
                placeholder={dictionary.nav.searchPlaceholder}
                className="h-10 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-md border border-line bg-elevated p-1 sm:flex">
              {locales.map((item) => (
                <Link
                  key={item}
                  href={withLocale(pathname, item)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-semibold uppercase transition",
                    item === locale ? "bg-accent/15 text-sky-200" : "text-muted hover:text-primary"
                  )}
                >
                  {item === "ko" ? "KOR" : "ENG"}
                </Link>
              ))}
            </div>
            <Button variant="primary" className="hidden sm:inline-flex">
              <Sparkles className="h-4 w-4" />
              {dictionary.nav.askAssistant}
            </Button>
            <Link
              href="https://github.com/yohan-work"
              className="hidden h-9 items-center gap-2 rounded-md border border-line bg-elevated px-3 text-sm text-secondary transition hover:border-accent/35 hover:text-primary sm:inline-flex"
            >
              <Github className="h-4 w-4" />
              Star
              <span className="text-muted">-k</span>
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
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[#050507]/80 lg:hidden">
          <aside className="h-full w-[310px] max-w-[86vw] border-r border-line bg-[#0b0b0f] p-4 shadow-glow">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-primary">{dictionary.nav.navigation}</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-elevated text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {locales.map((item) => (
                <Link
                  key={item}
                  href={withLocale(pathname, item)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-center text-xs font-semibold uppercase",
                    item === locale ? "border-accent/40 bg-accent/15 text-sky-200" : "border-line bg-elevated text-secondary"
                  )}
                >
                  {item === "ko" ? "KOR" : "ENG"}
                </Link>
              ))}
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
