// Writes an evaluated variant into content/agents/<slug>.yaml: its prompt, recorded runs, review, and
// blind comparison results.
//
//   node scripts/eval/apply.mjs <slug> <variant> --judge <judge model id> --date <YYYY-MM-DD> [--previous <variant>]
//
// Needs evals/runs/<slug>/<variant>/ (one output per case plus meta.json) and a review at
// evals/reviews/<slug>/<variant>.json (see evals/prompts/reviewer.md). Every comparison summary under
// evals/verdicts/<slug>/<variant>__vs__*/ is quoted in the run notes, so readers see how the prompt did
// against the baseline and the previous prompt. The agent is set to "community": runs and grading are
// by models, not yet reviewed by a maintainer.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { BASELINE, evalsDir, listDirs, parseArgs, readCases, readRun, root, variantFor } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [slug, variant] = positional;
if (!slug || !variant || !flags.judge || !/^\d{4}-\d{2}-\d{2}$/.test(flags.date ?? "")) {
  console.error("Usage: node scripts/eval/apply.mjs <slug> <variant> --judge <model id> --date <YYYY-MM-DD>");
  process.exit(1);
}

const readJson = (path) => {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
};

const meta = readJson(join(evalsDir, "runs", slug, variant, "meta.json"));
if (!meta.systemPrompt) throw new Error(`${variant} has no system prompt; only agent variants can be applied`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.preparedAt ?? "")) throw new Error(`${variant} meta.preparedAt must be YYYY-MM-DD`);
const review = readJson(join(evalsDir, "reviews", slug, `${variant}.json`));
const cases = readCases(slug);

const file = join(root, "content/agents", `${slug}.yaml`);
const doc = parseDocument(readFileSync(file, "utf8"));
// The prompt this variant replaces: the one in the YAML now, unless this variant is already applied
// (re-running apply), in which case pass --previous explicitly.
const currentVariant = variantFor(doc.get("prompt"));
const previousVariant = flags.previous ?? (currentVariant === variant ? null : currentVariant);

function describe(other) {
  if (other === BASELINE) return "the same model with no system prompt";
  return other === previousVariant ? `the previous prompt (${other})` : `another candidate prompt (${other})`;
}

const verdictsRoot = join(evalsDir, "verdicts", slug);
const comparisons = listDirs(verdictsRoot)
  // Comparisons can be filed in either direction; include both so no result is left out.
  .filter((dir) => dir.startsWith(`${variant}__vs__`) || dir.endsWith(`__vs__${variant}`))
  .map((dir) => {
    const summary = readJson(join(verdictsRoot, dir, "summary.json"));
    const other = summary.variants.find((candidate) => candidate !== variant);
    const samples = summary.samples?.length ?? 1;
    const scope = samples > 1 ? `case runs (${summary.byCase.length} cases × ${samples} samples)` : "cases";
    return `Blind pairwise comparison against ${describe(other)} (judged in both orders by ${flags.judge}; a case run counts only when both orders agree): won ${summary.wins[variant]} of ${summary.cases.length} ${scope}, lost ${summary.wins[other]}, ${summary.ties} tied, ${summary.inconsistent} order-inconsistent.`;
  });

const runNote = `Real run on ${meta.preparedAt}: ${meta.generator} with the agent prompt as instructions and this input, single turn, no tools. Graded by a separate model reviewer against the evaluation criteria; not yet reviewed by a human maintainer.`;

const [first] = cases;

doc.set("prompt", meta.systemPrompt);
doc.set("exampleInput", first.input.trim());
doc.set("exampleOutput", readRun(slug, variant, first.id));
doc.setIn(["evaluation", "qualityScore"], review.qualityScore);
doc.setIn(["evaluation", "testedWith"], ["claude"]);
doc.setIn(["evaluation", "knownWeaknesses"], review.knownWeaknesses);
doc.setIn(
  ["evaluation", "sampleRuns"],
  cases.map((testCase) => {
    const graded = review.cases.find((candidate) => candidate.id === testCase.id);
    if (!graded) throw new Error(`Review has no entry for case ${testCase.id}`);
    return {
      title: testCase.title,
      input: testCase.input.trim(),
      expectedOutputSummary: graded.expectedOutputSummary,
      sampleOutput: readRun(slug, variant, testCase.id),
      reviewNotes: [runNote, ...comparisons, ...graded.reviewNotes]
    };
  })
);
doc.set("verifiedStatus", "community");
doc.set("updatedAt", flags.date);

writeFileSync(file, doc.toString({ lineWidth: 0 }));
console.log(`${slug}: applied ${variant} (quality ${review.qualityScore}, ${comparisons.length} comparisons)`);
