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

// A child killed by a signal reports code null; treat that as a failure, not a clean exit.
for (const child of children) child.on("exit", (code, signal) => stop(code ?? (signal ? 1 : 0)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
