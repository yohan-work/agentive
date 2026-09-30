// Builds blind pairwise judge files for two variants of one agent, in both orders.
//
//   node scripts/eval/pairs.mjs <slug> <variantA> <variantB> [--sample <n>]
//
// order1 shows variantA as "A"; order2 swaps them. Judges only see "A" and "B", the request, and the
// agent's task-specific criterion (never the prompt's own formatting rules, which would make the
// comparison circular). Pair and verdict files get random names so neither the path nor the content
// tells the judge which variant is which; the mapping stays in .eval-work/judge-manifest.json until
// scripts/eval/collect.mjs files the verdicts under evals/verdicts/. Prints the pair file and the path
// the judge should write its verdict to, for each order.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, parseSample, readAgent, readCases, readRun, workDir, writeJson } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [slug, variantA, variantB] = positional;
// Pairs sample n of one variant with sample n of the other.
const sample = parseSample(flags.sample);
if (!slug || !variantA || !variantB) {
  console.error("Usage: node scripts/eval/pairs.mjs <slug> <variantA> <variantB> [--sample <n>]");
  process.exit(1);
}

const judgeDir = join(workDir, "judge");
// Kept outside judgeDir so a judge browsing its own folder cannot find the variant mapping.
const manifestPath = join(workDir, "judge-manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : [];

const criterion = readAgent(slug).evaluation?.evaluationCriteria?.[0];
const cases = readCases(slug);

for (const order of [1, 2]) {
  const [first, second] = order === 1 ? [variantA, variantB] : [variantB, variantA];
  const id = randomBytes(6).toString("hex");
  const pairFile = join(judgeDir, `${id}.json`);
  const verdictFile = join(judgeDir, `${id}.verdict.json`);
  writeJson(pairFile, {
    cases: cases.map((testCase) => ({
      id: testCase.id,
      input: testCase.input.trim(),
      criteria: criterion ? [criterion] : [],
      A: readRun(slug, first, testCase.id, sample),
      B: readRun(slug, second, testCase.id, sample)
    }))
  });
  manifest.push({ id, slug, variantA, variantB, order, sample });
  console.log(`order${order}\t${pairFile}\t${verdictFile}`);
}

writeJson(manifestPath, manifest);
