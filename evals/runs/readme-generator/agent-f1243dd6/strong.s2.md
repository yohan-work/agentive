# agentkit-cli

A zero-config Node CLI that installs [Agent Archive](https://yohan-work.github.io/agentive/) install kits into your repo — many agents at once, merged safely into your existing agent instruction files.

Each project-ready agent in the archive publishes seven files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}
```

Instead of one `curl` one-liner per agent, `agentkit` fetches kits in bulk and wires them into Codex, Claude Code, or Cursor.

## Getting started

Requires Node >= 20.9.

```bash
# Run without installing
npx agentkit-cli add pr-review-agent test-case-generator --target claude

# Or install globally
npm install -g agentkit-cli
agentkit add pr-review-agent
```

This downloads each kit into `./agent-kits/<slug>/` and, with `--target claude`, appends the agent instructions to `CLAUDE.md`.

## Usage

| Command | What it does |
| --- | --- |
| `agentkit add <slug...>` | Download kits into `./agent-kits/<slug>/` |
| `agentkit add <slug> --target codex` | Also append instructions to `AGENTS.md` |
| `agentkit add <slug> --target claude` | Also append instructions to `CLAUDE.md` |
| `agentkit add <slug> --target cursor` | Also write `.cursor/rules/<slug>.mdc` |
| `agentkit remove <slug>` | Remove the kit folder and its marked block |
| `agentkit list` | Show installed kits and their `agent.json` version |

**Options**

- `--dry-run` — print the diff without writing anything.
- `--base-url <url>` — use a self-hosted mirror of the archive instead of the default.

### How merging works

Appended content is wrapped in markers:

```md
<!-- agentkit:pr-review-agent:start -->
...kit instructions...
<!-- agentkit:pr-review-agent:end -->
```

- Re-running `add` updates the block in place; it never duplicates it.
- `remove` deletes only the marked block.
- Content outside marked blocks is never overwritten.
- If any kit file returns 404, the command exits non-zero.

Tip: run with `--dry-run` first on a repo with hand-written `AGENTS.md` / `CLAUDE.md`.

## Development

```bash
npm install
npm run build      # tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the CLI locally as `agentkit`
```

Stack: TypeScript, commander (args), undici fetch, vitest, tsup.

## Known limitations

- **No Windows CI yet.** CI covers macOS and Linux only; Windows paths and line endings are untested.
- **No offline cache.** Every run fetches from the network.
- **No signature or checksum verification.** Downloaded files are trusted as served — review kits (and use `--dry-run`) before committing them, especially from a mirror set via `--base-url`.

## Roadmap

- [ ] Windows CI
- [ ] `agentkit update` to refresh all installed kits
- [ ] Checksum verification using `agent.json`
- [ ] `--pack <starter-pack>` to install a starter pack in one command

## Contributing

Issues and PRs are welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli). Please run `npm run lint`, `npm run typecheck`, and `npm test` before opening a PR.

## License

[MIT](./LICENSE)

---

**Assumptions made in this README** (adjust if wrong):

- The npm package exposes a bin named `agentkit` (so `npm install -g agentkit-cli` gives you `agentkit ...`), while `npx agentkit-cli ...` works without installing.
- `--target` accepts a single value per run; if it accepts multiple (e.g. `--target claude,cursor`), update the Usage table.
- `--dry-run` and `--base-url` apply to `add` and `remove`.
- A `LICENSE` file exists at the repo root.
