Here's a concise README for `agentkit-cli`:

````markdown
# agentkit-cli

Install [Agent Archive](https://yohan-work.github.io/agentive/) install kits into your repo — many agents at once, merged safely into your existing `AGENTS.md`, `CLAUDE.md`, or Cursor rules.

[![npm](https://img.shields.io/npm/v/agentkit-cli.svg)](https://www.npmjs.com/package/agentkit-cli)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Every project-ready agent in the archive publishes seven files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/
  AGENTS.md  CLAUDE.md  cursor-rule.mdc  agent.json  README.md  RUNBOOK.md  EVALUATION.md
```

Instead of copying a curl one-liner per agent, `agentkit` fetches kits for several agents in one command and wires them into Codex, Claude Code, or Cursor. It is zero-config: no config file, no init step.

## Getting started

Requires Node.js **>= 20.9**.

```bash
# Run without installing
npx agentkit-cli add pr-review-agent test-case-generator --target claude

# Or install globally
npm install -g agentkit-cli
agentkit add pr-review-agent
```

This downloads each kit into `./agent-kits/<slug>/` and, with `--target claude`, appends the agent's instructions to `CLAUDE.md`.

## Usage

```bash
agentkit add <slug...>                       # download kits into ./agent-kits/<slug>/
agentkit add <slug> --target codex           # also append to AGENTS.md
agentkit add <slug> --target claude          # also append to CLAUDE.md
agentkit add <slug> --target cursor          # also write .cursor/rules/<slug>.mdc
agentkit remove <slug>                       # remove the kit folder and its marked block
agentkit list                                # show installed kits and their agent.json version
```

Options:

| Flag | Description |
| --- | --- |
| `--target codex\|claude\|cursor` | Also install the instructions for that tool |
| `--dry-run` | Print the diff without writing anything |
| `--base-url <url>` | Use a self-hosted mirror of the archive |

### How merging works

Appended instructions are wrapped in markers:

```md
<!-- agentkit:pr-review-agent:start -->
...
<!-- agentkit:pr-review-agent:end -->
```

- Re-running `add` updates the block in place instead of duplicating it.
- `remove` deletes only the marked block (and the kit folder).
- Content outside marked blocks is never overwritten.

### Exit codes

`agentkit` exits non-zero if any kit file returns 404, so it is safe to use in scripts and CI.

## Development

```bash
npm install
npm run build      # tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the CLI locally as `agentkit`
```

Built with TypeScript, [commander](https://github.com/tj/commander.js), undici `fetch`, vitest, and tsup.

## Known limitations

- No Windows CI yet (CI runs on macOS and Linux).
- No offline cache; every run fetches from the archive.
- No signature verification of downloaded files.

## Roadmap

- [ ] Windows CI
- [ ] `agentkit update` to refresh all installed kits
- [ ] Checksum verification using `agent.json`
- [ ] `--pack <starter-pack>` to install a whole starter pack

Issues and PRs welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli).

## License

[MIT](./LICENSE)
````

A couple of notes:

- I assumed the installed binary is named `agentkit` (from your examples) while the npm package is `agentkit-cli`, which is why `npx agentkit-cli ...` and `agentkit ...` both appear. If the `bin` name differs, adjust the Usage section.
- Your spec doesn't say what happens if you use `--target cursor` and `.cursor/rules/<slug>.mdc` already exists without markers, so I left that out. If the CLI refuses or skips in that case, it's worth one line under "How merging works."
