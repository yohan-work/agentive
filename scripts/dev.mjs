// Runs the content watcher alongside `next dev` so edits in content/agents hot-reload.
import { spawn } from "node:child_process";

const shell = process.platform === "win32";
const children = [
  spawn("node", ["scripts/build-content.mjs", "--watch"], { stdio: "inherit", shell }),
  spawn("next", ["dev", ...process.argv.slice(2)], { stdio: "inherit", shell })
];

function stop(code = 0) {
  for (const child of children) child.kill();
  process.exit(code);
}

for (const child of children) child.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
