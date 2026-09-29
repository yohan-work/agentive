// Tallies pairwise verdicts for two variants across both orders.
//
//   node scripts/eval/aggregate.mjs <slug> <variantA> <variantB>
//
// A case counts for a variant only when both orders agree; disagreements are reported as
// "inconsistent" (usually position bias) and not credited to either side.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readCases, resolveWinner, verdictDir, writeJson } from "./lib.mjs";

const [slug, variantA, variantB] = process.argv.slice(2);
if (!slug || !variantA || !variantB) {
  console.error("Usage: node scripts/eval/aggregate.mjs <slug> <variantA> <variantB>");
  process.exit(1);
}

const dir = verdictDir(slug, variantA, variantB);
const orders = [1, 2].map((order) => {
  const path = join(dir, `order${order}.json`);
  if (!existsSync(path)) throw new Error(`Missing verdict: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")).cases;
});

const cases = readCases(slug).map((testCase) => {
  const [order1, order2] = orders.map((verdicts, index) => {
    const verdict = verdicts.find((candidate) => candidate.id === testCase.id);
    if (!verdict) throw new Error(`No verdict for case ${testCase.id} in order${index + 1}`);
    // Throws on anything other than "A", "B", or "tie" so a malformed verdict is never credited.
    return resolveWinner(index + 1, verdict.winner, variantA, variantB);
  });
  return { id: testCase.id, order1, order2, result: order1 === order2 ? order1 : "inconsistent" };
});

const count = (value) => cases.filter((testCase) => testCase.result === value).length;
const summary = {
  slug,
  variants: [variantA, variantB],
  cases,
  wins: { [variantA]: count(variantA), [variantB]: count(variantB) },
  ties: count("tie"),
  inconsistent: count("inconsistent")
};

writeJson(join(dir, "summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
