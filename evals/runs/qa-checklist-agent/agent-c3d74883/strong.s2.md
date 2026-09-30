# Release QA: Agent Archive, this week's deploy (#13–#19)

Target: the GitHub Pages deploy of `main` after CI goes green. Base URL used below: `BASE=https://yohan-work.github.io/agentive`
Run the Smoke checks first. If any smoke check fails, stop and don't announce.
Checks are ordered by risk inside each section. Leave the Pass/Fail cell empty until someone has actually run the check. Put notes and error text in the Notes column.

> Before you start: confirm the Pages deployment is the build you mean to ship. Actions → the latest "pages build and deployment" (or your deploy workflow) run → its commit SHA should match `git rev-parse origin/main`. GitHub Pages responses may be cached for a few minutes. If something looks stale, re-check with a cache-busting query (`?qa=1`) or wait, and write down which one you did.

---

## 1. Smoke checks (must pass before anything else)

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| S1 | Check the deployed commit SHA as described above | Deployed SHA = `main` HEAD, and all CI checks on that commit are green | | |
| S2 | macOS zsh: open one installable agent page, copy the curl one-liner exactly as shown, and run it in an empty dir | Exit code `0` (`echo $?`). `agent-kits/<slug>/` contains exactly 7 files: AGENTS.md, CLAUDE.md, cursor-rule.mdc, agent.json, README.md, RUNBOOK.md, EVALUATION.md. None is empty or an HTML 404 page (`head -3` each) | | |
| S3 | `curl -fsS "$BASE/kits/<slug>/agent.json" \| python3 -m json.tool > /dev/null && echo OK` | Prints `OK` (HTTP 200 and valid JSON) | | |
| S4 | Open `$BASE/en/agents/` in desktop Chrome | Page loads and 100 cards are shown. Turning on the installable-only toggle shows 20 | | |
| S5 | Open `/ko/agents/` and one `/ko/agents/<slug>/` | Detail page, badges, cards, and search panel are in Korean. No blank or broken layout | | |
| S6 | Open the detail page of an agent that #14 lowered to unverified (pick one from the PR diff) | Badge shows unverified (EN) or its Korean equivalent (KO). Not "Tested" | | |
| S7 | `curl -sI "$BASE/sitemap.xml"` and `curl -sI "$BASE/robots.txt"` | Both return `200` | | |
| S8 | Browser console on /en home, /ko home, /agents, and one detail page | No uncaught errors and no failed asset requests (404 on `_next/*`) | | |

---

## 2. Regression checks, by affected surface (highest risk first)

### 2.1 `/kits/*`: install kit files (#13). Risk: content types, missing files, wrong set of agents

**Scripted check: all 20 kits × 7 files.** Put the 20 installable slugs into `slugs.txt`, one per line. Take them from `/en/agents/` with the installable-only toggle on, and confirm the count is 20 with `wc -l slugs.txt`.

```bash
#!/usr/bin/env bash
BASE="https://yohan-work.github.io/agentive"
FILES="AGENTS.md CLAUDE.md cursor-rule.mdc agent.json README.md RUNBOOK.md EVALUATION.md"
: > kit-report.txt
while read -r slug; do
  [ -z "$slug" ] && continue
  for f in $FILES; do
    r=$(curl -s -o /dev/null -w '%{http_code}|%{content_type}|%{size_download}' "$BASE/kits/$slug/$f")
    echo "$slug|$f|$r" >> kit-report.txt
  done
done < slugs.txt

echo "rows (expect 140):"; wc -l < kit-report.txt
echo "FAILURES (non-200 or 0 bytes), expect none:"
awk -F'|' '$3!="200" || $5==0' kit-report.txt
echo "Content types seen per file type:"
awk -F'|' '{print $2" -> "$4}' kit-report.txt | sort | uniq -c
```

(No `-L`, so a redirect shows up as 301/302 and counts as a failure to look at.)

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| K1 | Run the script above | 140 rows. The FAILURES list is empty | | |
| K2 | Look at the "content types" output for `agent.json` | Record the type. Verify it is `application/json`. If it is `text/plain` or anything else, log it and decide whether that blocks the release (curl doesn't care, but browsers and tools might) | | |
| K3 | Same, for `.md` and `.mdc` | Record the types. Check that the header includes a UTF-8 charset (or that the next check shows no mojibake). `.mdc` may come back as `application/octet-stream`; record it rather than assume | | |
| K4 | JSON validity of all 20: `while read s; do curl -fsS "$BASE/kits/$s/agent.json" \| python3 -m json.tool >/dev/null \|\| echo "BAD $s"; done < slugs.txt` | No `BAD` lines | | |
| K5 | Negative test: pick 2 agents that are **not** installable and request `curl -s -o /dev/null -w '%{http_code}\n' "$BASE/kits/<non-installable-slug>/AGENTS.md"` | `404`. No kit is served for an agent that isn't project-ready | | |
| K6 | Kit status data vs #14: download all kits (run the one-liner per slug, or a loop), then `grep -ril "tested" agent-kits/` | Every hit must belong to an agent whose current verifiedStatus is tested/expert. No kit file, such as agent.json or EVALUATION.md, still says "tested" for an agent that #14 lowered | | |
| K7 | For 2 slugs, compare the curl download with the browser per-file download: `shasum` on both copies of each file | Hashes match | | |

### 2.2 The curl one-liner, per terminal (#13). Risk: PowerShell, old curl, brace handling

Note on braces: in the command, the `{AGENTS.md,...}` list is inside double quotes, so zsh and bash should pass it through unexpanded. The expansion is done by **curl's own URL globbing**. PowerShell should also pass the braces through literally inside double quotes. That means the real PowerShell risks are probably elsewhere (`curl` alias, `&&`, `mkdir -p`, `( cd … )`). Verify each one below instead of assuming.

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| T1 | On the agent page, check the full command text | It lists all 7 file names in the braces, uses `$BASE/kits/<slug>/` with the correct slug and `https`, and contains no `--output-dir` | | |
| T2 | Click the copy control (if the page has one) and paste into a plain text editor | Pasted text is byte-identical to what's displayed: straight quotes `"` (not `“ ”`), no line breaks, no leading `$ ` | | |
| T3 | **Ubuntu 20.04 bash, curl 7.68.** Real machine, or `docker run --rm -it ubuntu:20.04 bash`, then `apt-get update && apt-get install -y curl && curl --version` | `curl --version` shows 7.68.x. Pasting the page's command gives exit `0` and the 7 non-empty files | | |
| T4 | Ubuntu 20.04: run the command with a made-up slug (`does-not-exist`) | Non-zero exit code (`-f` should fail on the 404). No 404 HTML is saved as `AGENTS.md` etc. Record what, if anything, is left in the directory | | |
| T5 | macOS zsh: run the command twice in the same directory | Second run also exits `0` and the files are still correct. Record whether files are overwritten | | |
| T6 | **Windows PowerShell 5.1** (`powershell.exe`, record `$PSVersionTable.PSVersion`): paste the command verbatim | Record the exact result. Things to watch for: `&&` rejected as a parse error; `curl` resolving to `Invoke-WebRequest` instead of `curl.exe` (`Get-Command curl`); `mkdir -p` failing or behaving differently; `(cd … )` changing your current directory permanently; files landing in the wrong folder. Expected per the release: 7 files in `agent-kits\<slug>\`. Anything else is a FAIL with the error pasted | | |
| T7 | **PowerShell 7** (`pwsh`), if in scope: same as T6 | Same as T6. Note separately which parts behave differently from 5.1 | | |
| T8 | Windows: `curl.exe --version` | Record the version. If T6 fails only because of the `curl` alias, retry with `curl.exe` swapped in and record whether that works. This tells you what a Windows-specific instruction would need to say | | |
| T9 | Decision (release owner) | If T6/T7 fail: either the page gets a Windows alternative before announce, or the known issue is documented in the announcement. Write down which one was chosen | | |

### 2.3 `/agents/<slug>`: detail page (#13, #14, #15/#19)

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| D1 | Installable agent: click **Download Kit** in Chrome, Safari, and Firefox (macOS) | Record what gets downloaded (one archive or several files). Its contents must be the same 7 files as `/kits/<slug>/`. No 404 and no blocked download prompt | | |
| D2 | Click each of the 7 per-file links | Each opens or downloads the right file from `$BASE/kits/<slug>/<file>` (check the address bar or download URL includes `/agentive/`). Non-ASCII text renders without mojibake. Record per browser whether `.mdc` displays or downloads | | |
| D3 | Non-installable agent detail page | No curl command, Download Kit button, or per-file links are shown, or whatever the intended non-installable state is. **Verify with the owner**, because the request doesn't specify it. There must be no broken links | | |
| D4 | Status badge on 5 agents lowered by #14 (EN + KO) | Shows unverified / its KO equivalent. Never "Tested" | | |
| D5 | Status badge on every agent still tested/expert in data | Badge matches data. Per #14, each of these must have ≥ 2 sample runs (spot-check 2 against the data) | | |
| D6 | Bookmark button: toggle on, reload, open `/bookmarks`; then toggle off | Record the behavior: state survives reload, the agent appears in and disappears from `/bookmarks`. Check the same on `/ko/` | | |
| D7 | Switch EN ↔ KO on a detail page | You land on the same agent in the other locale (not home, not 404) | | |

### 2.4 `/agents`: list, search, filters (#15/#19)

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| A1 | `/en/agents/` and `/ko/agents/` with no filters | 100 cards in both locales, and the count label says 100 | | |
| A2 | Installable-only toggle (EN + KO) | 20 cards, and the count label matches the number of cards shown. These 20 slugs are the same as `slugs.txt` | | |
| A3 | Apply one option in each of the 7 filter groups, one at a time (EN + KO) | Count label = cards shown every time. Same counts in EN and KO for the same filter | | |
| A4 | Combine 2–3 filters + a search term, then click **Clear all** / its KO label | Everything is cleared (filters, toggle, and search box, if "Clear all" is meant to cover it; verify the intended scope). The list goes back to 100 | | |
| A5 | Status filter: select "Tested" (or KO equivalent) | Only agents that still have tested status in data. None of the 61 lowered agents appear | | |
| A6 | KO search: type a Korean term and an English agent name | Results make sense for both; record what matches. No crash or empty state from typing Hangul (IME composition) | | |
| A7 | Empty-results state (EN + KO) | Message is shown in the right language, and "Clear all" recovers | | |

### 2.5 `/sitemap.xml` and `/robots.txt` (#16)

```bash
BASE="https://yohan-work.github.io/agentive"
curl -s "$BASE/sitemap.xml" > sitemap.xml
grep -o '<loc>[^<]*</loc>' sitemap.xml | sed 's/<[^>]*>//g' > locs.txt
wc -l < locs.txt                                   # record
grep -c '/en/' locs.txt; grep -c '/ko/' locs.txt   # expect equal
grep -v "^$BASE/" locs.txt                         # expect empty (wrong host/base path)
grep -i bookmarks locs.txt sitemap.xml             # expect empty
grep -c 'hreflang="en"' sitemap.xml; grep -c 'hreflang="ko"' sitemap.xml   # record, compare
while read -r u; do c=$(curl -s -o /dev/null -w '%{http_code}' "$u"); [ "$c" != 200 ] && echo "$c $u"; done < locs.txt   # expect empty
```

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| M1 | Run the script | Every `<loc>` is under `$BASE/` (includes `/agentive/`). EN and KO counts are equal. No bookmarks URL. The status loop prints nothing | | |
| M2 | Open `sitemap.xml` in a browser or an XML validator | Well-formed XML. If `xhtml:link` alternates are used, the `xhtml` namespace is declared | | |
| M3 | Pick 3 URLs and check their alternates | Each EN URL lists itself and its KO counterpart as `hreflang` alternates, and the other way round. The alternate hrefs return 200 | | |
| M4 | Page source of 3 pages (EN + KO): look for `<link rel="alternate" hreflang=…>` | If present, they match the sitemap. If absent, write it down (the sitemap alternates alone may be the intended scope) | | |
| M5 | `curl -s "$BASE/robots.txt"` | Record the contents. A `Sitemap:` line, if present, has the absolute URL `$BASE/sitemap.xml` | | |
| M6 | Note for the owner (not pass/fail) | Crawlers read robots.txt only at the host root (`https://yohan-work.github.io/robots.txt`). A file at `/agentive/robots.txt` won't be applied as crawl rules. If the bookmarks exclusion relies on a robots `Disallow`, check whether bookmarks is also excluded some other way, for example via the sitemap omission (M1) or a `noindex` meta on `/bookmarks` (check its page source) | | |

### 2.6 Home, `/install`, `/workflows/<slug>`, `/bookmarks` (shared components changed by #15/#19)

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| H1 | `/en/` and `/ko/` home | Loads. Any agent or workflow cards use the new badges and KO strings on `/ko/` | | |
| H2 | `/workflows/<slug>` (2 workflows, EN + KO) | Agent cards inside show correct status badges (no stale "Tested"). Card links resolve | | |
| H3 | `/install` (EN + KO) | Loads. If it shows install commands or kit links, they match the #13 format and resolve (run T1 on them) | | |
| H4 | `/bookmarks` with 0 and with 2 bookmarks (EN + KO) | Empty state and list render. Cards show current badges | | |

### 2.7 Internal link base path (static export on a project Pages site)

```bash
for p in en/ ko/ en/agents/ ko/agents/ en/install/ ko/install/; do
  curl -s "$BASE/$p" | grep -o 'href="/[^"]*"' | grep -v 'href="/agentive/' | sed "s|^|$p: |"
done   # expect empty
```

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| L1 | Run the loop above. If your routes don't use trailing slashes, adjust the paths to what the sitemap shows | No root-relative link is missing the `/agentive/` prefix | | |

---

## 3. Device and environment matrix

Mark each cell P/F, or N/A with a reason. Safari isn't available on Windows 11, so that cell is N/A.

**Browsers / devices**

| Check | Chrome macOS | Safari macOS | Firefox macOS | Chrome Win11 | Firefox Win11 | iOS Safari 17+ (iPhone 13 mini, 375px) | Android Chrome (Pixel 7) |
|---|---|---|---|---|---|---|---|
| S4/A1: 100 cards, installable = 20 | | | | | | | |
| A3/A4: filters + Clear all (KO) | | | | | | | |
| D1: Download Kit | | | | | | | |
| D2: per-file links, no mojibake | | | | | | | |
| D4: badges correct (EN + KO) | | | | | | | |
| D6: bookmark persists → /bookmarks | | | | | | | |
| R1–R4: KO layout, no overflow | | | | | | | |
| S8: no console errors | | | | | | N/A unless using remote debugging | N/A unless using remote debugging |

**Korean layout at 375px (known risk: overflow)**, run on the iPhone 13 mini first. Pre-check in Chrome DevTools at 375px width.

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| R1 | `/ko/agents/`: in DevTools console at 375px, run `document.documentElement.scrollWidth > window.innerWidth` | `false` (no horizontal page scroll). On a real device: swipe sideways, and the page must not move | | |
| R2 | List candidate overflowing elements: `[...document.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible').map(e => e.className)` | Review every hit: no status/difficulty badge, filter chip, or count label has text that is clipped, overlaps, or pushes past its container. Screenshot each failure | | |
| R3 | `/ko/agents/<slug>/` at 375px: badges, Download Kit button, bookmark button, curl block | Badge text fits. Buttons aren't clipped. The curl block scrolls inside its own box (or wraps) without widening the page | | |
| R4 | KO search panel at 375px: open it, apply filters, tap Clear all | All 7 groups and the toggle can be reached and tapped. Labels aren't truncated to the point of being unreadable | | |

**Terminals**

| Check | macOS zsh | Ubuntu 20.04 bash (curl 7.68) | Windows PowerShell 5.1 (curl.exe) | PowerShell 7 (if in scope) |
|---|---|---|---|---|
| Verbatim one-liner → 7 files, exit 0 (S2/T3/T6/T7) | | | | |
| Bad slug → non-zero exit (T4) | | | | |
| `curl --version` recorded | | | | |

---

## 4. Content checks

| ID | Steps | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| C1 | **Untranslated KO strings (known risk).** On `/ko/` go through: detail page (all headings, labels, buttons incl. Download Kit, bookmark, copy), status and difficulty badges, agent cards, workflow cards, search panel (7 group titles, every option, installable toggle, result count, Clear all, empty state) | No English UI string left. Log each one found with page, element, and screenshot. Agent names, file names, and the curl command stay as-is and don't count | | |
| C2 | KO count strings with 0, 1, 20, 100 results | Number and wording are grammatical, and no raw placeholder shows (`{count}`, `undefined`, `NaN`) | | |
| C3 | EN pages after #15/#19 | No Korean text and no raw translation keys (e.g. `agents.filters.clearAll`) show on `/en/` | | |
| C4 | Status label wording | Same wording for unverified/tested everywhere (card, detail, filter option) in each locale | | |
| C5 | Data shown: totals | 100 agents on /agents and 20 installable. Record the number of agents per status from the status filter, and check it against the data after #14 | | |
| C6 | curl command text on `/ko/` | Identical to `/en/` for the same slug (the command isn't translated or altered) | | |
| C7 | Kit file contents (open 2 kits) | The agent name/slug in AGENTS.md, CLAUDE.md, agent.json, and README.md match the page they came from. Status text matches the page badge (see K6) | | |
| C8 | Links in kit README.md / RUNBOOK.md (if any) | Resolve (200) and point to `$BASE/…`, not localhost or a path without `/agentive/` | | |

---

## If time allows

- Re-run the full `slugs.txt` × one-liner loop on Ubuntu 20.04 (not just one slug).
- Check that `/ko/` hreflang or `lang` attributes are correct in `<html lang>` on EN and KO pages.
- Keyboard-only: the Tab order reaches filters, Clear all, Download Kit, and bookmark.
- Firefox private window: bookmark behavior (storage may be limited).
- Social/OG preview of one `/ko/` detail URL.
- Check #17 had no user-facing effect: CI test job passed on the deployed SHA.

---

## Sign-off

| Role | Name | Result | Date |
|---|---|---|---|
| QA (browsers/devices) | | | |
| QA (terminals) | | | |
| Release owner (announce go/no-go, T9 decision) | | | |

Announce only after every Smoke check and every open FAIL has an owner decision recorded above.
