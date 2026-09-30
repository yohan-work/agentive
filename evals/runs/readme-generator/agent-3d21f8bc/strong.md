````markdown
# agentkit-cli

A zero-config Node CLI that installs agent "install kits" from [Agent Archive](https://yohan-work.github.io/agentive/) into your repo, many at once, and merges them into existing files safely.

## Why

Every project-ready agent in Agent Archive publishes 7 files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}
```

Today you copy one curl one-liner per agent. `agentkit` fetches kits for several agents in one command, wires them into your Codex, Claude Code, or Cursor instructions, and can update or remove them later without duplicating or clobbering your own content.

## Requirements

- Node.js >= 20.9
- macOS or Linux (tested in CI). Windows is not tested in CI yet; see [Limitations](#limitations).

## Getting started

Run it with `npx`, no install needed:

```bash
npx agentkit-cli add pr-review-agent test-case-generator --target claude
```

This downloads both kits into `./agent-kits/<slug>/` and appends each agent's instructions to `CLAUDE.md` inside marked blocks.

The examples below use the `agentkit` command; with `npx`, write `npx agentkit-cli` instead.

## Usage

### `agentkit add <slug...>`

Downloads the 7 kit files for each slug into `./agent-kits/<slug>/`.

```bash
agentkit add pr-review-agent test-case-generator
```

### `agentkit add <slug> --target codex|claude|cursor`

Also wires the kit into your tool's instructions:

| `--target` | What it writes |
| --- | --- |
| `codex` | Appends the instructions to `AGENTS.md` |
| `claude` | Appends the instructions to `CLAUDE.md` |
| `cursor` | Writes `.cursor/rules/<slug>.mdc` |

```bash
agentkit add pr-review-agent --target codex
agentkit add pr-review-agent --target claude
agentkit add pr-review-agent --target cursor
```

Appended content is wrapped in markers:

```html
<!-- agentkit:pr-review-agent:start -->
...kit instructions...
<!-- agentkit:pr-review-agent:end -->
```

- **Re-running** `add` for the same slug replaces the content between its markers in place. It does not add a second copy.
- **Your own content is safe:** agentkit never overwrites anything outside its marked blocks.

### `agentkit remove <slug>`

Removes the slug's marked block and deletes `./agent-kits/<slug>/`.

```bash
agentkit remove pr-review-agent
```

### `agentkit list`

Shows the installed kits and the version from each kit's `agent.json`.

```bash
agentkit list
```

### Options

| Option | What it does |
| --- | --- |
| `--dry-run` | Prints the diff that would be applied; writes nothing. |
| `--base-url <url>` | Fetches kits from a self-hosted mirror of the archive instead of `https://yohan-work.github.io/agentive/`. |

```bash
agentkit add pr-review-agent --target claude --dry-run
agentkit add pr-review-agent --base-url https://mirror.example.com/agentive/
```

### Errors and exit codes

If any kit file returns 404 (for example, a mistyped slug), `agentkit` exits with a non-zero code, so scripts and CI fail loudly instead of installing a partial kit.

## Development

```bash
npm install
npm run build      # tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the CLI locally as `agentkit`
```

Built with TypeScript, commander, undici fetch, vitest, and tsup.

## Limitations

- No Windows CI yet. CI runs on macOS and Linux only.
- No offline cache. Every run fetches from the archive (or your `--base-url`).
- No signature or checksum verification of downloaded files. Only use mirrors you trust.

## Roadmap

Planned, not available yet:

- Windows CI
- `agentkit update` to refresh all installed kits
- Checksum verification using `agent.json`
- `--pack <starter-pack>` to install a starter pack

## Contributing

Issues and PRs welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli). Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a PR.

## License

MIT
````

**Notes for the author**

- **Mirror URL:** `https://mirror.example.com/agentive/` in the `--base-url` example is a placeholder. Check whether the base URL should end with `/agentive/` or with `/kits/`.
- **Global install:** I left out `npm install -g agentkit-cli` because you only gave the `npx` usage. If global install is supported and the bin name is `agentkit`, add it to Getting started.
- **`add` without `--target`:** I assumed it only downloads to `./agent-kits/<slug>/` and doesn't touch `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules/`.
- **Missing target file:** check what `--target codex|claude` does when `AGENTS.md` or `CLAUDE.md` doesn't exist yet (creates it, or errors?). Check what `--target cursor` does when `.cursor/rules/<slug>.mdc` exists but has no agentkit markers. The "never overwrites" promise should cover that case.
- **Content appended:** I assumed `--target codex` appends the kit's `AGENTS.md` and `--target claude` appends the kit's `CLAUDE.md`.
- **`remove` behaviour:** check whether `remove` scans both `AGENTS.md` and `CLAUDE.md` for blocks and whether it also deletes `.cursor/rules/<slug>.mdc`. If it does, say so in the README. Also check whether it takes multiple slugs like `add` does.
- **Which commands take the options:** I assumed `--dry-run` and `--base-url` work with `add`. Check whether `remove` also supports `--dry-run`.
- **404 behaviour:** I wrote "instead of installing a partial kit". Confirm that a 404 leaves no partial `./agent-kits/<slug>/` folder or marked block behind. If files are written before the failure, change that line.
- **Contributing:** I added a one-line section built from your scripts. Replace it if you have a `CONTRIBUTING.md`.
- **Badges:** none added, because no badge sources were given.
