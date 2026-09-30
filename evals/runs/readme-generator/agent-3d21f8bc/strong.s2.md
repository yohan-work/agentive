```markdown
# agentkit-cli

A zero-config Node CLI that installs [Agent Archive](https://yohan-work.github.io/agentive/) install kits into your repo, many agents at a time, and merges them into your existing agent files safely.

## Why

Each project-ready agent in Agent Archive publishes 7 files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}
```

Today you copy one curl one-liner per agent. `agentkit` fetches kits for many agents in one command and wires them into `AGENTS.md` (Codex), `CLAUDE.md` (Claude Code), or `.cursor/rules/` (Cursor) without clobbering what you already have.

## Requirements

- Node.js >= 20.9
- macOS or Linux (tested in CI). Windows is not tested in CI yet — see [Limitations](#limitations).

## Getting started

Run it without installing:

```bash
npx agentkit-cli add pr-review-agent test-case-generator --target claude
```

This downloads both kits into `./agent-kits/<slug>/` and appends each agent's instructions to `CLAUDE.md`.

The examples below use the `agentkit` command name. With `npx`, replace `agentkit` with `npx agentkit-cli`.

## Commands

### `agentkit add <slug...>`

Download one or more kits into `./agent-kits/<slug>/` (all 7 files per kit).

```bash
agentkit add pr-review-agent test-case-generator
```

### `agentkit add <slug...> --target codex|claude|cursor`

Also install the instructions where your tool reads them:

| `--target` | What it writes |
| --- | --- |
| `codex` | Appends to `AGENTS.md` |
| `claude` | Appends to `CLAUDE.md` |
| `cursor` | Writes `.cursor/rules/<slug>.mdc` |

```bash
agentkit add pr-review-agent --target codex
agentkit add pr-review-agent --target claude
agentkit add pr-review-agent --target cursor
```

Appends are wrapped in markers:

```md
<!-- agentkit:pr-review-agent:start -->
...agent instructions...
<!-- agentkit:pr-review-agent:end -->
```

- **Re-running** `add` for the same slug updates the marked block in place; it does not add a duplicate.
- **Existing content** outside marked blocks is never overwritten.

### `agentkit remove <slug>`

Remove the slug's marked block and its `./agent-kits/<slug>/` folder.

```bash
agentkit remove pr-review-agent
```

### `agentkit list`

Show installed kits and the version from each kit's `agent.json`.

```bash
agentkit list
```

### `--dry-run`

Print the diff without writing anything.

```bash
agentkit add pr-review-agent --target claude --dry-run
```

### `--base-url`

Fetch kits from a self-hosted mirror of the archive instead of `https://yohan-work.github.io/agentive/`.

```bash
agentkit add pr-review-agent --base-url <your-mirror-url>
```

### Errors and exit codes

If any kit file returns 404 (for example, a mistyped slug), `agentkit` exits with a non-zero code, so scripts and CI fail loudly.

## Configuration

None. Everything is controlled by the flags above.

## Development

```bash
npm install
npm run build      # tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the CLI locally
```

Built with TypeScript, commander, undici fetch, vitest, and tsup.

## Limitations

- No Windows CI yet; CI covers macOS and Linux only.
- No offline cache: every run fetches from the network.
- No signature verification of downloaded files.

## Roadmap

Planned, not yet available:

- Windows CI
- `agentkit update` to refresh all installed kits
- Checksum verification using `agent.json`
- `--pack <starter-pack>` option

## Contributing

Issues and pull requests are welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli). Please run `npm run lint`, `npm run typecheck`, and `npm test` before opening a PR.

## License

MIT
```

---

**Notes for the author**

Assumptions:
- The installed binary is named `agentkit` (from your feature list) and `npx agentkit-cli` runs it. I left out a global install line (`npm install -g agentkit-cli`) because you didn't give one; add it if you want to recommend it.
- `--dry-run` and `--base-url` are shown with `add` only. If they also work with `remove` (or `list`), add an example for each.
- `--base-url` is assumed to replace the `https://yohan-work.github.io/agentive/` root (so `kits/<slug>/...` is appended). Confirm the expected format, e.g. whether a trailing slash matters.
- The Contributing checklist (lint, typecheck, test) is my suggestion based on your scripts.

To verify before publishing:
- **404 behavior:** When one slug in a multi-slug `add` 404s, are the other kits still written, or is nothing written? State which.
- **Cursor target:** `.cursor/rules/<slug>.mdc` is a whole file, not a marked block. What happens if that file already exists and wasn't created by agentkit? Given "never overwrites files outside marked blocks", does it refuse, skip, or overwrite? Also, does `remove` delete this file?
- **`remove`:** Does it clean blocks from `AGENTS.md` and `CLAUDE.md` both, or only the target used at install? What happens if the slug isn't installed (exit code)?
- **Missing target files:** Does `--target codex|claude` create `AGENTS.md` / `CLAUDE.md` if it doesn't exist?
- **Re-running `add` without `--target`:** Does it overwrite the files in `./agent-kits/<slug>/`? That seems likely, since the folder is agentkit-owned, but say so explicitly.
- Confirm the package is actually published on npm as `agentkit-cli` at v0.3.0 before the `npx` line goes live.
- Add a `LICENSE` file if the repo doesn't have one yet.
