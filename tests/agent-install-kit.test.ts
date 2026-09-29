import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agents } from "@/data/agents";
import {
  getInstallKitCommand,
  getInstallKitFiles,
  getInstallKitPath,
  getInstallKitUrl,
  isInstallable
} from "@/lib/agent-install-kit";
import { siteConfig } from "@/lib/site";

const KIT_NAMES = ["AGENTS.md", "CLAUDE.md", "cursor-rule.mdc", "agent.json", "README.md", "RUNBOOK.md", "EVALUATION.md"];

const installable = agents.filter(isInstallable);
const notInstallable = agents.filter((agent) => !isInstallable(agent));

describe("install kit files", () => {
  it("has both installable and non-installable agents to test against", () => {
    assert.ok(installable.length > 0);
    assert.ok(notInstallable.length > 0);
  });

  it("returns no files for agents without install targets", () => {
    for (const agent of notInstallable) {
      assert.deepEqual(getInstallKitFiles(agent), [], agent.slug);
    }
  });

  it("returns the same seven files, in order, for every installable agent", () => {
    for (const agent of installable) {
      const files = getInstallKitFiles(agent);
      assert.deepEqual(
        files.map((file) => file.name),
        KIT_NAMES,
        agent.slug
      );
      for (const file of files) {
        assert.equal(file.filename, `${agent.slug}-${file.name}`);
        assert.ok(file.content.trim().length > 0, `${agent.slug}/${file.name} is empty`);
      }
    }
  });

  it("emits agent.json as valid JSON with a JSON mime type", () => {
    for (const agent of installable) {
      const manifest = getInstallKitFiles(agent).find((file) => file.name === "agent.json");
      assert.ok(manifest);
      assert.match(manifest.mimeType, /^application\/json/);
      assert.doesNotThrow(() => JSON.parse(manifest.content), agent.slug);
    }
  });
});

describe("install kit URLs", () => {
  const slug = "pr-review-agent";

  it("serves kit files under /kits/<slug>/<file> on the site URL", () => {
    assert.equal(getInstallKitPath(slug, "AGENTS.md"), `/kits/${slug}/AGENTS.md`);
    assert.equal(getInstallKitUrl(slug, "AGENTS.md"), `${siteConfig.url}/kits/${slug}/AGENTS.md`);
  });

  it("builds a curl command that fetches every kit file into agent-kits/<slug>/", () => {
    const command = getInstallKitCommand(slug);
    assert.ok(command.startsWith(`mkdir -p agent-kits/${slug} && (cd agent-kits/${slug} && curl `));
    assert.ok(command.includes(getInstallKitUrl(slug, `{${KIT_NAMES.join(",")}}`)));
    assert.ok(command.includes("--remote-name-all"));
    // --output-dir needs curl 7.73+, which older LTS distros don't ship.
    assert.ok(!command.includes("--output-dir"));
  });

  it("lists the install command and every file URL in the kit README", () => {
    const agent = installable[0];
    const readme = getInstallKitFiles(agent).find((file) => file.name === "README.md");
    assert.ok(readme);
    assert.ok(readme.content.includes(getInstallKitCommand(agent.slug)));
    for (const name of KIT_NAMES) {
      assert.ok(readme.content.includes(getInstallKitUrl(agent.slug, name)), name);
    }
  });
});
