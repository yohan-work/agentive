import type { Difficulty } from "./agent";

export type StarterPackStep = {
  order: number;
  agentSlug: string;
  purpose: string;
  handoff: string;
};

export type StarterPack = {
  slug: string;
  name: string;
  summary: string;
  targetUsers: string[];
  estimatedTime: string;
  difficulty: Difficulty;
  firstAgentSlug: string;
  finalOutput: string;
  steps: StarterPackStep[];
};
