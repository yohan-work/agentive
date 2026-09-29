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

  return (
    <nav>
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
    </nav>
  );
}
