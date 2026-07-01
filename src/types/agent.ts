export type Difficulty = "beginner" | "intermediate" | "advanced";

export type VerifiedStatus = "unverified" | "tested" | "community" | "expert";

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
  relatedAgents?: string[];
  verifiedStatus: VerifiedStatus;
  createdBy?: string;
  updatedAt: string;
};
