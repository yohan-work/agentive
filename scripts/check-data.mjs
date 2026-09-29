import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAgentContent } from "./lib/agent-content.mjs";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function unique(values) {
  return Array.from(new Set(values));
}

function matchAll(text, pattern, group = 1) {
  return Array.from(text.matchAll(pattern), (match) => match[group]);
}

function parseStringArray(source) {
  return matchAll(source, /"([^"]+)"/g);
}

const workflowsSource = read("src/data/workflows.ts");
const starterPacksSource = read("src/data/starter-packs.ts");
const taxonomySource = read("src/data/taxonomy.ts");
const impactSource = read("src/data/impact-scenarios.ts");
const dictionarySource = read("src/i18n/dictionaries.ts");
const installKitSource = read("src/lib/agent-install-kit.ts");

// Agents: one YAML file per agent in content/agents, validated against schema/agent.schema.json.
const { agents, failures: schemaFailures } = loadAgentContent(root);

const agentSlugs = agents.map((agent) => agent.slug);
const uniqueAgentSlugs = unique(agentSlugs);
const duplicateSlugs = uniqueAgentSlugs.filter((slug) => agentSlugs.filter((candidate) => candidate === slug).length > 1);
const agentIds = agents.map((agent) => agent.id);
const duplicateIds = unique(agentIds).filter((id) => agentIds.filter((candidate) => candidate === id).length > 1);

const relatedAgentSlugs = agents.flatMap((agent) => [
  ...(agent.relatedAgents ?? []),
  ...(agent.decisionGuide ?? []).flatMap((guide) => (guide.alternativeAgentSlug ? [guide.alternativeAgentSlug] : []))
]);
const missingRelated = unique(relatedAgentSlugs.filter((slug) => !uniqueAgentSlugs.includes(slug)));

const workflowAgentSlugs = matchAll(workflowsSource, /agentSlug:\s*"([^"]+)"/g);
const missingWorkflowAgents = unique(workflowAgentSlugs.filter((slug) => !uniqueAgentSlugs.includes(slug)));
const starterPackAgentSlugs = matchAll(starterPacksSource, /agentSlug:\s*"([^"]+)"/g);
const starterPackFirstAgentSlugs = matchAll(starterPacksSource, /firstAgentSlug:\s*"([^"]+)"/g);
const missingStarterPackAgents = unique(
  [...starterPackAgentSlugs, ...starterPackFirstAgentSlugs].filter((slug) => !uniqueAgentSlugs.includes(slug))
);
const starterPackSlugs = matchAll(starterPacksSource, /slug:\s*"([^"]+)"/g);
const duplicateStarterPacks = unique(starterPackSlugs).filter(
  (slug) => starterPackSlugs.filter((candidate) => candidate === slug).length > 1
);
const impactAgentSlugs = Array.from(impactSource.matchAll(/agentSlugs:\s*\[([\s\S]*?)\]/g)).flatMap((match) =>
  parseStringArray(match[1])
);
const missingImpactAgents = unique(impactAgentSlugs.filter((slug) => !uniqueAgentSlugs.includes(slug)));
const workflowSlugs = matchAll(workflowsSource, /slug:\s*"([^"]+)"/g);
const impactWorkflowSlugs = matchAll(impactSource, /primaryWorkflowSlug:\s*"([^"]+)"/g);
const missingImpactWorkflows = unique(impactWorkflowSlugs.filter((slug) => !workflowSlugs.includes(slug)));
const impactScenarioCount = matchAll(impactSource, /slug:\s*"([^"]+)"/g).length;
const dictionaryEnKeys = matchAll(dictionarySource.match(/en:\s*{([\s\S]*?)},\n  ko:/)?.[1] ?? "", /^\s+([a-zA-Z][a-zA-Z0-9]*):/gm);
const dictionaryKoKeys = matchAll(dictionarySource.match(/ko:\s*{([\s\S]*?)\n  }\n} as const/)?.[1] ?? "", /^\s+([a-zA-Z][a-zA-Z0-9]*):/gm);
const missingKoDictionaryKeys = unique(dictionaryEnKeys.filter((key) => !dictionaryKoKeys.includes(key)));
const missingEnDictionaryKeys = unique(dictionaryKoKeys.filter((key) => !dictionaryEnKeys.includes(key)));

// Project-ready agents (those with installTargets) need the full runbook, evaluation, and decision guide.
const installableAgents = agents.filter((agent) => agent.installTargets?.length);
const requiredRunbookFields = [
  "starterInputs",
  "weakInputFixes",
  "expectedOutputShape",
  "setupContextNotes",
  "outputChecklist",
  "failureModes",
  "handoffTips"
];
const incompleteInstallable = installableAgents.flatMap((agent) => {
  const problems = [];
  if (!agent.runbook) problems.push("runbook");
  else for (const field of requiredRunbookFields) if (!agent.runbook[field]?.length) problems.push(`runbook.${field}`);
  if (!agent.evaluation) problems.push("evaluation");
  else if (agent.evaluation.sampleRuns.length < 2) problems.push("evaluation.sampleRuns (need at least 2)");
  if (!agent.decisionGuide?.length) problems.push("decisionGuide");
  return problems.length ? [`${agent.slug}: missing ${problems.join(", ")}`] : [];
});
// "tested" and "expert" promise recorded sample runs (see CONTRIBUTING.md), so the evidence has to be in the file.
const overstatedVerification = agents
  .filter((agent) => ["tested", "expert"].includes(agent.verifiedStatus) && !(agent.evaluation?.sampleRuns.length >= 2))
  .map((agent) => `${agent.slug}: verifiedStatus "${agent.verifiedStatus}" needs an evaluation with at least 2 sample runs`);
const agentLoaderSource = read("src/data/agents.ts");
const setupFilesBlock = agentLoaderSource.match(/setupFiles:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
const hasRunbookKitFile = /"RUNBOOK\.md"/.test(setupFilesBlock) && /toRunbookFile/.test(installKitSource);
const hasEvaluationKitFile = /"EVALUATION\.md"/.test(setupFilesBlock) && /toEvaluationFile/.test(installKitSource);

const taxonomyRoles = parseStringArray(taxonomySource.match(/export const roles:[\s\S]*?\];/)?.[0] ?? "").filter((value) =>
  /^[a-z0-9-]+$/.test(value)
);
const taxonomyCategories = parseStringArray(taxonomySource.match(/export const categories:[\s\S]*?\];/)?.[0] ?? "").filter((value) =>
  /^[a-z0-9-]+$/.test(value)
);

const missingRoles = unique(agents.flatMap((agent) => agent.roles).filter((role) => !taxonomyRoles.includes(role)));
const missingCategories = unique(
  agents.flatMap((agent) => agent.categories).filter((category) => !taxonomyCategories.includes(category))
);

const totalAgents = agents.length;

const failures = [
  ...schemaFailures,
  duplicateSlugs.length ? `Duplicate agent slugs: ${duplicateSlugs.join(", ")}` : "",
  missingRelated.length ? `Missing related agent slugs: ${missingRelated.join(", ")}` : "",
  missingWorkflowAgents.length ? `Missing workflow agent slugs: ${missingWorkflowAgents.join(", ")}` : "",
  missingStarterPackAgents.length ? `Missing starter pack agent slugs: ${missingStarterPackAgents.join(", ")}` : "",
  duplicateStarterPacks.length ? `Duplicate starter pack slugs: ${duplicateStarterPacks.join(", ")}` : "",
  starterPackSlugs.length < 4 ? `Expected at least 4 starter packs, found ${starterPackSlugs.length}` : "",
  missingImpactAgents.length ? `Missing impact scenario agent slugs: ${missingImpactAgents.join(", ")}` : "",
  missingImpactWorkflows.length ? `Missing impact scenario workflow slugs: ${missingImpactWorkflows.join(", ")}` : "",
  impactScenarioCount < 3 ? `Expected at least 3 impact scenarios, found ${impactScenarioCount}` : "",
  missingKoDictionaryKeys.length ? `Korean dictionary missing keys: ${missingKoDictionaryKeys.join(", ")}` : "",
  missingEnDictionaryKeys.length ? `English dictionary missing keys: ${missingEnDictionaryKeys.join(", ")}` : "",
  duplicateIds.length ? `Duplicate agent ids: ${duplicateIds.join(", ")}` : "",
  installableAgents.length < 20 ? `Expected at least 20 installable agents, found ${installableAgents.length}` : "",
  ...incompleteInstallable,
  ...overstatedVerification,
  !hasRunbookKitFile ? "Installable kits must include RUNBOOK.md" : "",
  !hasEvaluationKitFile ? "Installable kits must include EVALUATION.md" : "",
  missingRoles.length ? `Unknown roles: ${missingRoles.join(", ")}` : "",
  missingCategories.length ? `Unknown categories: ${missingCategories.join(", ")}` : "",
  totalAgents < 100 ? `Expected at least 100 agents, found ${totalAgents}` : ""
].filter(Boolean);

if (failures.length) {
  console.error("Data integrity check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Data integrity check passed: ${totalAgents} agents, ${workflowAgentSlugs.length} workflow steps, ${starterPackSlugs.length} starter packs, ${installableAgents.length} installable agents.`
);
