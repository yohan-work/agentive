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
  goodInputExample: string;
  badInputExample: string;
  outputChecklist: string[];
  failureModes: string[];
  handoffTips: string[];
};

export type Agent = {
  id: string;
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
  relatedAgents?: string[];
  verifiedStatus: VerifiedStatus;
  createdBy?: string;
  updatedAt: string;
};
