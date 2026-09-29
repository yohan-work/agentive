# RCA: `npm ci` fails with EUSAGE on PR branch (Agent Archive)

## TL;DR

This is almost certainly **not** a tsx problem and **not** a cache problem. Your laptop wrote the lockfile, and the npm in CI reads it differently. Locally you run **Node 24 / npm 11.6.2**. CI runs **Node 22** (from `.nvmrc`), which bundles **npm 10.x**. When you ran `npm install -D tsx`, npm 11 re-resolved the platform-specific optional parts of the tree (`@img/*` from sharp via Next, `@napi-rs/*`). That is the `optional`/`peer` flag churn you noticed. npm 10's `ci` consistency check then decides that `@emnapi/runtime` and `@emnapi/core` (dependencies of the WASM fallback packages) should be in the lockfile, and they aren't.

**Fix today:** regenerate the lockfile change with the same Node/npm that CI uses, then verify with `npm ci` in a Linux Node 22 container before you push. Details are in "Fix direction" below.

---

## Facts from your report

| Observation | What it tells us |
|---|---|
| Fails in ~6s at `npm ci` with `EUSAGE` "not in sync" | The pre-install lockfile validation fails. Nothing was downloaded, so network, registry, and cache are ruled out. |
| Missing `@emnapi/runtime@1.11.3`, `@emnapi/core@1.11.3` | These are transitive deps of WASM fallback packages (e.g. `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`). They are optional and platform-conditional, and nobody depends on them directly. |
| `npm ls @emnapi/runtime` is `(empty)` locally | Expected on darwin-arm64: the WASM fallback isn't installed there. Your machine never needs these packages, so it never notices they're missing. |
| Lockfile diff shows `optional`/`peer` flags moving under `@img/...` and `@napi-rs/...` | tsx/esbuild don't touch those packages. The churn comes from the npm version that re-wrote the lockfile, not from the dependency you added. |
| Local: Node 24.9 / npm 11.6.2. CI: Node 22 (bundled npm 10.x) | Different npm majors on each side of the lockfile. |
| Fails after clearing the Actions cache and on 3 re-runs | Deterministic, so not a flaky cache or registry issue. |
| `main` is green | `main`'s lockfile is valid for npm 10. The branch's lockfile change introduced the problem. |

---

## Hypotheses (ranked)

### H1: npm 11 vs npm 10 lockfile disagreement (most likely, ~70%)
npm 11 wrote a lockfile whose optional/peer metadata for the `@img` / `@napi-rs` subtree differs from what npm 10 computes as the ideal tree. npm 10's `ci` then finds edges to `@emnapi/*` with no matching `node_modules/@emnapi/*` entry and refuses to install.
- **For:** the flag churn in unrelated packages, the local/CI npm major mismatch, `main` green, deterministic failure.
- **Against / unknown:** I haven't seen the lockfile. Confirm with the repro below.

### H2: Cross-platform optional-dependency pruning (~15%, often co-occurs with H1)
npm has a long-standing class of bugs where a lockfile generated on one OS/arch omits transitive deps of optional packages for *other* platforms. The WASM fallbacks and their `@emnapi/*` deps are the classic example. Regenerating on macOS dropped entries that Linux validation needs.
- **Distinguish from H1:** run CI's npm version on Linux, and then your npm version on Linux (repro steps 2 and 3).

### H3: PR merge-commit drift (~10%)
`pull_request` workflows check out `refs/pull/N/merge`, which is your branch merged into current `main`, not your branch tip. If `main` changed `package-lock.json` after you branched (a Next/sharp bump, for example), the merged lockfile can be internally inconsistent even though both sides are fine alone. That would also explain "works on my laptop on the branch".
- **Check:** `git log --oneline <merge-base>..origin/main -- package.json package-lock.json`. Any output makes this plausible.

### H4: Anything cache-, registry-, or tsx-specific (<5%)
Ruled out by: failure before any download, cache clear had no effect, and `npm ci` validates only against the lockfile, so newly published versions don't matter. tsx 4.x has no `@emnapi` dependency.

---

## Assumptions
- `actions/setup-node` with `node-version-file: .nvmrc` uses Node 22's **bundled** npm (10.x). No step upgrades npm. Confirm by adding `node -v && npm -v` before `npm ci`.
- Your lockfile change came only from `npm install -D tsx` under Node 24 / npm 11.6.2, with no manual edits.
- The workflow triggers on `pull_request` (relevant to H3).

---

## Reproduction plan (~20 minutes)

Run these from the repo root, on the PR branch, with Docker available.

1. **Confirm CI versions.** Temporarily add a step `run: node -v && npm -v` before `npm ci`, or check the setup-node log output. You should see npm 10.x.

2. **Reproduce CI exactly (Linux + Node 22 + npm 10):**
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 bash -c 'npm -v && npm ci --ignore-scripts'
   ```
   - Fails with the same `Missing: @emnapi/...` error: reproduced. Continue to step 3.
   - Passes: go to step 4 (H3).

3. **Isolate npm version vs platform:**
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 bash -c 'npm i -g npm@11.6.2 && npm ci --ignore-scripts'
   ```
   - Passes: **H1 confirmed.** npm major mismatch is the cause.
   - Still fails: **H2.** The macOS-generated lockfile is missing Linux-relevant entries regardless of npm version.

   Also try the reverse on your Mac: `npx -y npm@10 ci`. If this fails locally too, that's strong H1 evidence without Docker.

4. **Test the merge commit (H3):**
   ```bash
   git fetch origin
   git switch -c rca-merge-test
   git merge --no-edit origin/main
   docker run --rm -v "$PWD":/app -w /app node:22 npm ci --ignore-scripts
   ```

5. **Inspect the lockfile evidence:**
   ```bash
   grep -n '"node_modules/@emnapi' package-lock.json        # entries present?
   grep -n '"@emnapi/runtime"' package-lock.json            # who depends on it?
   git diff origin/main -- package-lock.json | grep -nE 'emnapi|wasm|"optional"|"peer"'
   ```
   Expected under H1/H2: dependents such as `@img/sharp-wasm32` or `@napi-rs/wasm-runtime` list `@emnapi/*`, but there is no `node_modules/@emnapi/...` entry on the branch. `main` has one.

(Scripts are disabled with `--ignore-scripts` because only the validation step matters here, and it keeps the mounted `node_modules` from getting Linux binaries. Delete `node_modules` afterwards anyway.)

---

## Fix direction (act today)

### Recommended: regenerate the lockfile change with CI's toolchain
Start from `main`'s known-good lockfile and re-apply only the tsx addition using Node 22 / npm 10:

```bash
git checkout origin/main -- package-lock.json
docker run --rm -v "$PWD":/app -w /app node:22 \
  npm install --package-lock-only --ignore-scripts
# package.json already contains "tsx": "^4.23.15"; this adds only what's needed
docker run --rm -v "$PWD":/app -w /app node:22 npm ci --ignore-scripts   # must pass
rm -rf node_modules && npm ci   # sanity check locally too
git add package-lock.json && git commit -m "fix: regenerate lockfile with npm 10 to match CI"
```

Without Docker, you can use `nvm use` (which respects `.nvmrc` → Node 22) and then do the same steps without the container.

**Check the diff before you push.** It should be roughly tsx + esbuild (+ its platform packages), with **no** flag churn under `@img/*` / `@napi-rs/*` and `@emnapi/*` entries intact. If you see unrelated version bumps, stop and restore `main`'s lockfile again.

If step 3 pointed to **H2** (the failure is platform-specific, not version-specific), generating inside the Linux container as above still fixes it, because the lockfile then gets written on the platform that validates it.

If step 4 pointed to **H3**, rebase onto `origin/main` first, then do the regeneration above.

### Prevent recurrence (small follow-up PR)
- **Align local with `.nvmrc`.** Your laptop runs Node 24, but the project declares 22. Use `nvm use` / `fnm use` / `volta` so contributors write lockfiles with the same npm major as CI.
- **Pin npm explicitly** so it doesn't drift with the Node patch version. Either add `npm i -g npm@<version>` in the workflow before `npm ci` and document the same version for contributors, or declare it in `package.json` via `devEngines` / `engines.npm` (with `engine-strict`) so a mismatch fails loudly.
- **Print versions in CI** (`node -v && npm -v`) so the next mismatch is obvious from the log.
- Optionally, **add a lockfile check** in CI or pre-commit that runs `npm ci --dry-run` or `npm install --package-lock-only` with a clean git diff check.

### Don't do these
- **Don't switch CI to `npm install`.** It hides the problem and makes builds non-reproducible.
- **Don't delete and regenerate the whole lockfile.** That silently bumps every transitive dep inside a "add test runner" PR.
- **Don't hand-add `@emnapi` entries.** Integrity hashes and resolution metadata are easy to get wrong.

---

## Risks
- **Other Node 22 vs 24 differences.** Once `npm ci` passes, `test`/`build` run on Node 22 for the first time on this branch. You've only validated them on Node 24. `node --import tsx --test` is fine on 22, but watch for other runtime differences.
- **npm 11 locally may re-churn the lockfile.** The next time you run `npm install` on Node 24, the flags could move back and reintroduce the problem. The prevention step (aligning versions) is what actually closes this.
- **Unrelated changes in the regenerated lockfile.** If it changes more than expected, reviewers may push back. Keep the diff minimal and mention the regeneration in the PR description.

---

## Next actions

| # | Action | Owner | Time |
|---|---|---|---|
| 1 | Run repro steps 2 and 3 to confirm H1 vs H2 | You | 10 min |
| 2 | Regenerate the lockfile from `main` using Node 22 / npm 10; verify `npm ci` in `node:22` | You | 10 min |
| 3 | Push, confirm CI is green through build | You | ~CI time |
| 4 | Follow-up PR: print versions in CI, pin npm, document `nvm use` in CONTRIBUTING | You / maintainers | 30 min |

If step 2 of the repro **passes** in `node:22` on your branch and step 4 also passes, send me the `npm -v` line from the CI log and the output of the lockfile `grep` commands. That would mean CI's environment differs from stock `node:22`, and I'd want to see exactly how.
