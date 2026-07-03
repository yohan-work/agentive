import type { StarterPack } from "@/types/starter-pack";

export const starterPacks: StarterPack[] = [
  {
    slug: "engineering",
    name: "Engineering",
    summary: "Prepare, review, test, and de-risk coding-agent work.",
    targetUsers: ["developer", "pm", "founder"],
    estimatedTime: "45-120 min",
    difficulty: "intermediate",
    firstAgentSlug: "codex-task-brief",
    finalOutput: "A scoped implementation brief, review pass, root-cause notes, and QA checklist.",
    steps: [
      {
        order: 1,
        agentSlug: "codex-task-brief",
        purpose: "Convert the feature or bug request into a coding-agent-ready task.",
        handoff: "Goal, repo context, constraints, acceptance criteria, and non-goals."
      },
      {
        order: 2,
        agentSlug: "pr-review-agent",
        purpose: "Review the resulting diff for correctness, regressions, and missing tests.",
        handoff: "Diff, requirement, test output, and review focus."
      },
      {
        order: 3,
        agentSlug: "bug-root-cause-analyst",
        purpose: "Use when the implementation exposes a confusing failure or regression.",
        handoff: "Symptoms, reproduction steps, logs, and recent changes."
      },
      {
        order: 4,
        agentSlug: "qa-checklist-agent",
        purpose: "Turn the final scope into smoke, regression, and device checks.",
        handoff: "Affected surfaces, supported environments, known risks, and release boundary."
      }
    ]
  },
  {
    slug: "product-planning",
    name: "Product planning",
    summary: "Turn product ideas into requirements, priorities, and handoff-ready plans.",
    targetUsers: ["pm", "founder", "planner"],
    estimatedTime: "45-90 min",
    difficulty: "intermediate",
    firstAgentSlug: "feature-requirements-analyst",
    finalOutput: "A requirement spec, roadmap ranking, and feedback evidence summary.",
    steps: [
      {
        order: 1,
        agentSlug: "feature-requirements-analyst",
        purpose: "Define behavior, acceptance criteria, edge cases, and out-of-scope notes.",
        handoff: "Feature goal, user story, constraints, and current behavior."
      },
      {
        order: 2,
        agentSlug: "customer-feedback-clusterer",
        purpose: "Group raw customer notes into product themes and evidence.",
        handoff: "Feedback sample, channel, customer segment, and duplicate handling notes."
      },
      {
        order: 3,
        agentSlug: "product-roadmap-prioritizer",
        purpose: "Rank candidate work with impact, confidence, effort, and dependency tradeoffs.",
        handoff: "Candidate list, strategy constraints, effort estimates, and timing pressure."
      }
    ]
  },
  {
    slug: "design-qa",
    name: "Design QA",
    summary: "Move from component behavior to visual QA and landing-page critique.",
    targetUsers: ["designer", "developer", "pm"],
    estimatedTime: "30-75 min",
    difficulty: "intermediate",
    firstAgentSlug: "component-spec-agent",
    finalOutput: "A component spec, visual QA notes, and landing-page critique.",
    steps: [
      {
        order: 1,
        agentSlug: "component-spec-agent",
        purpose: "Specify component states, variants, accessibility, and responsive behavior.",
        handoff: "Component purpose, user actions, design constraints, and target surfaces."
      },
      {
        order: 2,
        agentSlug: "design-qa-agent",
        purpose: "Check implemented screens against visual intent and responsive behavior.",
        handoff: "Screenshots, design reference, viewport sizes, and known interaction states."
      },
      {
        order: 3,
        agentSlug: "landing-page-critique-agent",
        purpose: "Review message clarity, proof, CTA, and section order.",
        handoff: "Audience, offer, traffic source, page copy, and conversion goal."
      }
    ]
  },
  {
    slug: "operations-docs",
    name: "Operations docs",
    summary: "Create reusable documentation for meetings, policies, SOPs, releases, and READMEs.",
    targetUsers: ["founder", "cs", "pm", "developer"],
    estimatedTime: "30-90 min",
    difficulty: "beginner",
    firstAgentSlug: "operations-sop-agent",
    finalOutput: "A repeatable SOP, policy or release artifact, and project documentation.",
    steps: [
      {
        order: 1,
        agentSlug: "operations-sop-agent",
        purpose: "Document a repeatable process with owner, trigger, exceptions, and quality checks.",
        handoff: "Process name, owner, trigger, inputs, outputs, and known exceptions."
      },
      {
        order: 2,
        agentSlug: "meeting-summary-agent",
        purpose: "Extract decisions, action items, owners, and open questions from notes.",
        handoff: "Transcript or notes, participant names, decision context, and deadlines."
      },
      {
        order: 3,
        agentSlug: "policy-doc-writer",
        purpose: "Turn approved rules into readable policy language.",
        handoff: "Policy topic, audience, allowed use, prohibited use, exceptions, and escalation path."
      },
      {
        order: 4,
        agentSlug: "release-notes-writer",
        purpose: "Translate shipped work into user-readable release notes.",
        handoff: "Merged changes, release boundary, audience, caveats, and support notes."
      },
      {
        order: 5,
        agentSlug: "readme-generator",
        purpose: "Document project purpose, setup, scripts, features, and validation commands.",
        handoff: "Repo purpose, tech stack, setup steps, scripts, and known environment variables."
      }
    ]
  }
];
