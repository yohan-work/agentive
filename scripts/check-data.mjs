import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const agentsSource = read("src/data/agents.ts");
const expansionSource = read("src/data/agent-expansion.ts");
const installableSource = read("src/data/installable-agents.ts");
const workflowsSource = read("src/data/workflows.ts");
const starterPacksSource = read("src/data/starter-packs.ts");
const taxonomySource = read("src/data/taxonomy.ts");
const impactSource = read("src/data/impact-scenarios.ts");
const dictionarySource = read("src/i18n/dictionaries.ts");

const agentSlugs = [
  ...matchAll(agentsSource, /slug:\s*"([^"]+)"/g),
  ...matchAll(expansionSource, /slug:\s*"([^"]+)"/g)
];
const uniqueAgentSlugs = unique(agentSlugs);
const duplicateSlugs = uniqueAgentSlugs.filter((slug) => agentSlugs.filter((candidate) => candidate === slug).length > 1);

const relatedAgentSlugs = Array.from(agentsSource.matchAll(/relatedAgents:\s*\[([\s\S]*?)\]/g)).flatMap((match) =>
  parseStringArray(match[1])
);
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
const dictionaryEnKeys = matchAll(dictionarySource.match(/en:\s*{([\s\S]*?)},\n  ko:/)?.[1] ?? "", /([a-zA-Z][a-zA-Z0-9]*):/g);
const dictionaryKoKeys = matchAll(dictionarySource.match(/ko:\s*{([\s\S]*?)\n  }\n} as const/)?.[1] ?? "", /([a-zA-Z][a-zA-Z0-9]*):/g);
const missingKoDictionaryKeys = unique(dictionaryEnKeys.filter((key) => !dictionaryKoKeys.includes(key)));
const missingEnDictionaryKeys = unique(dictionaryKoKeys.filter((key) => !dictionaryEnKeys.includes(key)));

const installableSlugs = Array.from(
  installableSource.match(/INSTALLABLE_AGENT_SLUGS\s*=\s*\[([\s\S]*?)\]/)?.[1]?.matchAll(/"([^"]+)"/g) ?? [],
  (match) => match[1]
);
const missingInstallable = unique(installableSlugs.filter((slug) => !uniqueAgentSlugs.includes(slug)));
const duplicateInstallable = unique(installableSlugs).filter(
  (slug) => installableSlugs.filter((candidate) => candidate === slug).length > 1
);
const hasRunbookFactory = /function createRunbook/.test(installableSource) && /createRunbook\(agent\)/.test(installableSource);
const hasEvaluationFactory =
  /function createEvaluation/.test(installableSource) && /evaluation:\s*createEvaluation\(agent\)/.test(installableSource);
const hasDecisionGuideFactory =
  /function createDecisionGuide/.test(installableSource) && /decisionGuide:\s*createDecisionGuide\(agent\)/.test(installableSource);
const installKitSource = read("src/lib/agent-install-kit.ts");
const hasRunbookKitFile = /RUNBOOK\.md/.test(installableSource) && /toRunbookFile/.test(installKitSource);
const hasEvaluationKitFile = /EVALUATION\.md/.test(installableSource) && /toEvaluationFile/.test(installKitSource);
const evaluationProfileBlock = installableSource.match(/const evaluationProfiles:[\s\S]*?const runbookOverrides/)?.[0] ?? "";
const missingEvaluationProfiles = installableSlugs.filter((slug) => !evaluationProfileBlock.includes(`"${slug}": {`));
const evaluationScores = matchAll(evaluationProfileBlock, /qualityScore:\s*([1-5])/g).map(Number);
const hasDifferentiatedQualityScores = unique(evaluationScores).length > 1;
const hasTwoSampleRuns = /sampleRuns:\s*\[\s*{[\s\S]*?},\s*{/.test(installableSource);
const runbookOverrideBlock = installableSource.match(/const runbookOverrides:[\s\S]*?function createRunbook/)?.[0] ?? "";
const runbookOverrideCount = matchAll(runbookOverrideBlock, /"[^"]+":\s*{/g, 0).length;
const hasStarterInputs = /starterInputs:\s*\[/.test(installableSource);
const hasWeakInputFixes = /weakInputFixes:\s*\[/.test(installableSource);
const hasExpectedOutputShape = /expectedOutputShape:\s*\[/.test(installableSource);
const hasSetupContextNotes = /setupContextNotes:\s*\[/.test(installableSource);

const taxonomyRoles = parseStringArray(taxonomySource.match(/export const roles:[\s\S]*?\];/)?.[0] ?? "").filter((value) =>
  /^[a-z0-9-]+$/.test(value)
);
const taxonomyCategories = parseStringArray(taxonomySource.match(/export const categories:[\s\S]*?\];/)?.[0] ?? "").filter((value) =>
  /^[a-z0-9-]+$/.test(value)
);

const roleBlocks = [
  ...Array.from(agentsSource.matchAll(/roles:\s*\[([\s\S]*?)\]/g), (match) => match[1]),
  ...Array.from(expansionSource.matchAll(/roles:\s*\[([\s\S]*?)\]/g), (match) => match[1])
];
const categoryBlocks = [
  ...Array.from(agentsSource.matchAll(/categories:\s*\[([\s\S]*?)\]/g), (match) => match[1]),
  ...Array.from(expansionSource.matchAll(/categories:\s*\[([\s\S]*?)\]/g), (match) => match[1])
];

const missingRoles = unique(roleBlocks.flatMap(parseStringArray).filter((role) => !taxonomyRoles.includes(role)));
const missingCategories = unique(
  categoryBlocks.flatMap(parseStringArray).filter((category) => !taxonomyCategories.includes(category))
);

const coreAgentCount = matchAll(agentsSource, /id:\s*"agent-\d+"/g, 0).length;
const expansionAgentCount = matchAll(expansionSource, /slug:\s*"([^"]+)"/g).length;
const totalAgents = coreAgentCount + expansionAgentCount;

const failures = [
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
  missingInstallable.length ? `Missing installable agent slugs: ${missingInstallable.join(", ")}` : "",
  duplicateInstallable.length ? `Duplicate installable agent slugs: ${duplicateInstallable.join(", ")}` : "",
  installableSlugs.length !== 20 ? `Expected 20 installable agents, found ${installableSlugs.length}` : "",
  !hasRunbookFactory ? "Installable agents must receive runbook metadata" : "",
  !hasEvaluationFactory ? "Installable agents must receive quality evaluation metadata" : "",
  !hasDecisionGuideFactory ? "Installable agents must receive decision guide metadata" : "",
  !hasRunbookKitFile ? "Installable kits must include RUNBOOK.md" : "",
  !hasEvaluationKitFile ? "Installable kits must include EVALUATION.md" : "",
  missingEvaluationProfiles.length
    ? `Installable agents missing manual evaluation profiles: ${missingEvaluationProfiles.join(", ")}`
    : "",
  evaluationScores.length < installableSlugs.length
    ? `Expected at least ${installableSlugs.length} manual quality scores, found ${evaluationScores.length}`
    : "",
  !hasDifferentiatedQualityScores ? "Installable agent quality scores must be differentiated" : "",
  !hasTwoSampleRuns ? "Installable agent evaluations must include at least two sample runs" : "",
  runbookOverrideCount < 5 ? `Expected at least 5 manual runbook overrides, found ${runbookOverrideCount}` : "",
  !hasStarterInputs ? "Installable runbooks must include starter input examples" : "",
  !hasWeakInputFixes ? "Installable runbooks must include weak input diagnostics" : "",
  !hasExpectedOutputShape ? "Installable runbooks must include expected output shape guidance" : "",
  !hasSetupContextNotes ? "Installable runbooks must include setup context notes" : "",
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
  `Data integrity check passed: ${totalAgents} agents, ${workflowAgentSlugs.length} workflow steps, ${starterPackSlugs.length} starter packs, ${installableSlugs.length} installable agents.`
);
