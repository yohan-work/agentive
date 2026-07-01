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
const taxonomySource = read("src/data/taxonomy.ts");

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

const installableSlugs = Array.from(
  installableSource.match(/INSTALLABLE_AGENT_SLUGS\s*=\s*\[([\s\S]*?)\]/)?.[1]?.matchAll(/"([^"]+)"/g) ?? [],
  (match) => match[1]
);
const missingInstallable = unique(installableSlugs.filter((slug) => !uniqueAgentSlugs.includes(slug)));
const duplicateInstallable = unique(installableSlugs).filter(
  (slug) => installableSlugs.filter((candidate) => candidate === slug).length > 1
);
const hasRunbookFactory = /function createRunbook/.test(installableSource) && /runbook:\s*createRunbook\(agent\)/.test(installableSource);

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
  missingInstallable.length ? `Missing installable agent slugs: ${missingInstallable.join(", ")}` : "",
  duplicateInstallable.length ? `Duplicate installable agent slugs: ${duplicateInstallable.join(", ")}` : "",
  installableSlugs.length !== 20 ? `Expected 20 installable agents, found ${installableSlugs.length}` : "",
  !hasRunbookFactory ? "Installable agents must receive runbook metadata" : "",
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
  `Data integrity check passed: ${totalAgents} agents, ${workflowAgentSlugs.length} workflow steps, ${installableSlugs.length} installable agents.`
);
