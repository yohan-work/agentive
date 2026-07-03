export type ImpactMetric = {
  label: string;
  value: string;
};

export type ImpactScenarioTranslation = {
  title: string;
  audience: string;
  problem: string;
  before: string[];
  outputs: string[];
  after: string[];
  impactMetrics: ImpactMetric[];
  plainBenefit: string;
  effectTags: string[];
  recommendedStart: string;
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
  plainBenefit: string;
  effectTags: string[];
  recommendedStart: string;
  primaryWorkflowSlug?: string;
  translations?: {
    ko?: ImpactScenarioTranslation;
  };
};
