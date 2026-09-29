import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agents } from "@/data/agents";
import { toAgentMarkdown, toChatPromptBundle } from "@/lib/agent-export";
import { getInstallKitFiles } from "@/lib/agent-install-kit";
import { fenced } from "@/lib/utils";

const evaluated = agents.filter((agent) => agent.evaluation?.sampleRuns.length);

describe("fenced", () => {
  it("uses a fence longer than any backtick run in the text", () => {
    const text = "before\n```ts\nconst a = 1;\n```\nafter ````` end";
    const block = fenced(text);
    assert.ok(block.startsWith("``````\n"));
    assert.ok(block.endsWith("\n``````"));
    assert.equal(block.slice(7, -7), text);
  });

  it("uses a plain triple fence when the text has no backticks", () => {
    assert.equal(fenced("plain", "markdown"), "```markdown\nplain\n```");
  });
});

describe("agent markdown export", () => {
  it("has evaluated agents to test against", () => {
    assert.ok(evaluated.length > 0);
  });

  it("keeps recorded outputs inside fences so their headings stay out of the document outline", () => {
    for (const agent of evaluated) {
      const markdown = toAgentMarkdown(agent);
      for (const sample of agent.evaluation!.sampleRuns) {
        assert.ok(markdown.includes(fenced(sample.sampleOutput, "markdown")), `${agent.slug}: ${sample.title}`);
      }
    }
  });

  it("leaves recorded runs out of the chat bundle", () => {
    for (const agent of evaluated) {
      const bundle = toChatPromptBundle(agent);
      assert.ok(bundle.includes(agent.prompt), agent.slug);
      for (const sample of agent.evaluation!.sampleRuns) {
        assert.ok(!bundle.includes(sample.sampleOutput), `${agent.slug}: ${sample.title}`);
      }
    }
  });
});

describe("EVALUATION.md", () => {
  it("fences each sample run's input and output", () => {
    for (const agent of evaluated.filter((candidate) => candidate.installTargets?.length)) {
      const evaluation = getInstallKitFiles(agent).find((file) => file.name === "EVALUATION.md");
      assert.ok(evaluation);
      for (const sample of agent.evaluation!.sampleRuns) {
        assert.ok(evaluation.content.includes(fenced(sample.input)), `${agent.slug}: input`);
        assert.ok(evaluation.content.includes(fenced(sample.sampleOutput, "markdown")), `${agent.slug}: output`);
      }
    }
  });
});
