// Tallies pairwise verdicts for two variants across both orders and every judged sample.
//
//   node scripts/eval/aggregate.mjs <slug> <variantA> <variantB>
//
// A case run counts for a variant only when both orders agree; disagreements are reported as
// "inconsistent" (usually position bias) and not credited to either side. With several samples, each
// case is judged once per sample, and `byCase` shows whether the samples agreed.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readCases, resolveWinner, verdictDir, verdictPath, writeJson } from "./lib.mjs";

const [slug, variantA, variantB] = process.argv.slice(2);
if (!slug || !variantA || !variantB) {
  console.error("Usage: node scripts/eval/aggregate.mjs <slug> <variantA> <variantB>");
  process.exit(1);
}

const dir = verdictDir(slug, variantA, variantB);
if (!existsSync(dir)) throw new Error(`No verdicts in ${dir}`);
const samples = readdirSync(dir)
  .map((file) => file.match(/^order1(?:\.s(\d+))?\.json$/))
  .filter(Boolean)
  .map((match) => (match[1] ? Number(match[1]) : 1))
  .sort((a, b) => a - b);

function readOrder(order, sample) {
  const path = verdictPath(slug, variantA, variantB, order, sample);
  if (!existsSync(path)) throw new Error(`Missing verdict: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")).cases;
}

const testCases = readCases(slug);
const runs = samples.flatMap((sample) => {
  const orders = [1, 2].map((order) => readOrder(order, sample));
  return testCases.map((testCase) => {
    const [order1, order2] = orders.map((verdicts, index) => {
      const verdict = verdicts.find((candidate) => candidate.id === testCase.id);
      if (!verdict) throw new Error(`No verdict for case ${testCase.id} in order${index + 1}, sample ${sample}`);
      // Throws on anything other than "A", "B", or "tie" so a malformed verdict is never credited.
      return resolveWinner(index + 1, verdict.winner, variantA, variantB);
    });
    return { id: testCase.id, sample, order1, order2, result: order1 === order2 ? order1 : "inconsistent" };
  });
});

const count = (value) => runs.filter((run) => run.result === value).length;
const summary = {
  slug,
  variants: [variantA, variantB],
  samples,
  cases: runs,
  byCase: testCases.map((testCase) => {
    const results = runs.filter((run) => run.id === testCase.id).map((run) => run.result);
    return { id: testCase.id, results, samplesAgree: results.every((result) => result === results[0]) };
  }),
  wins: { [variantA]: count(variantA), [variantB]: count(variantB) },
  ties: count("tie"),
  inconsistent: count("inconsistent")
};

writeJson(join(dir, "summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
