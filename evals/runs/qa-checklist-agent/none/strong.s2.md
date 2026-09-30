Here's a checklist you can paste straight into a GitHub issue. Each table has a **Result** column for ✅ / ❌ / ⚠️ and a **Notes** column for links, screenshots, or bug numbers. I ordered the sections so that smoke fails fast. If anything in Smoke fails, stop and don't announce.

Before you start, two things to know about GitHub Pages:
- Pages sits behind a CDN with about a 10-minute cache (`max-age=600`). Hard-refresh, or add `?qa=<timestamp>` to URLs, so you aren't QA-ing the previous deploy. Check the build SHA or the "deployed" time in the Actions run first.
- `robots.txt` only counts at the **host root**. Crawlers read `https://yohan-work.github.io/robots.txt`, not `/agentive/robots.txt`. So test #16's robots.txt for correctness, but don't expect it to control crawling. Submit the sitemap in Search Console instead (see C-12).

---

```markdown
# Release QA — Agent Archive — week of <date>

**Build:** main @ `<sha>` · **Pages deploy run:** <link> · **Tester:** @<you> · **Started:** <time>

Legend: ✅ pass · ❌ fail (link bug) · ⚠️ pass with note · N/A

## 0. Pre-flight

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| P-1 | CI green on the merge commit (check:data, lint, typecheck, test, build) | All jobs pass | | |
| P-2 | Pages deploy job finished for the same SHA | Deployed SHA = main HEAD | | |
| P-3 | Live site serves the new build (view source / a new string such as a Korean "Clear all" on /ko/agents) | New build visible, not the cached old one | | |
| P-4 | Rollback path confirmed: know the last good SHA and how to redeploy it (revert PR or re-run the previous deploy) | Written down here: `<sha>` | | |

## 1. Smoke (≈15 min, blocks announcement)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| S-1 | `https://yohan-work.github.io/agentive/` | Redirects to `/agentive/en/` (not to the host root `/en/`) | | |
| S-2 | /en home loads | No console errors, CSS/JS load (no 404s under `/agentive/_next/`) | | |
| S-3 | /ko home loads | Korean UI, no console errors | | |
| S-4 | /en/agents | 100 cards render; count label says 100 | | |
| S-5 | Search "qa" on /en/agents | Results filter live; count updates | | |
| S-6 | Installable-only toggle on | Exactly **20** cards | | |
| S-7 | Open one installable agent detail page | Download Kit button, curl command, and 7 per-file links visible | | |
| S-8 | Copy the curl command and run it in macOS zsh | 7 files downloaded into `agent-kits/<slug>/`, exit code 0 | | |
| S-9 | Open one non-installable agent detail page | No Download Kit / curl command; page renders normally | | |
| S-10 | `/agentive/sitemap.xml` | 200, valid XML | | |
| S-11 | `/agentive/robots.txt` | 200, plain text, has a Sitemap line | | |
| S-12 | Language switch EN→KO on a detail page | Goes to the same agent in /ko, not the /ko home | | |
| S-13 | /en/install and one /en/workflows/<slug> | Render, no console errors | | |
| S-14 | Unknown URL, e.g. `/agentive/en/agents/does-not-exist` | Site 404 page (not a blank page or a bare GitHub 404) | | |

## 2. Regression

### 2a. Install kits (#13)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-1 | All 20 kits × 7 files return 200 (script below) | 140/140 × 200 | | |
| R-2 | `curl -sI .../kits/<slug>/agent.json` Content-Type | `application/json` (if `text/plain`, log it; fine for curl, may matter for tools that check MIME) | | |
| R-3 | Content-Type of `.md` files | `text/markdown` or `text/plain`, **with `charset=utf-8`** | | |
| R-4 | Content-Type of `cursor-rule.mdc` | Record the value. If it's `application/octet-stream`, clicking the link downloads instead of displaying; check that the UI copy/behavior is acceptable | | |
| R-5 | Click each per-file link in Chrome, Safari, and Firefox | Opens or downloads the right file; nothing 404s; filenames not mangled (e.g. no `cursor-rule.mdc.txt` in Safari) | | |
| R-6 | Download Kit button | Downloads the full kit (zip or all files as designed); archive opens; 7 files, not empty | | |
| R-7 | `agent.json` parses (`jq . agent.json`) and its slug/status match the page | Valid JSON; `verifiedStatus` matches the badge on the page | | |
| R-8 | EVALUATION.md / README.md in a kit whose agent was lowered in #14 | No stale "Tested"/"tested" claims | | |
| R-9 | Non-installable slug: `/kits/<non-installable-slug>/AGENTS.md` | 404 (no half-generated kits) | | |
| R-10 | Curl command shown on the page uses the exact slug and the `/agentive/` base path | URL correct; brace list includes all 7 files incl. `cursor-rule.mdc` | | |
| R-11 | Curl command has no `--output-dir` | Confirmed | | |
| R-12 | Copy button copies the exact command (paste into a text editor and diff) | No smart quotes, no trailing newline issues, no HTML entities (`&amp;&amp;`) | | |
| R-13 | Run the command twice in the same folder | Second run overwrites cleanly, exit 0 | | |
| R-14 | Run the command with a deliberately broken slug | Non-zero exit (`-f`), no HTML 404 page saved as `AGENTS.md` | | |

### 2b. Verification status (#14)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-15 | Status filter counts on /en/agents | Tested/Unverified/etc. counts match the data (e.g. unverified went up by 61) | | |
| R-16 | Spot-check 5 of the 61 lowered agents: card badge, detail badge, /ko badge | All show Unverified / 미검증 (or your KO label) | | |
| R-17 | Spot-check every agent still marked Tested/Expert | Detail page shows ≥ 2 sample runs | | |
| R-18 | Workflow pages that list agents | Badges match the new status (no stale "Tested") | | |
| R-19 | Sort/filter by status still works after the change | Correct ordering, no empty groups | | |
| R-20 | Pages built at build time (home "featured", install page lists) | No hard-coded or stale status text | | |

### 2c. Korean translation (#15, #19)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-21 | /ko/agents search panel: placeholder, 7 filter group headings, all options, installable-only toggle, result count, "Clear all" | All Korean | | |
| R-22 | Apply filters, then "Clear all" on /ko | Resets all filters **and** the search text and toggle; count back to 100 | | |
| R-23 | Result count grammar on /ko with 0, 1, and many results | Natural Korean; empty state translated | | |
| R-24 | /ko agent detail page: headings, button labels (Download Kit, copy, bookmark), tooltips, "copied" toast, aria-labels | Korean (the curl command itself stays as-is) | | |
| R-25 | Status + difficulty badges on /ko cards and detail | Korean, same color mapping as /en | | |
| R-26 | /ko workflow cards and /ko/workflows/<slug> | Translated UI chrome | | |
| R-27 | /ko/install, /ko/bookmarks | UI chrome translated (log leftover English as bugs with screenshots) | | |
| R-28 | `<html lang>` | `ko` on /ko pages, `en` on /en pages | | |
| R-29 | Page `<title>` and meta description on /ko | Korean (or intentionally English; note which) | | |
| R-30 | Filter state in URL (`?q=` etc.) survives reload and EN↔KO switch | State kept or reset as designed, no crash | | |
| R-31 | Hangul search input on /ko/agents (type "테스트" with the IME) | No duplicate or dropped characters while composing; results update after composition | | |

### 2d. Sitemap / robots (#16)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-32 | Every `<loc>` is absolute and includes `/agentive/` | e.g. `https://yohan-work.github.io/agentive/en/agents/<slug>/` | | |
| R-33 | Each URL has `xhtml:link rel="alternate" hreflang="en"` and `"ko"` (and `x-default` if intended) pointing at each other | Reciprocal pairs | | |
| R-34 | No `/bookmarks` URL in either locale | Excluded | | |
| R-35 | URL count ≈ (pages × 2 locales) | Matches: 100 agents + workflows + static pages, ×2 | | |
| R-36 | Trailing-slash form in the sitemap matches what Pages serves (no 301 hops) | `curl -sI` a few `<loc>`s → 200 | | |
| R-37 | Random sample of 10 `<loc>`s | All 200 | | |
| R-38 | robots.txt `Sitemap:` line | Absolute URL to `/agentive/sitemap.xml` | | |
| R-39 | /bookmarks has `<meta name="robots" content="noindex">` (if that was the intent) | Present | | |
| R-40 | Detail pages have `<link rel="alternate" hreflang>` in `<head>` as well (if implemented) | Consistent with the sitemap | | |

### 2e. Existing functionality

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-41 | Bookmark an agent, reload, open /bookmarks | Bookmark persists and shows | | |
| R-42 | Remove a bookmark from /bookmarks | Removed; empty state shows | | |
| R-43 | Bookmarks shared across /en and /ko (or separate, as designed) | Behavior as designed | | |
| R-44 | Private/incognito window (Safari private in particular) | Bookmark button doesn't throw; page still works | | |
| R-45 | Each of the 7 filter groups, alone and combined with search | Correct results; counts add up | | |
| R-46 | Browser back/forward after filtering | Restores the previous filter state | | |
| R-47 | Internal links on home, cards, workflows | No link drops the `/agentive` base path | | |
| R-48 | Deep-link reload on a detail page (hit refresh) | Loads (static HTML exists), not a 404 | | |
| R-49 | Keyboard: Tab through the filters, toggle, and copy button; Enter/Space activate them | Works, focus visible | | |
| R-50 | Lighthouse (mobile) on /en/agents and one detail page | No big regression vs last release (note scores) | | |

## 3. Device / browser matrix

Minimum per cell: home → /agents (search + one filter + installable toggle) → detail page (copy curl, open one kit file, bookmark) → /bookmarks. Do each cell in **/en and /ko**.

| Platform | Browser | /en | /ko | Result | Notes |
|----------|---------|-----|-----|--------|-------|
| macOS | Chrome latest | | | | |
| macOS | Safari latest | | | | |
| macOS | Firefox latest | | | | |
| Windows 11 | Chrome latest | | | | |
| Windows 11 | Firefox latest | | | | |
| Windows 11 | Edge latest (optional, Chromium) | | | | |
| iPhone 13 mini, iOS 17+ | Safari (375px) | | | | |
| Pixel 7 | Chrome | | | | |

Mobile-specific checks (375px is the risky width):

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| D-1 | /ko cards at 375px: Korean status/difficulty badges | No overflow, clipping, or chip wrapping mid-word; card height sensible | | |
| D-2 | /ko filter chips and group headings at 375px | Wrap cleanly; no horizontal page scroll | | |
| D-3 | Curl command block at 375px | Scrolls horizontally inside its box (or wraps) without widening the page | | |
| D-4 | Copy button on iOS Safari | Copies (clipboard API needs a user gesture); "copied" feedback shows | | |
| D-5 | Tap a kit file link on iOS | Opens or offers download; `.mdc` doesn't dead-end | | |
| D-6 | Filter panel open/close on mobile, and "Clear all" reachable | Usable with one thumb; no layout jump | | |
| D-7 | Rotate to landscape on both phones | Layout holds | | |
| D-8 | Text zoom 200% / iOS larger text on /ko detail | Nothing overlaps | | |

Terminal matrix for the curl command:

| ID | Environment | Command | Expected | Result | Notes |
|----|-------------|---------|----------|--------|-------|
| T-1 | macOS zsh (system curl) | Command as shown | 7 files, exit 0 | | |
| T-2 | Ubuntu 20.04 bash, curl 7.68 | Command as shown | 7 files, exit 0; confirms the `--output-dir` removal | | |
| T-3 | Windows 11, **PowerShell 7** | Command as shown, but with `curl.exe` | Record the result. `&&` works in PS 7; `( cd … )` is **not** a subshell in PowerShell, so your cwd stays in the kit folder afterwards | | |
| T-4 | Windows 11, **Windows PowerShell 5.1** (the default) | Command as shown | Expect failure: `&&` is a parse error in 5.1, and bare `curl` is an alias for `Invoke-WebRequest`. If it fails, the page needs a PowerShell variant (below) or a "macOS/Linux" label | | |
| T-5 | Windows, PowerShell variant (if you add one) | See below | 7 files, exit 0 | | |
| T-6 | Brace globbing | In every env above, check that **curl** (not the shell) expanded `{…}`: all 7 files present, none named literally `{AGENTS.md,...}` | | | |

## 4. Content checks

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| C-1 | Number of installable agents in the UI = number of `/kits/<slug>/` folders = 20 | All three agree | | |
| C-2 | Every installable agent's kit README/AGENTS.md names the right agent (spot-check 5 for copy-paste errors) | Correct name/slug | | |
| C-3 | Kit files have no build placeholders (`undefined`, `[object Object]`, `{{`, `TODO`) | `grep` across downloaded kits is clean | | |
| C-4 | RUNBOOK.md / EVALUATION.md reflect current status and sample-run count | Consistent with the page | | |
| C-5 | Tested/Expert agents: sample runs shown on the page ≥ 2 | Consistent with check:data | | |
| C-6 | No agent page claims "tested" in its prose while the badge says Unverified | Clean (search built HTML for "tested") | | |
| C-7 | /ko: sweep of leftover English UI strings on home, agents, detail, install, workflows, bookmarks | List every leftover with a screenshot (agent **content** in English is fine if that's intended; UI chrome is not) | | |
| C-8 | Korean terminology is consistent (the same English term → the same Korean term on badges, filters, and detail) | Consistent | | |
| C-9 | Korean typos / awkward machine translation in badges and filters (native-speaker read) | Reviewed | | |
| C-10 | Filter option labels and counts match between /en and /ko | Same numbers | | |
| C-11 | Install page instructions match the new curl command (no leftover `--output-dir`) | Consistent | | |
| C-12 | Search Console: sitemap submitted/resubmitted for the `/agentive/` property | Accepted, no parse errors | | |
| C-13 | Release notes / announcement text: 20 installable, 61 lowered to unverified, KO translation, sitemap | Numbers match what you observed | | |

## Sign-off

- [ ] Smoke all ✅
- [ ] No open ❌ at severity "blocker" (broken kit download, wrong status badge, /ko page crash, broken base path)
- [ ] Known ⚠️ items logged as follow-up issues: #…
- [ ] Announce posted: <link> · time: <time>
```

---

### Helpers

**Kit URL + content-type sweep (R-1 to R-4).** Put the 20 slugs in `slugs.txt`, one per line:

```bash
BASE="https://yohan-work.github.io/agentive/kits"
FILES="AGENTS.md CLAUDE.md cursor-rule.mdc agent.json README.md RUNBOOK.md EVALUATION.md"
while read -r slug; do
  for f in $FILES; do
    printf '%s/%s\t' "$slug" "$f"
    curl -s -o /dev/null -w '%{http_code}\t%{content_type}\t%{size_download}\n' "$BASE/$slug/$f?qa=$(date +%s)"
  done
done < slugs.txt | tee kit-check.tsv
# Anything that isn't 200, or has size 0:
awk -F'\t' '$2!=200 || $4==0' kit-check.tsv
```

**Sitemap URL sweep (R-37):**

```bash
curl -s https://yohan-work.github.io/agentive/sitemap.xml \
  | grep -o '<loc>[^<]*' | sed 's/<loc>//' \
  | xargs -n1 -P8 curl -s -o /dev/null -w '%{http_code} %{url_effective}\n' \
  | grep -v '^200' || echo "all 200"
```

**PowerShell variant to test (T-5), and to offer on the page if T-4 fails.** It works on both 5.1 and 7:

```powershell
$slug = "<slug>"
New-Item -ItemType Directory -Force -Path "agent-kits\$slug" | Out-Null
Push-Location "agent-kits\$slug"
curl.exe -fsSL --remote-name-all "https://yohan-work.github.io/agentive/kits/$slug/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}"
Pop-Location
```

(curl.exe does its own `{…}` globbing, so brace expansion isn't a PowerShell problem as long as you call `curl.exe` and not `curl`. The real PowerShell problems are the `curl` alias, `&&` in 5.1, and the `( cd … )` subshell idiom.)

### What I'd treat as release blockers
1. Any kit file returning 404, 0 bytes, or an HTML page saved as a kit file.
2. The curl command failing on Ubuntu 20.04 / curl 7.68. That was the whole point of #13's change.
3. Any card or detail page still showing "Tested" for one of the 61 lowered agents, or a kit's `agent.json` disagreeing with the page.
4. /ko pages crashing, or links dropping the `/agentive` base path.

Everything else (a few leftover English strings, badge overflow at 375px, `.mdc` content type, the Windows PowerShell 5.1 command) can ship with a follow-up issue, as long as you log it before announcing.
