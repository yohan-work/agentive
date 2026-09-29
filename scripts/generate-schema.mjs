// Generates schema/agent.schema.json from the AgentSource type in src/types/agent.ts.
// Editors use it for autocomplete in content/agents/*.yaml; check-data.mjs uses it for validation.
import { mkdirSync, writeFileSync } from "node:fs";
import { createGenerator } from "ts-json-schema-generator";

const schema = createGenerator({
  path: "src/types/agent.ts",
  tsconfig: "tsconfig.json",
  type: "AgentSource",
  expose: "none",
  topRef: false,
  additionalProperties: false,
  skipTypeCheck: true
}).createSchema("AgentSource");

// Spread the generated definition after the header fields so $schema, $id, and title come first.
const output = {
  $id: "https://github.com/yohan-work/agentive/blob/main/schema/agent.schema.json",
  title: "Agent Archive agent",
  ...schema,
  $schema: "http://json-schema.org/draft-07/schema#"
};

mkdirSync("schema", { recursive: true });
writeFileSync("schema/agent.schema.json", `${JSON.stringify(output, null, 2)}\n`);
console.log("Wrote schema/agent.schema.json");
