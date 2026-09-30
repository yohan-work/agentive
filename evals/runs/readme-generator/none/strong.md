# agentkit-cli

A zero-config Node CLI that installs agent "install kits" from [Agent Archive](https://yohan-work.github.io/agentive/) into your repo.

Every project-ready agent in the archive publishes seven files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/
  AGENTS.md  CLAUDE.md  cursor-rule.mdc  agent.json  README.md  RUNBOOK.md  EVALUATION.md
```

Instead of copying a `curl` one-liner per agent, `agentkit` fetches kits for many agents at once and merges their instructions into your existing `AGENTS.md`, `CLAUDE.md`, or Cursor rules without touching anything else in those files.

Built for developers using **Codex**, **Claude Code**, or **Cursor**.

## Getting started

Requires Node.js >= 20.9.

Run it without installing:

```bash
npx agentkit-cli add pr-review-agent test-case-generator --target claude
```

Or install it globally and use the `agentkit` command:

```bash
npm install -g agentkit-cli
agentkit add pr-review-agent
```

This downloads the kit into `./agent-kits/pr-review-agent/`. Add `--target` to also wire the instructions into your tool of choice.

## Usage

```bash
agentkit add <slug...>                        # download kits into ./agent-kits/<slug>/
agentkit add <slug...> --target codex         # ...and append instructions to AGENTS.md
agentkit add <slug...> --target claude        # ...and append instructions to CLAUDE.md
agentkit add <slug...> --target cursor        # ...and write .cursor/rules/<slug>.mdc
agentkit remove <slug>                        # remove the kit folder and its marked block
agentkit list                                 # show installed kits and their agent.json version
```

Options:

| Option | Description |
| --- | --- |
| `--target codex\|claude\|cursor` | Where to install the agent's instructions (with `add`). |
| `--dry-run` | Print the diff without writing any files. |
| `--base-url <url>` | Fetch kits from a self-hosted mirror of the archive instead of the default. |

### How merging works

When appending to `AGENTS.md` or `CLAUDE.md`, each agent's instructions are wrapped in markers:

```md
<!-- agentkit:pr-review-agent:start -->
...kit instructions...
<!-- agentkit:pr-review-agent:end -->
```

- Re-running `add` updates the block in place; it never duplicates it.
- `remove` deletes only that block (and the kit folder).
- Content outside marked blocks is never overwritten.

If any kit file returns 404, `agentkit` exits with a non-zero status, so it is safe to use in scripts and CI.

## Development

```bash
npm install
npm run build      # bundle with tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the CLI locally as `agentkit`
```

Stack: TypeScript, [commander](https://github.com/tj/commander.js) for argument parsing, [undici](https://github.com/nodejs/undici) fetch, vitest, tsup.

## Known limitations

- No Windows CI yet. CI covers macOS and Linux.
- No offline cache: every run fetches from the archive (or your `--base-url`).
- Downloaded files are not signature- or checksum-verified.

## Roadmap

- [ ] Windows CI
- [ ] `agentkit update` to refresh all installed kits
- [ ] Checksum verification using `agent.json`
- [ ] `--pack <starter-pack>` to install a whole starter pack at once

Issues and pull requests are welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli).

## License

[MIT](./LICENSE)
