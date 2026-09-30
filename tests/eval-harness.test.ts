import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- plain ESM script without type declarations
import { localDate, parseArgs, parseSample, promptHash, resolveWinner, runPath, sampleSuffix, variantFor } from "../scripts/eval/lib.mjs";

describe("eval variants", () => {
  it("derives a stable id from the prompt text, ignoring surrounding whitespace", () => {
    assert.equal(variantFor("Be concise."), variantFor("  Be concise.\n"));
    assert.equal(variantFor("Be concise."), `agent-${promptHash("Be concise.").slice(0, 8)}`);
    assert.notEqual(variantFor("Be concise."), variantFor("Be brief."));
  });
});

describe("resolveWinner", () => {
  it("maps A/B back to variants in both orders", () => {
    assert.equal(resolveWinner(1, "A", "new", "none"), "new");
    assert.equal(resolveWinner(1, "B", "new", "none"), "none");
    assert.equal(resolveWinner(2, "A", "new", "none"), "none");
    assert.equal(resolveWinner(2, "B", "new", "none"), "new");
    assert.equal(resolveWinner(2, "tie", "new", "none"), "tie");
  });

  it("rejects anything other than A, B, or tie", () => {
    for (const verdict of ["a", "Tie", "A (slight)", undefined]) {
      assert.throws(() => resolveWinner(1, verdict, "new", "none"), /Invalid verdict/);
    }
  });
});

describe("parseArgs", () => {
  it("reads valued flags, boolean flags, and positionals in any order", () => {
    assert.deepEqual(parseArgs(["pr-review-agent", "--model", "m1", "--baseline"], ["baseline"]), {
      flags: { model: "m1", baseline: true },
      positional: ["pr-review-agent"]
    });
    // A boolean flag must not swallow the positional after it.
    assert.deepEqual(parseArgs(["--baseline", "pr-review-agent", "--model", "m1"], ["baseline"]), {
      flags: { baseline: true, model: "m1" },
      positional: ["pr-review-agent"]
    });
  });

  it("rejects a valued flag with no value", () => {
    assert.throws(() => parseArgs(["slug", "--model", "--baseline"], ["baseline"]), /--model needs a value/);
    assert.throws(() => parseArgs(["slug", "--prompt"]), /--prompt needs a value/);
  });
});

describe("localDate", () => {
  it("formats the local calendar date as YYYY-MM-DD", () => {
    assert.equal(localDate(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    assert.equal(localDate(new Date(2026, 8, 30, 0, 1)), "2026-09-30");
  });
});

describe("samples", () => {
  it("keeps plain file names for the first sample and suffixes later ones", () => {
    assert.equal(sampleSuffix(1), "");
    assert.equal(sampleSuffix(2), ".s2");
    assert.ok(runPath("slug", "none", "strong").endsWith("/none/strong.md"));
    assert.ok(runPath("slug", "none", "strong", 3).endsWith("/none/strong.s3.md"));
  });

  it("accepts only positive integer sample numbers", () => {
    assert.equal(parseSample(undefined), 1);
    assert.equal(parseSample("2"), 2);
    for (const value of ["0", "-1", "1.5", "two"]) assert.throws(() => parseSample(value), /positive integer/);
  });
});
