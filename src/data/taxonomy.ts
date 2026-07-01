import type { TaxonomyItem } from "@/types/taxonomy";

export const roles: TaxonomyItem[] = [
  { slug: "planner", name: "Planner", description: "Agents for service planning, product structure, and documentation." },
  { slug: "pm", name: "PM", description: "Agents for product decisions, requirements, and team alignment." },
  { slug: "designer", name: "Designer", description: "Agents for IA, UX writing, landing pages, and design QA." },
  { slug: "developer", name: "Developer", description: "Agents for Codex workflows, reviews, debugging, and release work." },
  { slug: "marketer", name: "Marketer", description: "Agents for research, content, copy, and campaign execution." },
  { slug: "sales", name: "Sales", description: "Agents for outreach, proposals, pricing, and customer communication." },
  { slug: "cs", name: "CS", description: "Agents for support policies, customer replies, and escalation workflows." },
  { slug: "founder", name: "Founder", description: "Agents for lean business planning, pricing, validation, and operations." },
  { slug: "creator", name: "Creator", description: "Agents for repeatable content planning and publishing workflows." }
];

export const categories: TaxonomyItem[] = [
  { slug: "planning", name: "Planning", description: "Briefs, requirements, scenarios, and service structure." },
  { slug: "development", name: "Development", description: "Coding, review, debugging, QA, and deployment workflows." },
  { slug: "design", name: "Design", description: "UX writing, wireframes, design QA, and handoff support." },
  { slug: "web", name: "Web", description: "Website structure, landing pages, and conversion planning." },
  { slug: "marketing", name: "Marketing", description: "Copy, content, positioning, outreach, and campaigns." },
  { slug: "research", name: "Research", description: "Competitor, customer, website, and market analysis." },
  { slug: "documentation", name: "Documentation", description: "Readable docs, policies, READMEs, and proposals." },
  { slug: "operations", name: "Operations", description: "Policies, releases, support, team workflows, and governance." },
  { slug: "automation", name: "Automation", description: "Reusable workflows and coding-agent handoffs." },
  { slug: "business", name: "Business", description: "Pricing, proposals, validation, and local business planning." },
  { slug: "content", name: "Content", description: "Content strategy, reader definition, and publishing systems." }
];

export const taskTags = ["research", "summary", "planning", "documentation", "code", "marketing", "automation"];
