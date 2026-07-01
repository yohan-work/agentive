import type { Workflow } from "@/types/workflow";

export const workflows: Workflow[] = [
  {
    id: "workflow-001",
    slug: "website-outsourcing-proposal",
    name: "Website Outsourcing Proposal Flow",
    summary: "Turn a client website inquiry into a scoped proposal and Codex-ready build brief.",
    description: "A practical flow for small studios and freelancers preparing website proposals with research, IA, section planning, estimate writing, and implementation handoff.",
    targetUsers: ["designer", "developer", "founder", "sales"],
    categories: ["web", "business", "development"],
    estimatedTime: "90-150 min",
    difficulty: "intermediate",
    finalOutput: "Client-ready website proposal and implementation task brief.",
    steps: [
      { order: 1, title: "Analyze the business", description: "Map the client context and local market assumptions.", agentSlug: "local-market-analysis-agent", expectedOutput: "Market and audience notes" },
      { order: 2, title: "Research competitors", description: "Compare positioning, offers, and website patterns.", agentSlug: "competitor-analysis-agent", expectedOutput: "Competitor comparison" },
      { order: 3, title: "Create sitemap", description: "Define the website navigation and page purpose.", agentSlug: "ia-sitemap-architect", expectedOutput: "Sitemap and page map" },
      { order: 4, title: "Plan landing sections", description: "Structure the page around conversion goals.", agentSlug: "landing-section-planner", expectedOutput: "Section plan" },
      { order: 5, title: "Write proposal", description: "Turn scope and assumptions into a client proposal.", agentSlug: "proposal-writer-agent", expectedOutput: "Proposal draft" },
      { order: 6, title: "Prepare Codex task", description: "Convert the accepted scope into an implementation brief.", agentSlug: "codex-task-brief", expectedOutput: "Codex-ready task brief" }
    ]
  },
  {
    id: "workflow-002",
    slug: "codex-development-prep",
    name: "Codex Development Prep Flow",
    summary: "Prepare a feature idea for coding-agent implementation.",
    description: "A planning sequence for converting an idea into requirements, QA criteria, and a precise Codex task brief.",
    targetUsers: ["developer", "pm", "founder"],
    categories: ["development", "planning", "automation"],
    estimatedTime: "45-90 min",
    difficulty: "intermediate",
    finalOutput: "Implementation-ready brief with acceptance criteria and QA checklist.",
    steps: [
      { order: 1, title: "Create service brief", description: "Clarify the goal and intended user value.", agentSlug: "service-brief-generator", expectedOutput: "Service brief" },
      { order: 2, title: "Define requirements", description: "Convert the idea into acceptance criteria.", agentSlug: "feature-requirements-analyst", expectedOutput: "Requirements spec" },
      { order: 3, title: "Write scenarios", description: "Describe how users move through the feature.", agentSlug: "user-scenario-writer", expectedOutput: "User scenarios" },
      { order: 4, title: "Prepare Codex task", description: "Create a constrained coding-agent brief.", agentSlug: "codex-task-brief", expectedOutput: "Task brief" },
      { order: 5, title: "Build QA plan", description: "List smoke and regression checks.", agentSlug: "qa-checklist-agent", expectedOutput: "QA checklist" }
    ]
  },
  {
    id: "workflow-003",
    slug: "meeting-notes-automation",
    name: "Meeting Notes Automation Flow",
    summary: "Convert rough meeting notes into decisions, action items, and follow-up messages.",
    description: "A lightweight workflow for teams that want structured meeting outputs without building a full automation system.",
    targetUsers: ["pm", "cs", "founder"],
    categories: ["operations", "documentation", "automation"],
    estimatedTime: "20-45 min",
    difficulty: "beginner",
    finalOutput: "Clean meeting summary with actions and follow-up message.",
    steps: [
      { order: 1, title: "Structure the notes", description: "Turn raw notes into a readable meeting record.", agentSlug: "policy-doc-writer", expectedOutput: "Structured notes" },
      { order: 2, title: "Extract requirements", description: "Capture decisions and requested product changes.", agentSlug: "feature-requirements-analyst", expectedOutput: "Requirement candidates" },
      { order: 3, title: "Create follow-up", description: "Write a concise customer or team message.", agentSlug: "customer-dm-writer", expectedOutput: "Follow-up message" },
      { order: 4, title: "Make QA checklist", description: "Define checks for action item completion.", agentSlug: "qa-checklist-agent", expectedOutput: "Action checklist" }
    ]
  },
  {
    id: "workflow-004",
    slug: "content-production",
    name: "Content Production Flow",
    summary: "Move from audience definition to publishable content ideas and copy.",
    description: "A repeatable content workflow for founders, creators, and marketers producing posts, articles, and campaign material.",
    targetUsers: ["creator", "marketer", "founder"],
    categories: ["content", "marketing"],
    estimatedTime: "45-120 min",
    difficulty: "beginner",
    finalOutput: "Reader-aware content plan with hooks, outline, and channel-ready variants.",
    steps: [
      { order: 1, title: "Define the reader", description: "Clarify who the content is for and what they need.", agentSlug: "target-reader-agent", expectedOutput: "Reader profile" },
      { order: 2, title: "Plan Instagram content", description: "Generate repeatable social content ideas.", agentSlug: "instagram-content-planner", expectedOutput: "Content calendar ideas" },
      { order: 3, title: "Write copy", description: "Draft channel-ready copy options.", agentSlug: "copywriting-agent", expectedOutput: "Copy variants" },
      { order: 4, title: "Create UX snippets", description: "Convert the message into UI or card text.", agentSlug: "wireframe-text-planner", expectedOutput: "Microcopy and card text" }
    ]
  },
  {
    id: "workflow-005",
    slug: "local-business-validation",
    name: "Local Business Validation Flow",
    summary: "Validate a local business idea with market notes, personas, messaging, and outreach.",
    description: "A practical sequence for testing local service demand before committing to build or operations.",
    targetUsers: ["founder", "marketer", "sales"],
    categories: ["business", "research", "marketing"],
    estimatedTime: "2-4 hours",
    difficulty: "intermediate",
    finalOutput: "Validation plan with target personas, landing copy, outreach messages, and assumptions.",
    steps: [
      { order: 1, title: "Analyze the area", description: "Map local customer and competitor context.", agentSlug: "local-market-analysis-agent", expectedOutput: "Market analysis" },
      { order: 2, title: "Build personas", description: "Turn research notes into useful customer profiles.", agentSlug: "customer-persona-agent", expectedOutput: "Personas" },
      { order: 3, title: "Compare competitors", description: "Identify positioning and price gaps.", agentSlug: "competitor-analysis-agent", expectedOutput: "Competitive gaps" },
      { order: 4, title: "Write landing copy", description: "Draft a focused offer and CTA.", agentSlug: "copywriting-agent", expectedOutput: "Landing copy" },
      { order: 5, title: "Write outreach", description: "Prepare respectful customer messages.", agentSlug: "customer-dm-writer", expectedOutput: "DM sequence" },
      { order: 6, title: "Set pricing rules", description: "Create a testable pricing structure.", agentSlug: "pricing-policy-agent", expectedOutput: "Pricing policy" }
    ]
  }
];

export function getWorkflowBySlug(slug: string) {
  return workflows.find((workflow) => workflow.slug === slug);
}
