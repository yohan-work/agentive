# RCA: `npm ci` fails with "Missing: @emnapi/* from lock file" in CI

## Summary

The lockfile on the PR branch was written by **npm 11.6.2 on macOS arm64**. CI runs **Node 22, which ships npm 10.x**, on **Linux x64**. `npm ci` doesn't install whatever the lockfile says. It first rebuilds the ideal dependency tree from `package.json` and checks that the lockfile matches it. npm 10 on Linux decides that `@emnapi/runtime@1.11.3` and `@emnapi/core@1.11.3` belong in the tree. Your npm 11 lockfile doesn't list them, so the check fails with `EUSAGE` before anything downloads. That's why it dies in about 6 seconds, clearing the cache changes nothing, and it passes on your laptop, where the npm version that wrote the lockfile also reads it.

`@emnapi/*` comes in through the WASM fallback packages (`@img/sharp-wasm32` under Next's `sharp`, and `@napi-rs/wasm-runtime`). Those are optional, peer, or platform-gated dependencies, which is exactly where npm 10 and 11 build lockfiles differently. The `"optional"` / `"peer"` flags you saw move under `node_modules/@img/...` and `node_modules/@napi-rs/...` are the fingerprint of this. Adding `tsx` didn't break anything by itself. Running `npm install` with npm 11 re-serialized that part of the tree.

Confidence: high on the mechanism class (lockfile written by a different npm major and platform than the one validating it). Medium on which exact npm behavior triggers it. The reproduction below settles that in about 10 minutes.

## Hypotheses, ranked

| # | Hypothesis | Likelihood | Why |
|---|---|---|---|
| H1 | **npm major mismatch (11 local, 10 CI).** npm 11 wrote optional/peer entries for the WASM packages in a shape npm 10 treats as "missing @emnapi/*". | **High** | Only CI fails. Node 22 means npm 10. The only lockfile change came from an npm 11 `npm install`. The flag churn is in exactly the subtree that pulls `@emnapi`. |
| H2 | **Platform-dependent tree computation.** On darwin-arm64, npm pruned or flagged the WASM fallback's deps differently than it would on linux-x64. Linux resolution then finds `@emnapi/*` unaccounted for. This can happen even with the same npm version. | Medium (often combined with H1) | `npm ls @emnapi/runtime` prints `(empty)` locally, which is consistent with the Mac tree never installing that branch. |
| H3 | **Incremental `npm install` on an existing `node_modules` left a stale or partial lockfile.** A known class of npm bugs: installing into an existing tree drops entries a fresh resolve would include. | Low to medium | Your local `rm -rf node_modules && npm ci` passes, but that only proves the lockfile agrees with npm 11 on macOS, not with a fresh resolve elsewhere. |
| H4 | **The `tsx`/`esbuild` range pulled a newer transitive version** that changed the `@emnapi` range, for example via a shared dep bumped as a side effect. | Low | Possible contributor, but it would normally show up as a version mismatch rather than "Missing". Worth a glance at the diff. |
| H5 | Cache, registry flake, or runner issue | **Ruled out** | Fails deterministically 3 of 3 times, including with the cache cleared, and fails before any network install. `main` is green on the same workflow. |

## Evidence map

| Evidence | Supports | Against / neutral |
|---|---|---|
| Fails only in CI; `npm ci` passes locally after `rm -rf node_modules` | H1, H2 | Rules out a lockfile that's inconsistent everywhere |
| `EUSAGE` sync check, fails in ~6 s, cache clear doesn't help | H1, H2, H3 (validation-time failure) | Rules out H5 |
| Missing packages are `@emnapi/*`, which only matter for WASM fallbacks | H1, H2 | Unrelated to tsx functionally |
| `optional`/`peer` flags moved under `@img/*` and `@napi-rs/*` | H1 (npm 11 serialization), H2 | |
| Local: Node 24.9 / npm 11.6.2 / macOS arm64. CI: Node 22 / npm 10.x / linux x64 | H1, H2 | |
| `main` green; its lockfile was presumably written before this change or with a different npm | H1 | Unknown: which npm wrote main's lockfile (check below) |
| `npm ls @emnapi/runtime` prints `(empty)` locally | H2 | Doesn't distinguish H1 from H2 |

**Assumptions:** CI's Node 22 resolves to npm 10.x (true for all Node 22 releases to date), and nothing else in the workflow changes npm's version or config (`.npmrc`, `npm_config_*` env). If the repo has an `.npmrc` with `legacy-peer-deps`, `omit`, or `os`/`cpu` settings, tell me, because that changes the analysis.

## Reproduction plan (about 10–15 min)

Run these in order. Each step splits the hypotheses.

1. **Confirm the npm version in CI (1 min).** Add `- run: node -v && npm -v` before `npm ci`, or read the setup-node output. Expect 22.x / 10.x.

2. **Reproduce H1 locally on macOS (3 min):**
   ```bash
   rm -rf node_modules
   npx -y npm@10 ci          # npm 10 on your Mac, with your current lockfile
   ```
   - Fails with the same `Missing: @emnapi/...`: **H1 confirmed** (npm version alone explains it).
   - Passes: go to step 3 (platform matters, H2).

3. **Reproduce CI exactly in Docker (5 min):**
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 \
     sh -c 'rm -rf node_modules && npm -v && npm ci'
   ```
   Then try the same with npm 11 on Linux:
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 \
     sh -c 'rm -rf node_modules && npx -y npm@11.6.2 ci'
   ```
   - Fails on npm 10 and passes on npm 11: H1.
   - Fails on both: H2 (the lockfile is platform-skewed and must be generated or validated on Linux).
   - Note: the bind-mounted `node_modules` gets Linux binaries. Run `rm -rf node_modules && npm ci` on the Mac afterwards.

4. **Inspect the lockfile diff (2 min):**
   ```bash
   git diff main -- package-lock.json | grep -nE '@emnapi|wasm|"optional"|"peer"'
   grep -n '"lockfileVersion"' package-lock.json
   git show main:package-lock.json | grep -c '@emnapi'
   grep -c '@emnapi' package-lock.json
   ```
   If `main`'s lockfile contains `node_modules/@emnapi/runtime` entries and the branch's doesn't, npm 11 on your Mac dropped them during `npm install -D tsx`. That's the smoking gun.

## Fix direction (actionable today)

**Recommended: regenerate the lockfile change with the npm CI uses, then verify on Linux.**

```bash
git checkout main -- package-lock.json      # start from the known-good lockfile
rm -rf node_modules
# Use Node 22 / npm 10, matching CI (nvm/fnm/volta, or npx):
npx -y npm@10 install -D tsx@^4.23.15
# Verify the lockfile now contains @emnapi entries:
grep -c '"node_modules/@emnapi/runtime"' package-lock.json
# Verify on Linux exactly like CI:
docker run --rm -v "$PWD":/app -w /app node:22 sh -c 'rm -rf node_modules && npm ci'
rm -rf node_modules && npm ci                # restore local macOS install
git commit -am "fix: regenerate package-lock with npm 10 so npm ci passes in CI"
```

This keeps the lockfile diff minimal (only tsx/esbuild plus whatever npm 10 legitimately adds) and unblocks the PR without changing CI.

**Follow-up to prevent recurrence (pick one, separate PR):**
- **Pin npm across machines:** add `"packageManager": "npm@10.x.y"` (or the version you settle on) and `"engines": { "npm": ">=10 <11" }` to `package.json`, and use Node 22 locally (you already have `.nvmrc`, so `nvm use` / `fnm use` it). Your laptop is on Node 24, which is the root drift.
- **Or move CI up to your toolchain:** set `.nvmrc` to `24`, or add `npm install -g npm@11.6.2` before `npm ci`. Only do this if the project intends to support Node 24/npm 11. It changes the contributor baseline for everyone.
- Optional guard: a CI step that fails early with a clear message if `npm -v` doesn't match the expected major.

**Not recommended:**
- Adding `@emnapi/runtime`/`@emnapi/core` as explicit devDependencies. It masks the problem and adds deps the project doesn't use.
- Switching CI to `npm install`. It gives up reproducible installs and hides future lockfile drift.
- Deleting the whole lockfile and regenerating from scratch. It works, but it bumps every transitive dependency in a PR that should only add tsx.

## Risks

- **Regenerating with npm 10 may reshuffle other optional entries.** Review the diff. It should be limited to tsx, esbuild, `@esbuild/*` platform packages, and the `@emnapi`/WASM entries.
- **Contributors on npm 11 will keep producing churn** until npm is pinned. The next dependency PR from a Node 24 machine can break CI the same way.
- **If step 3 shows H2 (fails on both npm versions),** the lockfile must be produced or validated on Linux. Use the Docker command for any lockfile change, or add a lockfile-validation CI job.
- **Local node_modules contamination** from running Docker with a bind mount. Always `rm -rf node_modules && npm ci` on the Mac afterwards.

## Next actions

| # | Action | Owner | Time |
|---|---|---|---|
| 1 | Run `npx -y npm@10 ci` locally to confirm H1 | You | 3 min |
| 2 | If needed, run the Docker `node:22` repro to separate H1 from H2 | You | 5 min |
| 3 | Restore main's lockfile, re-add tsx with npm 10, verify in Docker, push | You | 10 min |
| 4 | Confirm CI green on the PR | You | one CI run |
| 5 | Separate PR: pin npm (`packageManager`/`engines`) and align local Node with `.nvmrc` | You / maintainers | 15 min |

If step 1 or 3 behaves differently from what's described here, send me the output of `npm -v` from CI and the `grep` results from step 4 of the repro, and I'll narrow it down.
