export type Difficulty = "beginner" | "intermediate" | "advanced";

export type VerifiedStatus = "unverified" | "tested" | "community" | "expert";

export type InstallTarget = "codex" | "claude" | "cursor";

export type AgentUseCase = {
  title: string;
  context: string;
  problem: string;
  howToUse: string;
  exampleInput: string;
  expectedResult: string;
  recommendedWorkflow?: string;
};

export type AgentRunbook = {
  projectContext: string[];
  inputTemplate: string;
  starterInputs?: {
    label: string;
    description: string;
    value: string;
  }[];
  goodInputExample: string;
  badInputExample: string;
  weakInputFixes?: {
    weakInput: string;
    whyItFails: string;
    strongerInput: string;
  }[];
  expectedOutputShape?: string[];
  setupContextNotes?: string[];
  outputChecklist: string[];
  failureModes: string[];
  handoffTips: string[];
};

export type AgentSampleRun = {
  title: string;
  input: string;
  expectedOutputSummary: string;
  sampleOutput: string;
  reviewNotes: string[];
};

export type AgentEvaluation = {
  qualityScore: 1 | 2 | 3 | 4 | 5;
  testedWith: InstallTarget[];
  recommendedFor: string[];
  notRecommendedFor: string[];
  knownWeaknesses: string[];
  evaluationCriteria: string[];
  sampleRuns: AgentSampleRun[];
};

export type AgentDecisionGuide = {
  question: string;
  guidance: string;
  alternativeAgentSlug?: string;
};

export type Agent = {
  /** @pattern ^agent-[0-9]{3,}$ */
  id: string;
  /**
   * Kebab-case identifier. Must match the file name in content/agents.
   * @pattern ^[a-z0-9]+(-[a-z0-9]+)*$
   */
  slug: string;
  name: string;
  summary: string;
  description: string;
  roles: string[];
  categories: string[];
  tags: string[];
  difficulty: Difficulty;
  automationLevel: 1 | 2 | 3 | 4 | 5;
  tools: string[];
  useCases: string[];
  inputs: string[];
  outputs: string[];
  /** @minLength 20 */
  prompt: string;
  exampleInput?: string;
  exampleOutput?: string;
  limitations?: string[];
  bestPractices?: string[];
  realUseCases?: AgentUseCase[];
  sourceNotes?: string[];
  installTargets?: InstallTarget[];
  projectUse?: {
    setupFiles: string[];
    installNotes: string[];
    recommendedPlacement: string;
  };
  runbook?: AgentRunbook;
  evaluation?: AgentEvaluation;
  decisionGuide?: AgentDecisionGuide[];
  relatedAgents?: string[];
  verifiedStatus: VerifiedStatus;
  createdBy?: string;
  /** @pattern ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ */
  updatedAt: string;
};

/** Shape of an agent file in content/agents. `projectUse` is derived from `installTargets` at build time. */
export type AgentSource = Omit<Agent, "projectUse">;
