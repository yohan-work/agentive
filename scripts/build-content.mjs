// Bundles content/agents/*.yaml into src/data/generated/agents.json for the app.
// Runs automatically before dev, build, and typecheck. Validation lives in check-data.mjs.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const root = process.cwd();
const contentDir = join(root, "content/agents");
const outputDir = join(root, "src/data/generated");

const agents = readdirSync(contentDir)
  .filter((file) => file.endsWith(".yaml"))
  .map((file) => {
    try {
      return parse(readFileSync(join(contentDir, file), "utf8"));
    } catch (error) {
      console.error(`Failed to parse content/agents/${file}: ${error.message}`);
      process.exit(1);
    }
  })
  .sort((a, b) => String(a.id).localeCompare(String(b.id), "en", { numeric: true }));

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, "agents.json"), `${JSON.stringify(agents, null, 2)}\n`);
console.log(`Bundled ${agents.length} agents into src/data/generated/agents.json`);
