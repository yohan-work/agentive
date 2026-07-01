import type { AgentUseCase, Difficulty, VerifiedStatus } from "./agent";

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
