// Writes one runner input file per case for a variant, and records the variant's run conditions.
//
//   node scripts/eval/prepare.mjs <slug> --model <generator model id> [--prompt <file> | --baseline]
//
// Default variant: the agent's current prompt. --prompt tries a candidate prompt from a file;
// --baseline sends the input with no system prompt. Prints the variant id and the files to run.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASELINE,
  evalsDir,
  parseArgs,
  promptHash,
  readAgent,
  readCases,
  runPath,
  variantFor,
  workDir,
  writeFile,
  writeJson
} from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2), ["baseline"]);
const [slug] = positional;
const baseline = flags.baseline === true;
if (!slug || !flags.model) {
  console.error("Usage: node scripts/eval/prepare.mjs <slug> --model <id> [--prompt <file> | --baseline]");
  process.exit(1);
}

const prompt = baseline ? null : (flags.prompt ? readFileSync(flags.prompt, "utf8") : readAgent(slug).prompt).trim();
const variant = baseline ? BASELINE : variantFor(prompt);

// Keep the conditions of runs that already exist; a variant is only ever described once.
const metaPath = join(evalsDir, "runs", slug, variant, "meta.json");
if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  if (meta.generator !== flags.model) {
    console.error(`${variant} was run with ${meta.generator}; use the same model or start a new variant.`);
    process.exit(1);
  }
} else {
  writeJson(metaPath, {
    variant,
    systemPrompt: prompt,
    promptSha256: prompt ? promptHash(prompt) : null,
    generator: flags.model,
    preparedAt: new Date().toISOString().slice(0, 10)
  });
}

for (const testCase of readCases(slug)) {
  const input = join(workDir, slug, variant, `${testCase.id}.txt`);
  writeFile(
    input,
    prompt
      ? `=== SYSTEM PROMPT ===\n${prompt}\n\n=== USER MESSAGE ===\n${testCase.input.trim()}\n`
      : `=== USER MESSAGE ===\n${testCase.input.trim()}\n`
  );
  console.log(`${variant}\t${testCase.id}\t${input}\t${runPath(slug, variant, testCase.id)}`);
}
