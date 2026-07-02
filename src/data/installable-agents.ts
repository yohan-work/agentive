import type { Agent, AgentEvaluation, AgentRunbook, InstallTarget } from "@/types/agent";

export const INSTALLABLE_AGENT_SLUGS = [
  "codex-task-brief",
  "pr-review-agent",
  "bug-root-cause-analyst",
  "feature-requirements-analyst",
  "qa-checklist-agent",
  "api-contract-agent",
  "test-case-generator",
  "refactor-plan-agent",
  "security-checklist-agent",
  "performance-audit-agent",
  "design-qa-agent",
  "component-spec-agent",
  "landing-page-critique-agent",
  "readme-generator",
  "release-notes-writer",
  "meeting-summary-agent",
  "policy-doc-writer",
  "operations-sop-agent",
  "customer-feedback-clusterer",
  "product-roadmap-prioritizer"
] as const;

const installableSet = new Set<string>(INSTALLABLE_AGENT_SLUGS);

const defaultTargets: InstallTarget[] = ["codex", "claude", "cursor"];

type EvaluationProfile = {
  qualityScore: AgentEvaluation["qualityScore"];
  bestFit: string;
  avoidWhen: string;
  weakness: string;
  criterion: string;
  goodScenario: string;
  boundaryScenario: string;
};

const evaluationProfiles: Record<(typeof INSTALLABLE_AGENT_SLUGS)[number], EvaluationProfile> = {
  "codex-task-brief": {
    qualityScore: 5,
    bestFit: "Turning a scoped product or engineering request into a coding-agent handoff",
    avoidWhen: "The repository behavior, acceptance criteria, and non-goals are still undecided",
    weakness: "Can become overly broad if the user asks it to define product strategy and implementation scope in one pass",
    criterion: "Names files, constraints, acceptance checks, and explicit non-goals before implementation begins",
    goodScenario: "Create a Codex brief for adding saved filters to a Next.js agent directory using localStorage only.",
    boundaryScenario: "Plan a vague redesign request where the user only says the agents page should feel better."
  },
  "pr-review-agent": {
    qualityScore: 5,
    bestFit: "Reviewing concrete diffs for correctness, regression risk, and missing tests",
    avoidWhen: "Only a feature idea is available and there is no diff, requirement, or test output",
    weakness: "Line-level precision depends on receiving the actual changed files or patch",
    criterion: "Prioritizes actionable findings with severity, file references, and test gaps before summary",
    goodScenario: "Review a pull request that changes agent search filters and includes lint output.",
    boundaryScenario: "Judge whether a large refactor is safe from a prose summary without seeing the diff."
  },
  "bug-root-cause-analyst": {
    qualityScore: 4,
    bestFit: "Triage where symptoms, logs, reproduction notes, and recent changes are available",
    avoidWhen: "The task needs proof of root cause without runtime evidence or code context",
    weakness: "May over-rank plausible causes when logs are partial or reproduction is missing",
    criterion: "Separates evidence, hypotheses, reproduction plan, and fix direction",
    goodScenario: "Analyze why bookmarks disappear after refresh using browser logs and the storage helper.",
    boundaryScenario: "Explain a production outage from a screenshot of an error toast only."
  },
  "feature-requirements-analyst": {
    qualityScore: 5,
    bestFit: "Converting a known feature goal into acceptance criteria and implementation boundaries",
    avoidWhen: "The team still needs discovery research before choosing the feature",
    weakness: "Can create excessive edge cases if release size and target platform are omitted",
    criterion: "Produces testable acceptance criteria, edge cases, dependencies, and out-of-scope notes",
    goodScenario: "Define requirements for installable-only filtering and quality score badges.",
    boundaryScenario: "Write requirements for an undefined AI platform pivot."
  },
  "qa-checklist-agent": {
    qualityScore: 4,
    bestFit: "Release and handoff QA for defined features across pages, states, and devices",
    avoidWhen: "The expected behavior and supported environments are unknown",
    weakness: "Checklist quality drops when feature scope is provided without risk areas",
    criterion: "Splits smoke checks, regression checks, device coverage, and content verification",
    goodScenario: "Create QA checks for agent detail exports on desktop and mobile.",
    boundaryScenario: "Test an entire product launch with no feature list or supported browser matrix."
  },
  "api-contract-agent": {
    qualityScore: 4,
    bestFit: "Designing request, response, error, and example shapes before parallel implementation",
    avoidWhen: "Domain rules, authorization boundaries, or data ownership are unresolved",
    weakness: "Can specify elegant schemas that do not match existing backend conventions unless examples are supplied",
    criterion: "Defines success payloads, validation errors, auth assumptions, and realistic examples",
    goodScenario: "Draft an API contract for submitting new agent ideas with moderation status.",
    boundaryScenario: "Invent a full billing API without pricing rules or account model."
  },
  "test-case-generator": {
    qualityScore: 4,
    bestFit: "Generating functional, edge, and regression cases from clear requirements",
    avoidWhen: "The implementation behavior is still exploratory and expected outputs are unknown",
    weakness: "May produce many low-value cases if priority and risk are not stated",
    criterion: "Covers happy path, empty states, combinations, persistence, and regression risk",
    goodScenario: "Generate tests for search, role filter, and installable-only filter combinations.",
    boundaryScenario: "Create tests for a future feature without a spec."
  },
  "refactor-plan-agent": {
    qualityScore: 4,
    bestFit: "Breaking risky code cleanup into reviewable steps with validation after each step",
    avoidWhen: "The team expects it to rewrite architecture without understanding current coupling",
    weakness: "Needs concrete module boundaries to avoid abstract refactor advice",
    criterion: "Sequences small changes, preserves behavior, and names verification commands",
    goodScenario: "Plan extraction of agent export formatting into smaller helpers without changing output.",
    boundaryScenario: "Redesign the whole app architecture from a single component name."
  },
  "security-checklist-agent": {
    qualityScore: 3,
    bestFit: "Creating a practical review checklist for web features before expert security review",
    avoidWhen: "The work requires formal compliance, penetration testing, or legal sign-off",
    weakness: "Checklist output is not a substitute for threat modeling or code-level security review",
    criterion: "Calls out auth, input handling, secrets, logging, dependency, and data exposure risks",
    goodScenario: "Review risks for a public submit-agent form before adding persistence.",
    boundaryScenario: "Certify that a payments integration is compliant."
  },
  "performance-audit-agent": {
    qualityScore: 3,
    bestFit: "Finding likely frontend or backend bottlenecks from traces, metrics, and code context",
    avoidWhen: "No measurement, page target, bundle data, or user symptom is available",
    weakness: "Can only prioritize hypotheses until real performance traces are provided",
    criterion: "Links each recommendation to a measurable symptom and validation method",
    goodScenario: "Audit slow agent list rendering with build stats and browser timing notes.",
    boundaryScenario: "Make the whole site faster without metrics."
  },
  "design-qa-agent": {
    qualityScore: 4,
    bestFit: "Checking implemented screens against design intent, responsive behavior, and visual polish",
    avoidWhen: "There is no screenshot, design reference, or target viewport",
    weakness: "Can miss interaction details if only static screenshots are provided",
    criterion: "Finds layout, hierarchy, state, copy, and responsive issues with concrete fixes",
    goodScenario: "QA the mobile navigation overlay and agent detail page spacing.",
    boundaryScenario: "Evaluate brand direction without seeing the interface."
  },
  "component-spec-agent": {
    qualityScore: 4,
    bestFit: "Writing component states, variants, behavior, and responsive rules for implementation",
    avoidWhen: "The product team has not decided the component purpose or user actions",
    weakness: "Can over-specify variants if the design system maturity is unclear",
    criterion: "Defines props, states, interactions, accessibility notes, and responsive constraints",
    goodScenario: "Specify an agent quality badge and installable filter control.",
    boundaryScenario: "Design a full design system from one button example."
  },
  "landing-page-critique-agent": {
    qualityScore: 4,
    bestFit: "Reviewing landing pages for message clarity, section order, and conversion friction",
    avoidWhen: "The team needs original market research or live analytics attribution",
    weakness: "Recommendations can be subjective without audience, offer, and traffic source context",
    criterion: "Ties critique to audience intent, offer clarity, proof, CTA, and section hierarchy",
    goodScenario: "Critique a SaaS landing page before writing a rebuild proposal.",
    boundaryScenario: "Predict conversion lift without analytics or experiment data."
  },
  "readme-generator": {
    qualityScore: 4,
    bestFit: "Creating or refreshing project documentation from known setup and feature details",
    avoidWhen: "Environment variables, deployment steps, or project purpose are unknown",
    weakness: "May omit hidden setup requirements unless scripts and config are supplied",
    criterion: "Documents purpose, features, setup, scripts, validation, and roadmap accurately",
    goodScenario: "Update the Agent Archive README after adding install kits and evaluations.",
    boundaryScenario: "Write complete onboarding docs for a repo without reading its config."
  },
  "release-notes-writer": {
    qualityScore: 4,
    bestFit: "Turning merged PRs, tickets, and commits into user-readable release notes",
    avoidWhen: "Changes are speculative or not yet merged into a release boundary",
    weakness: "Needs audience and release type to avoid either too much detail or too little context",
    criterion: "Groups changes by user impact, includes caveats, and avoids internal-only noise",
    goodScenario: "Write release notes for the install kit and evaluation feature phase.",
    boundaryScenario: "Announce a release from raw commit hashes with no descriptions."
  },
  "meeting-summary-agent": {
    qualityScore: 4,
    bestFit: "Extracting decisions, action items, owners, and open questions from meeting notes",
    avoidWhen: "The transcript is too sensitive to share or lacks speaker/context clues",
    weakness: "Can assign ownership incorrectly if names and decisions are ambiguous",
    criterion: "Separates decisions, actions, owners, deadlines, risks, and follow-up questions",
    goodScenario: "Summarize a product planning call into decisions and next actions.",
    boundaryScenario: "Infer commitments from informal notes that do not mention owners."
  },
  "policy-doc-writer": {
    qualityScore: 3,
    bestFit: "Drafting internal policy language from approved rules and examples",
    avoidWhen: "The policy needs legal, HR, finance, privacy, or compliance approval",
    weakness: "Can make policy wording sound final when decisions are still provisional",
    criterion: "Labels scope, definitions, allowed use, prohibited use, exceptions, and escalation path",
    goodScenario: "Draft an internal AI tool usage policy from team-approved rules.",
    boundaryScenario: "Create legally binding customer terms without counsel review."
  },
  "operations-sop-agent": {
    qualityScore: 4,
    bestFit: "Documenting repeatable workflows so another teammate can execute them consistently",
    avoidWhen: "The process is experimental and changes every time it is performed",
    weakness: "Needs real exceptions and handoff points to avoid overly linear procedures",
    criterion: "Defines trigger, owner, steps, inputs, outputs, exceptions, and quality checks",
    goodScenario: "Write an SOP for installing and validating project agent kits.",
    boundaryScenario: "Standardize a new process nobody has performed yet."
  },
  "customer-feedback-clusterer": {
    qualityScore: 4,
    bestFit: "Grouping raw feedback into themes, severity, evidence, and product next actions",
    avoidWhen: "The feedback sample is too small or already filtered to support prioritization",
    weakness: "Can overstate frequency if duplicate customers or channels are not identified",
    criterion: "Preserves representative quotes, counts themes, flags severity, and recommends next action",
    goodScenario: "Cluster 100 support notes into product improvement themes.",
    boundaryScenario: "Prioritize roadmap changes from three anecdotal comments."
  },
  "product-roadmap-prioritizer": {
    qualityScore: 4,
    bestFit: "Ranking candidate roadmap items when impact, confidence, effort, and timing inputs exist",
    avoidWhen: "Leadership has not agreed on strategy, constraints, or scoring dimensions",
    weakness: "Scoring can look objective even when the inputs are subjective guesses",
    criterion: "Shows scoring assumptions, tradeoffs, confidence, dependencies, and sequencing rationale",
    goodScenario: "Rank 20 feature candidates for the next quarter with effort estimates.",
    boundaryScenario: "Choose the company strategy from a brainstorm list."
  }
};

const runbookOverrides: Partial<Record<(typeof INSTALLABLE_AGENT_SLUGS)[number], Partial<AgentRunbook>>> = {
  "codex-task-brief": {
    goodInputExample: `Goal: add an installable-only filter to the agents page.
Repo context: Next.js App Router, agent search lives in src/components/agents/agent-search-panel.tsx and filtering lives in src/lib/search.ts.
Constraints: keep static data, no URL persistence in this pass.
Acceptance criteria: checkbox filters installable agents, clear filters resets it, build and data checks pass.`,
    badInputExample: "Make the agents page better for Codex.",
    failureModes: [
      "The brief asks Codex to infer repository structure instead of naming the relevant files",
      "Acceptance criteria are phrased as taste preferences instead of observable behavior",
      "Non-goals such as database work or URL state are omitted"
    ]
  },
  "pr-review-agent": {
    goodInputExample: `Diff summary: installable agents now receive generated evaluation metadata.
Requirement: ensure project-ready agents show trustworthy quality signals.
Test output: npm run check:data passed.
Review focus: behavioral regressions, misleading quality claims, missing validation.`,
    badInputExample: "Review my PR and tell me if it is good.",
    failureModes: [
      "No diff or changed files are provided",
      "The review returns style preferences before correctness issues",
      "Findings lack severity or concrete file references"
    ]
  },
  "feature-requirements-analyst": {
    goodInputExample: `Feature goal: add role-specific starter packs to /install.
Users: developers, PMs, designers, operations owners.
Constraints: static data only, use existing agents and card components.
Expected output: requirements, acceptance criteria, edge cases, and out-of-scope notes.`,
    badInputExample: "Add some recommendations to the install page.",
    failureModes: [
      "The output does not define which user problem the feature solves",
      "Acceptance criteria do not mention empty or missing-agent states",
      "Scope creep introduces personalization or accounts"
    ]
  },
  "qa-checklist-agent": {
    goodInputExample: `Feature: install kit export includes RUNBOOK.md and EVALUATION.md.
Affected surfaces: agent detail page, install page, downloaded markdown files.
Devices: desktop and mobile.
Known risks: browser download blocking, stale copy, missing evaluation content.`,
    badInputExample: "Make a QA list for the website.",
    failureModes: [
      "The checklist ignores downloaded file contents",
      "Mobile and desktop states are mixed into one vague item",
      "Regression checks do not cover non-installable agents"
    ]
  },
  "operations-sop-agent": {
    goodInputExample: `Process: adding a new project-ready agent.
Owner: content maintainer.
Inputs: approved slug, agent metadata, runbook, evaluation, sample runs.
Quality bar: check:data, lint, build pass before handoff.
Output: step-by-step SOP with review checkpoints and rollback notes.`,
    badInputExample: "Write an SOP for agent stuff.",
    failureModes: [
      "The SOP omits the trigger and owner",
      "Review checkpoints are not tied to commands or visible page checks",
      "Exceptions for rejected or incomplete agents are missing"
    ]
  }
};

function createRunbook(agent: Agent) {
  const contextFields = Array.from(new Set(["Project goal", "Current repository or workflow context", ...agent.inputs]));
  const outputChecklist = Array.from(
    new Set([
      ...agent.outputs.map((output) => `Includes ${output}`),
      "States assumptions separately from confirmed facts",
      "Lists concrete next actions",
      "Calls out risks or missing context"
    ])
  );

  return {
    projectContext: contextFields,
    inputTemplate: `Project:

Goal:

Current context:

Constraints:

Available files, notes, or data:

Expected output:
${agent.outputs.map((output) => `- ${output}`).join("\n")}`,
    goodInputExample: `${agent.exampleInput ?? agent.useCases[0] ?? agent.summary}

Goal: produce ${agent.outputs[0] ?? "a practical output"} for a real project.
Constraints: keep the result specific, structured, and ready for handoff.`,
    badInputExample: `Help me with ${agent.name}.`,
    outputChecklist,
    failureModes: [
      "The input is too broad or lacks project context",
      "The output is generic and does not mention concrete constraints",
      "The result skips assumptions, risks, or next actions",
      "The agent invents project facts that were not provided"
    ],
    handoffTips: [
      "Paste relevant project files, notes, or constraints before asking for the final output.",
      "Ask for a first draft, then request a stricter revision using the checklist.",
      "Keep the generated output with the project ticket, PR, proposal, or team document."
    ]
  };
}

function createEvaluation(agent: Agent): NonNullable<Agent["evaluation"]> {
  const profile = evaluationProfiles[agent.slug as (typeof INSTALLABLE_AGENT_SLUGS)[number]];

  if (profile) {
    return {
      qualityScore: profile.qualityScore,
      testedWith: defaultTargets,
      recommendedFor: [
        profile.bestFit,
        `Teams with the required inputs ready: ${agent.inputs.slice(0, 3).join(", ")}`,
        "Project work where a human owner will review assumptions, risks, and final output"
      ],
      notRecommendedFor: [
        profile.avoidWhen,
        "Fully autonomous production changes without human review",
        "Work requiring legal, financial, medical, compliance, or security certification"
      ],
      knownWeaknesses: [
        profile.weakness,
        "Output quality drops when constraints, source material, or target audience are omitted",
        "Final decisions still need review by the project owner"
      ],
      evaluationCriteria: [
        profile.criterion,
        `Produces ${agent.outputs[0] ?? "the primary deliverable"} in a format that can be pasted into a ticket, PR, document, or handoff`,
        "States assumptions, missing context, risks, and concrete next actions separately"
      ],
      sampleRuns: [
        {
          title: `${agent.name} strong-context run`,
          input: profile.goodScenario,
          expectedOutputSummary: `A usable ${agent.outputs[0] ?? "project deliverable"} with project-specific assumptions, risks, and next steps.`,
          sampleOutput: `${agent.outputs[0] ?? "Deliverable"}: a structured response grounded in the supplied scenario, with explicit constraints, review checkpoints, and owner-ready next actions.`,
          reviewNotes: [
            "Confirm the output references the supplied scenario instead of generic advice.",
            "Check that assumptions and missing context are separated from confirmed facts.",
            "Verify the result can be reused in the project artifact named by the request."
          ]
        },
        {
          title: `${agent.name} boundary run`,
          input: profile.boundaryScenario,
          expectedOutputSummary: "A cautious response that narrows scope, asks for missing required context, and avoids pretending the task is fully specified.",
          sampleOutput: "The agent should identify missing inputs, explain why the request is under-specified, propose a tighter next prompt, and avoid final claims that require unavailable evidence.",
          reviewNotes: [
            "The agent should not invent project facts to fill missing context.",
            "The response should make the next user action clear.",
            "A strong output refuses false certainty while still moving the work forward."
          ]
        }
      ]
    };
  }

  return {
    qualityScore: 4,
    testedWith: defaultTargets,
    recommendedFor: [
      `Teams that need ${agent.outputs[0] ?? "a practical handoff"} from real project context`,
      `Projects where ${agent.inputs[0] ?? "clear input context"} is available before the agent runs`,
      "Repeatable work that benefits from a checklist-driven review step"
    ],
    notRecommendedFor: [
      "Tasks with no project context, source material, or decision owner",
      "Fully autonomous production changes without human review",
      "Work requiring legal, financial, medical, or compliance sign-off"
    ],
    knownWeaknesses: [
      "Output quality drops when the request omits constraints, examples, or target audience",
      "The agent can over-generalize if the project state is not pasted or referenced",
      "Final decisions still need review by the project owner"
    ],
    evaluationCriteria: [
      "Uses only supplied project facts and labels assumptions clearly",
      `Produces ${agent.outputs[0] ?? "the primary expected output"} in a usable handoff format`,
      "Includes risks, missing context, and concrete next actions",
      "Matches the tone, constraints, and level of detail requested by the user"
    ],
    sampleRuns: [
      {
        title: `${agent.name} project handoff`,
        input: agent.exampleInput ?? agent.useCases[0] ?? agent.summary,
        expectedOutputSummary: `A project-ready response that includes ${agent.outputs.slice(0, 2).join(" and ") || "the expected deliverable"}.`,
        sampleOutput:
          agent.exampleOutput ??
          `The agent should return a structured draft with assumptions, project-specific recommendations, review notes, and next actions for ${agent.useCases[0] ?? agent.summary}.`,
        reviewNotes: [
          "Check that the output refers to the supplied project context instead of generic advice.",
          "Confirm the deliverable can be pasted into a ticket, PR, document, or team handoff.",
          "Ask one revision pass if the output misses risks, constraints, or owner-ready next steps."
        ]
      }
    ]
  };
}

export function isInstallableAgent(agent: Pick<Agent, "slug">) {
  return installableSet.has(agent.slug);
}

export function withInstallMetadata(agent: Agent): Agent {
  if (!isInstallableAgent(agent)) {
    return agent;
  }

  return {
    ...agent,
    installTargets: defaultTargets,
    projectUse: {
      recommendedPlacement: "Project root for AGENTS.md and CLAUDE.md; .cursor/rules for Cursor rules.",
      setupFiles: ["AGENTS.md", "CLAUDE.md", ".cursor/rules/{agent-slug}.mdc", "agent.json", "README.md", "RUNBOOK.md", "EVALUATION.md"],
      installNotes: [
        "Copy AGENTS.md into the project root for Codex-style coding-agent instructions.",
        "Copy CLAUDE.md into the project root when using Claude with project context.",
        "Copy the Cursor rule into .cursor/rules when using Cursor.",
        "Keep agent.json alongside project documentation if another tool needs machine-readable metadata.",
        "Use RUNBOOK.md to prepare context, run the agent, and review the output before handoff.",
        "Use EVALUATION.md to understand tested scenarios, sample outputs, weaknesses, and review criteria."
      ]
    },
    runbook: { ...createRunbook(agent), ...runbookOverrides[agent.slug as (typeof INSTALLABLE_AGENT_SLUGS)[number]] },
    evaluation: createEvaluation(agent)
  };
}
