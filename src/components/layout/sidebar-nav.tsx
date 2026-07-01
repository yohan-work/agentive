"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, Compass, FilePlus, Home, Layers, Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const primary = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/agents", label: "Agents", icon: Library },
  { href: "/workflows", label: "Workflows", icon: Layers },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/roles", label: "Roles", icon: Users }
];

const groups = [
  {
    title: "For users",
    links: ["Getting started", "How to use agents", "Prompt templates", "Workflow packs"]
  },
  {
    title: "For creators",
    links: ["Submit an agent", "Agent card format", "Best practices", "Evaluation guide"]
  },
  {
    title: "For teams",
    links: ["Internal archive", "Team knowledge base", "Governance"]
  }
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      <div className="space-y-1">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
          href="/submit"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            pathname.startsWith("/submit") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <FilePlus className="h-4 w-4" />
          Submit
        </Link>
        <Link
          href="/bookmarks"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            pathname.startsWith("/bookmarks") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Bookmarks
        </Link>
        <Link
          href="/about"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            pathname.startsWith("/about") ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated/70 hover:text-primary"
          )}
        >
          <Compass className="h-4 w-4" />
          About
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{group.title}</p>
          <div className="space-y-1">
            {group.links.map((link) => (
              <Link
                key={link}
                href={link === "Submit an agent" ? "/submit" : "/about"}
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
