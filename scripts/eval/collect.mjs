// Files blind verdicts under evals/verdicts/ once judges have written them.
//
//   node scripts/eval/collect.mjs
//
// Reads .eval-work/judge-manifest.json (written by pairs.mjs), copies each finished
// <id>.verdict.json to evals/verdicts/<slug>/<variantA>__vs__<variantB>/order<N>.json, and drops it
// from the manifest. Pending entries stay for a later run.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verdictDir, workDir, writeJson } from "./lib.mjs";

const judgeDir = join(workDir, "judge");
// Kept outside judgeDir so a judge browsing its own folder cannot find the variant mapping.
const manifestPath = join(workDir, "judge-manifest.json");
if (!existsSync(manifestPath)) {
  console.error("Nothing to collect: run scripts/eval/pairs.mjs first.");
  process.exit(1);
}

const pending = [];
for (const entry of JSON.parse(readFileSync(manifestPath, "utf8"))) {
  const verdictFile = join(judgeDir, `${entry.id}.verdict.json`);
  if (!existsSync(verdictFile)) {
    pending.push(entry);
    continue;
  }
  const target = join(verdictDir(entry.slug, entry.variantA, entry.variantB), `order${entry.order}.json`);
  writeJson(target, JSON.parse(readFileSync(verdictFile, "utf8")));
  console.log(`collected\t${target}`);
}

writeJson(manifestPath, pending);
if (pending.length) console.log(`pending\t${pending.length}`);
