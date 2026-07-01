import type { AgentUseCase, Difficulty, InstallTarget, VerifiedStatus } from "./agent";

export type PortableAgentCard = {
  version: "1.0";
  slug: string;
  name: string;
  summary: string;
  description: string;
  roleInstruction: string;
  useCases: string[];
  inputs: string[];
  outputs: string[];
  prompt: string;
  exampleInput?: string;
  exampleOutput?: string;
  bestPractices: string[];
  limitations: string[];
  realUseCases: AgentUseCase[];
  installTargets: InstallTarget[];
  projectUse?: {
    setupFiles: string[];
    installNotes: string[];
    recommendedPlacement: string;
  };
  instructions: string;
  contextRequirements: string[];
  expectedProjectFiles: string[];
  usageExamples: string[];
  targetFiles: string[];
  tags: string[];
  metadata: {
    roles: string[];
    categories: string[];
    tools: string[];
    difficulty: Difficulty;
    automationLevel: number;
    verifiedStatus: VerifiedStatus;
    updatedAt: string;
  };
};
