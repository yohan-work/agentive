# Release QA checklist: Agent Archive, this week's deploy (#13, #14, #15, #16, #17, #19)

**Target:** Pages deployment of `main` at `https://yohan-work.github.io/agentive/`
**Commit SHA under test:** `________` (copy from the Pages deploy run; every result below applies only to this SHA)
**Tester / date:** `________`

Fill the **P/F** column with `P` or `F`. Put the failure details in **Notes**. Any `F` in Smoke blocks the announcement until the release owner decides.

Shared variable for every script below (bash or zsh):

```bash
BASE="https://yohan-work.github.io/agentive"
```

`slugs.txt` = the 20 project-ready slugs, one per line. Copy them from `/en/agents/` with the installable-only toggle on, and confirm the toggle shows exactly 20.

---

## 1. Smoke checks (run first, in this order)

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| S-01 | Open the Actions run for the Pages deploy. Compare its SHA with `main` HEAD. | The deploy finished for the same SHA as `main` HEAD. CI (check:data, lint, typecheck, test, build) is green for that SHA. | | |
| S-02 | Open `$BASE/` in a private window. | Redirects to `$BASE/en/`. The URL keeps the `/agentive/` prefix, and the page is not a GitHub 404. | | |
| S-03 | Open `$BASE/en/` and `$BASE/ko/`. Keep DevTools Console open. | Both render. `/ko/` shows Korean UI. No red console errors, and no 404s in the Network tab. | | |
| S-04 | Open `$BASE/en/agents/`. | 100 cards are shown. Turning the installable-only toggle on shows 20 cards. | | |
| S-05 | Open one project-ready agent detail page, e.g. the first slug in `slugs.txt`. | The Download Kit button, the curl command, 7 per-file links, and the bookmark button are all present. | | |
| S-06 | On macOS zsh, paste the curl command copied from S-05 into an empty directory. | Exit code 0 (`echo $?`). `agent-kits/<slug>/` contains exactly the 7 files, and none are 0 bytes. | | |
| S-07 | `curl -sI "$BASE/kits/<slug>/agent.json"` | `HTTP/2 200`. Write the `content-type` value in Notes; R-A04 checks it in depth. | | |
| S-08 | `curl -sI "$BASE/sitemap.xml"` and `curl -sI "$BASE/robots.txt"` | Both return 200. | | |
| S-09 | Open one agent that #14 lowered from "tested" in both `/en` and `/ko`. | The badge shows the unverified status in both locales, with no "Tested" and no Korean equivalent of Tested. | | |

---

## 2. Regression checks (ordered by risk)

### A. Install kits: `/kits/*`, curl command, Download Kit, per-file links (#13)

**Script A: every kit file for all 20 agents** (save as `kit-check.sh` and run with `bash kit-check.sh`. It uses bash arrays, so do not run it with `sh` or paste it into zsh.)

```bash
#!/usr/bin/env bash
BASE="https://yohan-work.github.io/agentive"
FILES=(AGENTS.md CLAUDE.md cursor-rule.mdc agent.json README.md RUNBOOK.md EVALUATION.md)
tmp=$(mktemp)
printf 'slug\tfile\tstatus\tcontent_type\tbytes\n'
while read -r slug; do
  [ -z "$slug" ] && continue
  for f in "${FILES[@]}"; do
    meta=$(curl -s -o "$tmp" -w '%{http_code}\t%{content_type}\t%{size_download}' "$BASE/kits/$slug/$f")
    printf '%s\t%s\t%s\n' "$slug" "$f" "$meta"
    # A GitHub Pages 404 or an HTML shell served in place of a kit file starts with "<!DOCTYPE" or "<html"
    if head -c 200 "$tmp" | grep -qi '<!doctype\|<html'; then echo "  !! $slug/$f looks like HTML, not a kit file"; fi
  done
  if curl -fsS "$BASE/kits/$slug/agent.json" | python3 -m json.tool > /dev/null 2>&1; then
    echo "  ok $slug/agent.json parses as JSON"
  else
    echo "  !! $slug/agent.json missing or not valid JSON"
  fi
done < slugs.txt
rm -f "$tmp"
```

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-A01 | Run Script A. | 140 rows (20 × 7), every status `200`, every byte count > 0, no `!!` lines. | | |
| R-A02 | From Script A output, check that each `agent.json` parses. | 20 × "parses as JSON". | | |
| R-A03 | Open `agent.json` for 2 agents and compare its fields (name, status, and so on) with the agent's detail page. | They match. In particular, the status field (if present) matches the badge after #14 and is not a stale `tested`. | | |
| R-A04 | **Content types.** From the Script A output, list the `content_type` for `.md`, `.mdc`, and `.json`. | Record the actual values. Expected for `agent.json`: `application/json`. If it is served as text, curl downloads are not affected, but browser display and any tool that checks the type may be, so the release owner decides. For `.md`/`.mdc`, verify what the browser does in R-A08; there is no confirmed expected value to assert here. | | |
| R-A05 | **Charset.** For any kit file that contains non-ASCII characters, check that `content_type` includes `charset=utf-8`, or open the file in Chrome and Safari. | No mojibake (for example `â€™` in place of `'`). | | |
| R-A06 | **Ubuntu 20.04 bash, curl 7.68.** Run `curl --version` (expect 7.68.x). Then paste the page's curl command in an empty directory. | Exit code 0. 7 files, none empty. No `option --output-dir: is unknown` error, which would mean an old command is still deployed or cached. | | |
| R-A07 | **Subshell side effect**, on macOS zsh and Ubuntu bash: run `pwd` before and after the one-liner. | `pwd` is unchanged, because the `( cd … )` runs in a subshell. | | |
| R-A08 | **Windows PowerShell.** First run `$PSVersionTable.PSVersion` and `Get-Command curl` and record both. Then paste the page's one-liner as-is. | Record exactly what happens. Things to look for: in Windows PowerShell 5.1, `&&` is not a valid statement separator, so expect a parse error. `curl` may resolve to the `Invoke-WebRequest` alias rather than `curl.exe`, which would make `-fsSL` fail. `( … )` does not create a subshell, so `cd` may persist. If the page offers no Windows-specific command, the release owner decides whether to ship with this documented as a limitation. | | |
| R-A09 | **PowerShell with curl.exe directly** (checks the brace risk on its own): see the block below this table. | Verify: 7 files in `agent-kits\<slug>`, none 0 bytes. The braces sit inside a double-quoted string, which PowerShell does not expand, so curl's own URL globbing handles them. If only one file, or a file literally named with `{`, is created, globbing did not happen. | | |
| R-A10 | On each supported desktop browser, click each of the 7 per-file links on one detail page. | Every link resolves under `$BASE/kits/<slug>/…` with the `/agentive/` prefix (a missing base path gives a 404). Record whether each file opens inline or downloads. `.mdc` and `.md` must not download as an unnamed file or with a changed extension (for example `cursor-rule.mdc.txt`). | | |
| R-A11 | Click Download Kit (desktop Chrome, Safari, Firefox). | Verify what it produces (a zip or separate files). Its contents must match the same 7 files from R-A01, byte-for-byte on at least 1 agent (`diff -r`). | | |
| R-A12 | Click Download Kit on iOS Safari (iPhone 13 mini) and on Android Chrome (Pixel 7). | Record the behavior: a download prompt, a Files entry, or opening in a tab. No blank page and no error. | | |
| R-A13 | Click the curl command's copy button (if there is one) on every browser in the matrix, then paste it into a text editor. | The pasted text matches what the page shows, character for character, with the `<slug>` filled in. No smart quotes (`“ ”`) and no inserted line breaks. | | |
| R-A14 | Open a detail page for an agent that is **not** project-ready. | No curl command and no Download Kit, or whatever the intended behavior is (the request does not say, so confirm with the owner). No link on the page points to a missing `/kits/` path. | | |

Block for R-A09 (Windows PowerShell):

```powershell
$slug = "<slug>"
New-Item -ItemType Directory -Force "agent-kits\$slug" | Out-Null
Push-Location "agent-kits\$slug"
curl.exe -fsSL --remote-name-all "https://yohan-work.github.io/agentive/kits/$slug/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}"
Pop-Location
Get-ChildItem "agent-kits\$slug" | Select-Object Name, Length
```

### B. Verification status badges (#14)

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-B01 | Get the expected number of agents per status (tested / expert / unverified / …) from the data at the release SHA. On `/en/agents/`, apply each status filter one at a time. | The count for each filter equals the data count. The "tested" count dropped by 61 compared with the previous release. | | |
| R-B02 | Repeat R-B01 on `/ko/agents/`. | Same counts as `/en`, with Korean labels. | | |
| R-B03 | For 3 of the 61 downgraded agents, check the badge on the card, the detail page, `/bookmarks` (after bookmarking), and any `/workflows/<slug>` page that lists the agent. | The unverified status appears in every location, in both locales. | | |
| R-B04 | **Stale bookmark data.** Bookmark a downgraded agent on the *previous* production build if you still have a browser profile with one; otherwise skip and note it. Then open `/bookmarks` on the new build. | The badge shows the current status, not a status saved when the bookmark was made. | | |
| R-B05 | Every remaining "tested" or "expert" agent: open its detail page. | It has ≥ 2 sample runs shown (or whatever the page shows for runs), consistent with the new check:data rule. | | |
| R-B06 | **check:data rule** (local, on the release SHA): set one agent with fewer than 2 sample runs to `tested`, then run check:data (for example `npm run check:data`). Revert afterwards. | check:data exits non-zero and names that agent. | | |
| R-B07 | Search for "Tested" (and its Korean label) with Cmd/Ctrl+F on `/en/agents/` and `/ko/agents/` with no filters. | Only agents counted as tested in R-B01 show it. Filter labels are expected to match. | | |

### C. Korean translation (#15, #19)

Console snippet for R-C01 and R-C02: it lists text on the page that has Latin letters but no Hangul. Paste it into DevTools on a `/ko` page.

```js
const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const out = new Set(); let n;
while ((n = w.nextNode())) {
  const t = n.textContent.trim();
  if (t && /[A-Za-z]{2,}/.test(t) && !/[가-힣]/.test(t)) out.add(t);
}
console.log([...out].join('\n'));
```

Overflow snippet for R-C05 and R-C06: it lists elements that extend past the viewport.

```js
console.log('page h-scroll:', document.documentElement.scrollWidth > document.documentElement.clientWidth);
[...document.querySelectorAll('body *')]
  .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
  .forEach(e => console.log(e.tagName, e.className, JSON.stringify(e.textContent.trim().slice(0, 40))));
```

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-C01 | Run the text snippet on `/ko/agents/<slug>/` for 1 project-ready and 1 non-project-ready agent. | Every UI label is Korean: section headings, button labels (Download Kit, bookmark, copy), status and difficulty badges. English that remains should be only agent-authored content, file names, the curl command, and product names. List every English UI label as a failure. | | |
| R-C02 | Run the text snippet on `/ko/agents/` with the search panel open. | Filter group titles, filter options, result count text, "Clear all", the installable-only toggle label, and the empty-state text are Korean. | | |
| R-C03 | On `/ko/agents/`: apply 2 filters, then click the Korean "Clear all". | All filters reset and the count returns to 100. | | |
| R-C04 | On `/ko/agents/`, combine filters to reach 0 results. | The empty state is in Korean, and the count reads 0 in Korean formatting. | | |
| R-C05 | On iPhone 13 mini (375px), and first in Chrome DevTools at 375px as a pre-check: run the overflow snippet on `/ko/agents/`, open the filter panel, and check every chip. | `page h-scroll: false`. No badge or chip text is clipped, truncated without an ellipsis, or wrapped so the pill breaks into two lines. Check the longest status and difficulty labels specifically. | | |
| R-C06 | Repeat R-C05 on `/ko/agents/<slug>/` (the badge row and the button row), `/ko/`, `/ko/bookmarks/`, and one `/ko/workflows/<slug>/`. | Same as R-C05. | | |
| R-C07 | Run `document.documentElement.lang` on `/ko/agents/` and on `/en/agents/`. | Record the values. `ko` and `en` are expected. A `/ko` page reporting `en` is a failure to confirm with the owner, because the request adds ko hreflang. | | |
| R-C08 | From `/ko/agents/<slug>/`, switch locale to en, then switch back. | You land on the same agent in the other locale, not on home. The `/agentive/` prefix is kept. | | |

### D. sitemap.xml and robots.txt (#16)

**Script D**

```bash
curl -fsS "$BASE/sitemap.xml" -o sitemap.xml && echo "fetched"
xmllint --noout sitemap.xml && echo "well-formed XML"
echo "loc count: $(grep -o '<loc>' sitemap.xml | wc -l)"
echo "ko hreflang count: $(grep -o 'hreflang="ko"' sitemap.xml | wc -l)"
echo "en hreflang count: $(grep -o 'hreflang="en"' sitemap.xml | wc -l)"
echo "--- bookmarks entries (expect none):"; grep -n 'bookmarks' sitemap.xml
echo "--- URLs outside $BASE/ (expect none):"
grep -o '<loc>[^<]*' sitemap.xml | sed 's/<loc>//' | grep -v "^$BASE/"
grep -o 'href="[^"]*"' sitemap.xml | sed 's/href="//; s/"$//' | grep -v "^$BASE/"
echo "--- non-200 URLs (expect none):"
{ grep -o '<loc>[^<]*' sitemap.xml | sed 's/<loc>//'; grep -o 'href="[^"]*"' sitemap.xml | sed 's/href="//; s/"$//'; } \
  | sort -u | while read -r u; do
      code=$(curl -s -o /dev/null -w '%{http_code}' "$u"); [ "$code" != "200" ] && echo "$code $u"
    done
curl -fsS "$BASE/robots.txt"
```

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-D01 | Run Script D. | Fetched and well-formed. | | |
| R-D02 | Check the "URLs outside $BASE/" section. | Empty. Every `<loc>` and every hreflang `href` is absolute and includes `/agentive/`. | | |
| R-D03 | Check the "non-200" section. | Empty. A `301` means the sitemap URL differs from the served URL (usually a trailing slash), and a `404` means a broken URL. | | |
| R-D04 | Check the "bookmarks entries" section. | Empty, in both en and ko. | | |
| R-D05 | Compare the loc count with the page count. | The count covers en + ko for home, `/agents`, all 100 agent details, `/install`, and every workflow. That means at least 200 agent-detail URLs. Write the actual number in Notes. | | |
| R-D06 | Open 1 agent's entry in sitemap.xml. | It has alternates for both `en` and `ko`, and each points to the same agent in that locale. | | |
| R-D07 | Read the robots.txt output. | It allows crawling, has a `Sitemap:` line with the absolute URL `$BASE/sitemap.xml`, and excludes bookmarks if that was the intent. | | |
| R-D08 | **Scope note to decide on, not a pass/fail check:** crawlers read robots.txt only at the host root (`https://yohan-work.github.io/robots.txt`), not at `/agentive/robots.txt`. | Owner confirms whether the `/agentive/robots.txt` rules are expected to have any effect. If not, the sitemap must be submitted directly (for example in Search Console). | | |

### E. /agents search and filters (surface touched by #19)

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-E01 | On `/en/agents/`, open each of the 7 filter groups and apply one option at a time. | The card count updates, and the displayed count equals the number of cards rendered. | | |
| R-E02 | Combine the installable-only toggle with a text search that matches a project-ready agent. | Only project-ready matches show. Turning the toggle off restores the non-project-ready matches. | | |
| R-E03 | Apply filters, reload the page, and use browser Back/Forward. | Verify and record whether filter state is kept (the request does not specify). No console errors and no blank list. | | |
| R-E04 | On `/en/agents/`, apply filters, then click "Clear all". | Count returns to 100. | | |

### F. Bookmarks

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| R-F01 | Bookmark 2 agents from their detail pages, open `/en/bookmarks/`, then `/ko/bookmarks/`. | Both agents are listed in both locales, with current badges and Korean card UI on `/ko`. | | |
| R-F02 | Reload, then remove one bookmark. | The list persists after reload, and removal updates the list. | | |

---

## 3. Device and environment matrix

Mark each cell `P`, `F`, or `N/A`. Safari is not available on Windows 11, so that row is omitted.

| Environment | S-03 home en/ko | S-04 / R-E01 agents + filters | R-A10 per-file links | R-A11/12 Download Kit | R-A13 copy curl | R-C05/06 ko at 375px | R-F01 bookmarks |
|---|---|---|---|---|---|---|---|
| Chrome latest, macOS | | | | | | N/A | |
| Safari latest, macOS | | | | | | N/A | |
| Firefox latest, macOS | | | | | | N/A | |
| Chrome latest, Windows 11 | | | | | | N/A | |
| Firefox latest, Windows 11 | | | | | | N/A | |
| iOS Safari 17+, iPhone 13 mini (375px) | | | | | | | |
| Android Chrome, Pixel 7 | | | | | | | |

Terminal matrix for the curl command:

| Terminal | Version recorded | Page one-liner as-is (S-06 / R-A06 / R-A08) | 7 files, none empty | `pwd` unchanged (R-A07) | curl.exe direct (R-A09) |
|---|---|---|---|---|---|
| macOS zsh | `curl --version`: ____ | | | | N/A |
| Ubuntu 20.04 bash | `curl --version`: 7.68.__ | | | | N/A |
| Windows PowerShell | `$PSVersionTable`: ____ | | | N/A | |

---

## 4. Content checks

| ID | Steps | Expected result | P/F | Notes |
|---|---|---|---|---|
| C-01 | On a detail page, read the curl command text. | The URL is `https://yohan-work.github.io/agentive/kits/<slug>/{…}`, the slug matches the page, all 7 file names are spelled exactly as in #13, and there is no `--output-dir`. | | |
| C-02 | Per-file link labels. | Each label matches its target file name. | | |
| C-03 | Counts shown to users. | 100 agents on `/agents` in en and ko, and 20 with installable-only on. Any "N agents" text on home or `/install` matches these numbers. | | |
| C-04 | Status wording. | The same status has the same label on cards, the detail page, and filters within a locale. The Korean status and difficulty labels are the same everywhere they appear. | | |
| C-05 | `/install` page. | Every command and URL shown uses the `/agentive/` base path, and its links resolve (200). | | |
| C-06 | Link sweep (optional script): on `/en/` and `/ko/`, run `[...document.links].map(a => a.href).filter(h => h.includes('yohan-work.github.io') && !h.includes('/agentive/'))` in the console. | Empty array (no internal link loses the base path). | | |
| C-07 | Kit README.md and EVALUATION.md for 2 downgraded project-ready agents, if any are among the 20. | No text in them claims "tested" when the page now shows unverified. | | |

---

## If time allows

- #17 unit tests: no user-facing change; confirm they ran in the CI job from S-01.
- `/en/install` and `/ko/install`: one pass for layout at 375px.
- Keyboard-only: tab through the filter panel and the Download Kit button once.
- Custom 404: open `$BASE/en/agents/does-not-exist/` and confirm a 404 page, not a blank screen.
- Rollback: write down the previous good deploy SHA before announcing, since there is no staging.

---

**Sign-off:** The release owner decides whether to announce after reviewing the failures and Notes above. This checklist does not certify the release.
