// Shared loader for content/agents: used by build-content.mjs and check-data.mjs so both see the same files.
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import Ajv from "ajv";
import { parse } from "yaml";

export const contentDir = "content/agents";

/**
 * Reads every agent file and validates it against schema/agent.schema.json.
 * Files starting with "_" (like _template.yaml) are skipped.
 * Returns the valid agents sorted by id, plus a list of human-readable failures.
 */
export function loadAgentContent(root = process.cwd()) {
  const failures = [];
  const schema = JSON.parse(readFileSync(join(root, "schema/agent.schema.json"), "utf8"));
  const validate = new Ajv({ allErrors: true }).compile(schema);
  const files = readdirSync(join(root, contentDir)).filter((file) => !file.startsWith("_") && !file.startsWith("."));

  const agents = files.flatMap((file) => {
    const path = `${contentDir}/${file}`;
    if (!file.endsWith(".yaml")) {
      failures.push(`${path}: agent files must use the .yaml extension`);
      return [];
    }

    let agent;
    try {
      agent = parse(readFileSync(join(root, path), "utf8"));
    } catch (error) {
      failures.push(`${path}: invalid YAML (${error.message.split("\n")[0]})`);
      return [];
    }

    if (agent === null || typeof agent !== "object" || Array.isArray(agent)) {
      failures.push(`${path}: file must contain a single agent object`);
      return [];
    }

    if (!validate(agent)) {
      for (const error of validate.errors ?? []) {
        const extra = error.params?.additionalProperty ? ` (${error.params.additionalProperty})` : "";
        failures.push(`${path}: ${error.instancePath || "/"} ${error.message}${extra}`);
      }
      return [];
    }

    if (agent.slug !== basename(file, ".yaml")) {
      failures.push(`${path}: slug "${agent.slug}" must match the file name`);
    }

    return [agent];
  });

  agents.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return { agents, failures };
}
