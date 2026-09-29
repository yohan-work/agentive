import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- plain ESM script without type declarations
import { parseArgs, promptHash, resolveWinner, variantFor } from "../scripts/eval/lib.mjs";

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
});

describe("parseArgs", () => {
  it("reads valued flags, bare flags, and positionals", () => {
    assert.deepEqual(parseArgs(["pr-review-agent", "--model", "m1", "--baseline"]), {
      flags: { model: "m1", baseline: true },
      positional: ["pr-review-agent"]
    });
    assert.deepEqual(parseArgs(["--baseline", "--model", "m1", "slug"]).flags, { baseline: true, model: "m1" });
  });
});
