// Shared helpers for the agent evaluation harness. See evals/README.md for the protocol.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";

export const root = process.cwd();
export const evalsDir = join(root, "evals");
/** Scratch files handed to runner/judge sessions. Gitignored; everything worth keeping lands in evals/. */
export const workDir = join(root, ".eval-work");

/** The baseline variant: the same input with no system prompt. */
export const BASELINE = "none";

export function readAgent(slug) {
  const path = join(root, "content/agents", `${slug}.yaml`);
  if (!existsSync(path)) throw new Error(`Unknown agent: ${slug}`);
  return parse(readFileSync(path, "utf8"));
}

export function promptHash(prompt) {
  return createHash("sha256").update(prompt.trim()).digest("hex");
}

/** Variant id for a system prompt: "agent-" plus the first 8 hex chars of its SHA-256. */
export function variantFor(prompt) {
  return `agent-${promptHash(prompt).slice(0, 8)}`;
}

export function readCases(slug) {
  const path = join(evalsDir, "cases", `${slug}.json`);
  if (!existsSync(path)) throw new Error(`No cases for ${slug}: expected ${path}`);
  return JSON.parse(readFileSync(path, "utf8")).cases;
}

export function runPath(slug, variant, caseId) {
  return join(evalsDir, "runs", slug, variant, `${caseId}.md`);
}

export function readRun(slug, variant, caseId) {
  const path = runPath(slug, variant, caseId);
  if (!existsSync(path)) throw new Error(`Missing run: ${path}`);
  return readFileSync(path, "utf8").trim();
}

export function verdictDir(slug, variantA, variantB) {
  return join(evalsDir, "verdicts", slug, `${variantA}__vs__${variantB}`);
}

export function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export function writeJson(path, value) {
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function listDirs(path) {
  return existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];
}

/** Maps a judge's "A" / "B" / "tie" back to a variant id. order1 shows variantA as A; order2 swaps them. */
export function resolveWinner(order, verdict, variantA, variantB) {
  if (!["A", "B", "tie"].includes(verdict)) throw new Error(`Invalid verdict "${verdict}": expected "A", "B", or "tie"`);
  if (verdict === "tie") return "tie";
  const [first, second] = order === 1 ? [variantA, variantB] : [variantB, variantA];
  return verdict === "A" ? first : second;
}

/**
 * Minimal flag parser. Flags listed in `booleans` never take a value; every other flag requires one.
 * Positional args are returned in order.
 */
export function parseArgs(argv, booleans = []) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const name = argv[i].slice(2);
      if (booleans.includes(name)) {
        flags[name] = true;
        continue;
      }
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value`);
      flags[name] = value;
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  return { flags, positional };
}
