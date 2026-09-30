You've given enough to make a strong provisional call. Three things would settle it faster, most important first:

1. **Which npm version does CI actually run?** The setup-node step (or `npm -v`) prints it. I expect the npm that ships with Node 22 (10.x), but that needs checking.
2. **Did the `lockfileVersion` or top-level `"packages"."" ` block change in the lockfile diff**, and which Node/npm produced main's current lockfile?
3. **Which lockfile entries mention `@emnapi`?** Run `git diff main -- package-lock.json | grep -n -B3 -A3 emnapi` and `grep -n '"@emnapi/' package-lock.json` on the branch.

Until those come back, the analysis below is provisional. Anything I assume is marked [ASSUMPTION].

---

## 1. Evidence map

| Fact | What it rules in / out |
|---|---|
| `npm ci` fails in ~6 s with `EUSAGE` "package.json and package-lock.json … are in sync" | This is npm's **local lockfile-validity check**. It runs before any download. **Rules out** network, registry, auth, the Actions cache, and flaky infra. Clearing the cache and 3 identical re-runs agree with that. **Rules in** "the npm running in CI reads this lockfile as incomplete." |
| `Missing: @emnapi/runtime@1.11.3` and `@emnapi/core@1.11.3` | npm computed from the lockfile's dependency graph that something needs these exact versions, but found no `node_modules/@emnapi/*` entry. The versions are exact, so some entry in the lockfile *declares* them, most likely as a dependency or peer dependency. The problem is inside the lockfile, not package.json. |
| You don't use `@emnapi` directly; `npm ls @emnapi/runtime` prints `(empty)` locally | This is expected and **doesn't rule anything out**. `@emnapi/*` is the Node-API-on-WebAssembly runtime. It is normally pulled in only by **wasm32 fallback packages** of native modules (e.g. a `…-wasm32` variant under `@img/*`, or `@napi-rs/wasm-runtime`) [ASSUMPTION: verify with the grep in Q3]. On darwin-arm64 those fallbacks aren't installed, so `npm ls` shows nothing. The lockfile still has to describe them for every platform. |
| The lockfile diff touched `"optional": true` / `"peer": true` flags under `node_modules/@img/...` and `node_modules/@napi-rs/...` (you weren't sure if this matters) | **It very likely matters. It's the strongest clue.** Those flags tell `npm ci` which entries are required and which can be skipped. `@img/*` and `@napi-rs/*` are exactly the namespaces whose wasm fallbacks depend on `@emnapi/*`. If one npm wrote the flags one way and another npm reads them differently, one version sees a complete tree and the other sees a missing required dep. That matches the error exactly. |
| Local: Node **24.9.0**, npm **11.6.2**. CI: `.nvmrc` = `22` | A real environment difference. The lockfile was written by npm 11 but is validated in CI by whatever npm ships with Node 22 [ASSUMPTION: npm 10.x, confirm via Q1]. It's the only toolchain difference you've described. |
| Local `rm -rf node_modules && npm ci` succeeds | The lockfile agrees with itself **according to npm 11 on darwin-arm64**. The failure needs a different npm version, a different platform, or both. |
| main is green; the only dependency change is `npm install -D tsx` (+61/−38 lock lines) | The lockfile regeneration on this branch caused it, not tsx itself. Adding tsx only needs new tsx/esbuild entries. The **−38 lines and the flag changes in unrelated `@img`/`@napi-rs` entries** are side effects of npm 11 rewriting the whole lockfile. |
| `.nvmrc` and the workflow file untouched | CI's toolchain didn't change. What changed is the lockfile, and the toolchain that wrote it. |

---

## 2. Hypotheses, ranked

### H1 (most likely): npm version skew. npm 11 wrote the lockfile, CI's older npm rejects it

**Mechanism:** Running `npm install -D tsx` under npm 11.6.2 re-evaluated the whole tree. It rewrote the optional/peer flags on the `@img/*` and `@napi-rs/*` entries and dropped (or never added) the `node_modules/@emnapi/*` entries. npm 11 treats those as not required, so its own `npm ci` passes. The npm on Node 22 builds its "ideal tree" from the same lockfile with different optional/peer rules, decides `@emnapi/runtime` and `@emnapi/core` 1.11.3 are required, doesn't find them, and exits with `EUSAGE`.

- **For:** It explains local-pass/CI-fail with no infra involved. The flag changes sit in exactly the namespaces tied to `@emnapi`. The failure is deterministic. main (lockfile presumably written by an older npm) is green.
- **Against / unknown:** I haven't confirmed CI's npm version, and I'm inferring the exact npm 10 vs 11 difference from the symptoms, not from a changelog.
- **Confirm or kill** (on your laptop, no Docker needed):
  ```bash
  git status   # clean tree on the PR branch
  rm -rf node_modules
  npx -y npm@10 ci        # or: nvm use 22 && npm ci
  ```
  - **Confirms H1:** the same `EUSAGE … Missing: @emnapi/runtime@1.11.3` on macOS. That means the npm version alone reproduces it.
  - **Kills H1:** it installs cleanly. Go to H2.

### H2: platform-dependent lockfile content (darwin-arm64 vs linux-x64)

**Mechanism:** When npm 11 regenerated the lockfile, platform-specific optional deps were resolved against your machine. That left the lockfile incomplete for another OS/CPU combination. Linux's validation then walks a branch (the wasm fallback) that macOS doesn't. npm has had long-standing issues with optional platform packages in lockfiles [ASSUMPTION: verify against npm's issue tracker for your exact version, not from memory].

- **For:** The affected packages are all native/wasm platform variants.
- **Against:** `npm ci`'s sync check is supposed to be platform-independent, and local `npm ci` passes. So platform alone is less likely than version skew. The two can also combine.
- **Confirm or kill.** Test the same npm on Linux, and CI's npm on Linux:
  ```bash
  # same npm as your laptop, on Linux
  docker run --rm -v "$PWD":/app -w /app node:24 bash -c 'npm i -g npm@11.6.2 && rm -rf node_modules && npm ci'
  # what CI does
  docker run --rm -v "$PWD":/app -w /app node:22 bash -c 'npm -v && rm -rf node_modules && npm ci'
  ```
  (The container writes `node_modules` into your working copy. Delete it afterwards, or work in a copy.)
  - npm 11 on Linux **fails**: H2 is real, because the platform matters even with the same npm.
  - npm 11 on Linux **passes** and node:22 **fails**: H1 alone, and H2 is dead.

### H3 (less likely): lockfile generated from a stale local `node_modules`

**Mechanism:** `npm install -D tsx` ran on top of an existing `node_modules`, and npm serialized some of that tree's quirks (e.g. hoisting, flags) into the lockfile rather than resolving fresh.

- **For:** The −38 lines touching unrelated packages.
- **Against:** Your fresh `rm -rf node_modules && npm ci` passes locally. That shows the lockfile is at least self-consistent for npm 11.
- **Confirm or kill:** regenerate from scratch with CI's npm (see Fix). If the new lockfile's diff against main is only tsx/esbuild additions and CI passes, the question no longer matters in practice.

### Ruled out by the evidence
- **Actions cache corruption:** ruled out because the failure persists with the cache cleared, and `EUSAGE` comes before any cache use.
- **Registry/network/package unpublished:** ruled out because it fails in 6 s with a sync error, not an `E404`/`ETARGET`/network error.
- **tsx or esbuild itself broken:** unlikely, because the missing packages are `@emnapi/*`, not tsx or esbuild.

---

## 3. Fix (for H1, which also covers H2)

**Goal:** a lockfile written by the same npm major that CI uses, containing only the tsx change.

```bash
git checkout <pr-branch>

# 1. Start the lockfile from main's version so the unrelated @img/@napi-rs churn goes away
git checkout main -- package-lock.json
rm -rf node_modules

# 2. Use CI's toolchain (Node 22 + its bundled npm)
nvm install 22 && nvm use 22      # or: fnm use / volta, whatever you use
node -v && npm -v                  # should match what CI prints

# 3. Re-add tsx with that npm (package.json already has "tsx": "^4.23.15")
npm install

# 4. Check the diff is only what you expect
git diff --stat package-lock.json
git diff package-lock.json | grep -n emnapi    # see whether @emnapi entries are now present
```

**Verify before pushing:**
```bash
rm -rf node_modules && npm ci && npm test                               # on Node 22
docker run --rm -v "$PWD":/app -w /app node:22 bash -c 'rm -rf node_modules && npm ci'   # Linux, same as CI
```
Then commit `package-lock.json`, push, and confirm the `npm ci` step goes green.

**If step 3 still leaves CI failing** (i.e. H2 applies even on npm 10), regenerate the lockfile inside the `node:22` Linux container instead of on macOS and commit that. You can also test whether the resulting lockfile still passes `npm ci` on your Mac.

**Rollback:** this is a lockfile-only change on a PR branch. If something goes wrong, `git revert` the commit or reset `package-lock.json` to the previous branch commit. Nothing reaches main until the PR is merged.

**Stopping it recurring** (these are project decisions, so pick what fits):
- **Align local and CI Node.** The root process issue is that `.nvmrc` says 22 while you develop on 24. Use `nvm use` / auto-switching in the repo, or deliberately bump `.nvmrc` to 24 so CI moves too (a separate PR, since that changes the runtime).
- **Pin the package manager.** Add `"packageManager": "npm@<version CI uses>"` and/or `"engines": { "node": "22.x", "npm": "<range>" }` to package.json. Add `engine-strict=true` in `.npmrc` if you want mismatches to fail loudly. [ASSUMPTION: check that npm enforces `packageManager` the way you want. Corepack/npm support for it varies, so treat `engines` + `engine-strict` as the reliable guard.]
- **Catch it before CI.** Add a CONTRIBUTING note: regenerate the lockfile only under the `.nvmrc` Node version. Also consider a cheap early CI job (`npm ci --dry-run` or just `npm ci`) on a matrix that includes the latest npm, so skew shows up as a clear signal.

---

## 4. Missing evidence (if neither H1 nor H2 reproduces)

- The **full debug log** from CI (`/home/runner/.npm/_logs/…-debug-0.log`). Upload it as an artifact with `actions/upload-artifact` on `if: failure()`. It shows which package's edge requires `@emnapi/*`.
- **The requiring entry:** `grep -n -B2 -A10 '"@emnapi/runtime"' package-lock.json` on the branch vs main. Find which `node_modules/...` entry lists it under `dependencies`/`peerDependencies`/`optionalDependencies`, and how its flags differ between the two.
- **Exact CI versions:** `node -v`, `npm -v`, and `npm config ls` as a debug step before `npm ci`.
- **Any `.npmrc`** in the repo or CI env (e.g. `legacy-peer-deps`, `omit`, `os`/`cpu` settings) that differs from your local config.

## Also worth checking
- Whether the test command `node --import tsx --test tests/*.test.ts` depends on the shell expanding the glob. It behaves the same on Linux bash, but confirm once CI gets past install.
- Whether Dependabot/Renovate lockfile PRs are generated with the same npm major as CI.
