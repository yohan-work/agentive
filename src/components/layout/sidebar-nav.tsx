"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, ClipboardList, Compass, Download, FilePlus, Home, Layers, Library, Users } from "lucide-react";
import { getLocaleFromPathname, stripLocale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const cleanPathname = stripLocale(pathname);
  const dictionary = getDictionary(locale);
  const primary = [
    { href: "/", label: dictionary.nav.overview, icon: Home },
    { href: "/agents", label: dictionary.nav.agents, icon: Library },
    { href: "/cases", label: dictionary.nav.useCases, icon: ClipboardList },
    { href: "/install", label: dictionary.nav.install, icon: Download },
    { href: "/workflows", label: dictionary.nav.workflows, icon: Layers },
    { href: "/categories", label: dictionary.nav.categories, icon: Boxes },
    { href: "/roles", label: dictionary.nav.roles, icon: Users }
  ];
  const groups = [
    {
      title: dictionary.nav.forUsers,
      links: [dictionary.nav.gettingStarted, dictionary.nav.howToUseAgents, dictionary.nav.promptTemplates, dictionary.nav.workflowPacks]
    },
    {
      title: dictionary.nav.forCreators,
      links: [dictionary.nav.submitAgent, dictionary.nav.agentCardFormat, dictionary.nav.bestPractices, dictionary.nav.evaluationGuide]
    },
    {
      title: dictionary.nav.forTeams,
      links: [dictionary.nav.internalArchive, dictionary.nav.teamKnowledgeBase, dictionary.nav.governance]
    }
  ];

  return (
    <nav className="space-y-7">
      <div className="space-y-1">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? cleanPathname === "/" : cleanPathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={withLocale(item.href, locale)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                active ? "bg-elevated text-primary shadow-sm" : "text-secondary hover:bg-elevated/70 hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href={withLocale("/submit", locale)}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            cleanPathname.startsWith("/submit") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <FilePlus className="h-4 w-4" />
          {dictionary.nav.submit}
        </Link>
        <Link
          href={withLocale("/bookmarks", locale)}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            cleanPathname.startsWith("/bookmarks") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <BookOpen className="h-4 w-4" />
          {dictionary.nav.bookmarks}
        </Link>
        <Link
          href={withLocale("/about", locale)}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            cleanPathname.startsWith("/about") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <Compass className="h-4 w-4" />
          {dictionary.nav.about}
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{group.title}</p>
          <div className="space-y-1">
            {group.links.map((link) => (
              <Link
                key={link}
                href={link === dictionary.nav.submitAgent ? withLocale("/submit", locale) : withLocale("/about", locale)}
                onClick={onNavigate}
                className="block rounded-md px-3 py-1.5 text-sm text-secondary transition hover:bg-elevated/70 hover:text-primary"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
