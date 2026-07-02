import type { ImpactScenario } from "@/types/impact";

export const impactScenarios: ImpactScenario[] = [
  {
    slug: "engineering-feature-handoff",
    title: "From loose feature idea to merge-ready handoff",
    audience: "Engineering teams",
    problem: "A feature request reaches the developer as a vague paragraph, so implementation starts before scope, tests, and review criteria are aligned.",
    before: [
      "Feature idea is scattered across chat, a ticket, and a short product note",
      "Codex receives a broad request with missing files, constraints, and non-goals",
      "QA and PR review happen late, after assumptions have already shaped the code"
    ],
    agentSlugs: ["feature-requirements-analyst", "codex-task-brief", "qa-checklist-agent", "pr-review-agent"],
    outputs: ["Implementation-ready requirements", "Codex task brief", "Release QA checklist", "Prioritized PR findings"],
    after: [
      "The developer starts from acceptance criteria and explicit non-goals",
      "Codex receives files, constraints, test plan, and expected behavior before editing",
      "Review focuses on regression risk instead of rediscovering scope"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Fewer rewrite loops before implementation" },
      { label: "Review quality", value: "Findings tied to acceptance criteria" },
      { label: "Team clarity", value: "One shared brief for PM, developer, and reviewer" }
    ],
    primaryWorkflowSlug: "codex-development-prep"
  },
  {
    slug: "product-feedback-to-roadmap",
    title: "From raw customer feedback to roadmap decision",
    audience: "Product teams",
    problem: "Customer feedback is plentiful, but themes, severity, and roadmap tradeoffs are not visible enough to make a confident decision.",
    before: [
      "Support notes and sales comments are reviewed one by one",
      "Roadmap discussion favors loud anecdotes over grouped evidence",
      "The team leaves with priorities but weak rationale"
    ],
    agentSlugs: ["customer-feedback-clusterer", "feature-requirements-analyst", "product-roadmap-prioritizer"],
    outputs: ["Feedback theme map", "Feature requirement candidates", "Prioritized roadmap with assumptions"],
    after: [
      "Repeated problems are grouped by theme, severity, and evidence",
      "Candidate features have clearer acceptance criteria and unresolved questions",
      "Roadmap tradeoffs are visible before leadership chooses sequence"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Roadmap meeting starts from evidence clusters" },
      { label: "Decision quality", value: "Priority includes confidence and effort assumptions" },
      { label: "Handoff value", value: "Chosen items are closer to implementation briefs" }
    ]
  },
  {
    slug: "operations-knowledge-system",
    title: "From repeated explanations to reusable operating system",
    audience: "Operations and founder-led teams",
    problem: "Recurring work is explained verbally every time, so quality depends on who happens to remember the process.",
    before: [
      "Meeting notes, policy decisions, and process steps live in separate places",
      "New teammates need repeated explanations before they can execute",
      "Exceptions are handled from memory instead of a shared checklist"
    ],
    agentSlugs: ["meeting-summary-agent", "operations-sop-agent", "policy-doc-writer", "readme-generator"],
    outputs: ["Decision and action summary", "Standard operating procedure", "Policy draft", "Project README"],
    after: [
      "Meetings turn into decisions, owners, and open questions",
      "Recurring work has a trigger, owner, steps, exceptions, and quality checks",
      "New teammates can follow a document instead of asking for the whole context again"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Less repeated explanation for recurring work" },
      { label: "Process quality", value: "Exceptions and checks are visible" },
      { label: "Onboarding value", value: "Documentation becomes the first handoff" }
    ],
    primaryWorkflowSlug: "meeting-notes-automation"
  }
];
