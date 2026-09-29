// Builds blind pairwise judge files for two variants of one agent, in both orders.
//
//   node scripts/eval/pairs.mjs <slug> <variantA> <variantB>
//
// order1 shows variantA as "A"; order2 swaps them. Judges only see "A" and "B", the request, and the
// agent's task-specific criterion (never the prompt's own formatting rules, which would make the
// comparison circular). Prints the pair file and verdict path for each order.
import { join } from "node:path";
import { readAgent, readCases, readRun, verdictDir, workDir, writeJson } from "./lib.mjs";

const [slug, variantA, variantB] = process.argv.slice(2);
if (!slug || !variantA || !variantB) {
  console.error("Usage: node scripts/eval/pairs.mjs <slug> <variantA> <variantB>");
  process.exit(1);
}

const criterion = readAgent(slug).evaluation?.evaluationCriteria?.[0];
const cases = readCases(slug);

for (const order of [1, 2]) {
  const [first, second] = order === 1 ? [variantA, variantB] : [variantB, variantA];
  const pairFile = join(workDir, slug, "pairs", `${variantA}__vs__${variantB}`, `order${order}.json`);
  writeJson(pairFile, {
    cases: cases.map((testCase) => ({
      id: testCase.id,
      input: testCase.input.trim(),
      criteria: criterion ? [criterion] : [],
      A: readRun(slug, first, testCase.id),
      B: readRun(slug, second, testCase.id)
    }))
  });
  console.log(`order${order}\t${pairFile}\t${join(verdictDir(slug, variantA, variantB), `order${order}.json`)}`);
}
