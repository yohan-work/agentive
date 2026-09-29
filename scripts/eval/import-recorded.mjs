// One-off bootstrap: turns the sample runs already recorded in content/agents/*.yaml into eval cases
// and runs, so later comparisons can reuse them instead of re-running.
//
//   node scripts/eval/import-recorded.mjs [slug...]
//
// Case ids follow the recorded order (first run "strong", second "boundary"). Existing case files are
// left alone; the recorded outputs are filed under the variant of the agent's current prompt.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { evalsDir, promptHash, readAgent, root, runPath, variantFor, writeFile, writeJson } from "./lib.mjs";

const CASE_IDS = ["strong", "boundary"];
const requested = process.argv.slice(2);
const slugs = requested.length
  ? requested
  : readdirSync(join(root, "content/agents"))
      .filter((file) => file.endsWith(".yaml") && !file.startsWith("_"))
      .map((file) => file.replace(/\.yaml$/, ""));

for (const slug of slugs) {
  const agent = readAgent(slug);
  const runs = agent.evaluation?.sampleRuns ?? [];
  // Only real runs carry the run-conditions note; templated placeholders are skipped.
  if (runs.length < 2 || !runs.every((run) => run.reviewNotes?.[0]?.startsWith("Real run on "))) continue;

  const variant = variantFor(agent.prompt);
  // Never overwrite evidence: a variant that already has runs was imported or run before.
  if (existsSync(join(evalsDir, "runs", slug, variant, "meta.json"))) {
    console.log(`${slug}\t${variant}\tskipped (already recorded)`);
    continue;
  }

  const recorded = runs.slice(0, CASE_IDS.length).map((run, index) => ({ id: CASE_IDS[index], title: run.title, input: run.input }));
  const casesPath = join(evalsDir, "cases", `${slug}.json`);
  if (existsSync(casesPath)) {
    // Outputs are only filed against cases whose input is exactly what was run.
    const cases = JSON.parse(readFileSync(casesPath, "utf8")).cases;
    const mismatch = recorded.find((run) => cases.find((testCase) => testCase.id === run.id)?.input.trim() !== run.input.trim());
    if (mismatch) {
      console.log(`${slug}\t${variant}\tskipped (case "${mismatch.id}" differs from the recorded input)`);
      continue;
    }
  } else {
    writeJson(casesPath, { slug, cases: recorded });
  }

  const date = runs[0].reviewNotes[0].match(/^Real run on (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  writeJson(join(evalsDir, "runs", slug, variant, "meta.json"), {
    variant,
    systemPrompt: agent.prompt.trim(),
    promptSha256: promptHash(agent.prompt),
    generator: "claude-opus-5-5",
    preparedAt: date,
    source: "Imported from the recorded sampleRuns in content/agents"
  });
  runs.slice(0, CASE_IDS.length).forEach((run, index) => writeFile(runPath(slug, variant, CASE_IDS[index]), `${run.sampleOutput.trim()}\n`));
  console.log(`${slug}\t${variant}`);
}
