import type { Difficulty } from "./agent";

export type WorkflowStep = {
  order: number;
  title: string;
  description: string;
  agentSlug: string;
  expectedOutput: string;
};

export type Workflow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  targetUsers: string[];
  categories: string[];
  estimatedTime: string;
  steps: WorkflowStep[];
  finalOutput: string;
  difficulty: Difficulty;
};
