export type ImpactMetric = {
  label: string;
  value: string;
};

export type ImpactScenario = {
  slug: string;
  title: string;
  audience: string;
  problem: string;
  before: string[];
  agentSlugs: string[];
  outputs: string[];
  after: string[];
  impactMetrics: ImpactMetric[];
  primaryWorkflowSlug?: string;
};
