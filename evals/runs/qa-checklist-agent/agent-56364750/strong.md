# Release QA checklist: Agent Archive, this week's deploy (PRs #13–#17, #19)

**Target:** Pages preview of `main` after CI passes, at https://yohan-work.github.io/agentive/
**Build under test:** commit SHA `________` · CI run `________` · Tester `________` · Date `________`

Your request covers platform, surfaces, and devices, so I have no blocking questions. Before you start, fill in two values the request doesn't give me:
- **Slug A** (any installable agent, e.g. the first card with the installable-only toggle on): `________`
- **Slug B** (any agent that #14 moved from "tested" to "unverified"): `________`

Anything marked **[ASSUMPTION]** is my inference and not stated in the request. Confirm it or strike it.

Mark each row `[x]` for pass. If a row fails, write `FAIL:` and a short note or issue link in the Notes column.

---

## 1. Smoke checks (run first; stop and hold the announcement if any fail)

| ID | Check | Expected | Pass | Notes |
|---|---|---|---|---|
| S1 | Open `/agentive/` (root) | Redirects to `/agentive/en/`. Home renders with no blank page or console errors. | [ ] | |
| S2 | Open `/agentive/ko/` | Korean home renders. Nav and main headings are in Korean. | [ ] | |
| S3 | Open `/en/agents` | Agent list renders. Card count = **100**. | [ ] | |
| S4 | On `/en/agents`, turn on the installable-only toggle | Result count = **20**. | [ ] | |
| S5 | Open `/en/agents/<slug A>` | Detail page renders with Download Kit button, curl command, and per-file links. | [ ] | |
| S6 | Open each of the 7 kit files for slug A: `/kits/<slug A>/AGENTS.md`, `CLAUDE.md`, `cursor-rule.mdc`, `agent.json`, `README.md`, `RUNBOOK.md`, `EVALUATION.md` | All 7 return HTTP 200 with non-empty content for slug A. No 404, and no HTML error page returned in place of the file. | [ ] | |
| S7 | Run the curl one-liner copied from slug A's page in macOS zsh | Creates `agent-kits/<slug A>/` containing the 7 files. Command exits 0. | [ ] | |
| S8 | Open `/en/agents/<slug B>` | Status badge reads "Unverified", not "Tested". | [ ] | |
| S9 | Open `/sitemap.xml` and `/robots.txt` | Both return 200 and render as XML and plain text, not the site's 404 page. | [ ] | |
| S10 | Open `/ko/agents/<slug A>` | Detail page labels, badges, and buttons are in Korean. | [ ] | |

---

## 2. Regression checks by surface (highest risk first)

### 2.1 `/kits/*` and install kit files (#13)

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| K1 | For **all 20** installable slugs, request each of the 7 files. Loop `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" <url>` over the URLs. | 140 URLs, all `200`. List any non-200. | [ ] | |
| K2 | `curl -sI .../kits/<slug A>/agent.json` and check `Content-Type` | Record the value. The risk list flags it may be served as text. Verify that (a) the file opens in the browser and (b) `JSON.parse` succeeds on the downloaded file (e.g. `node -e 'JSON.parse(require("fs").readFileSync("agent.json","utf8"))'`). Flag it to the owner if the type isn't `application/json`. Whether that blocks the release is the owner's call. | [ ] | |
| K3 | `curl -sI` on `AGENTS.md` and `cursor-rule.mdc` for slug A. Then click each per-file link on the detail page in Chrome and in Safari. | Record the Content-Type for each. Verify each click either shows readable text or downloads a file with the **correct filename and extension**. Fail it if it downloads with a wrong or missing extension (e.g. `.mdc.txt`) or the content is garbled. | [ ] | |
| K4 | Open the downloaded `CLAUDE.md` and `README.md` for slug A | Encoding is correct: Korean and other non-ASCII text isn't garbled, and the content matches slug A, not another agent. | [ ] | |
| K5 | Pick one agent that is **not** installable. Open its detail page, then request `/kits/<that slug>/AGENTS.md`. | Verify the page shows no Download Kit button or curl command, or handles it the way the design intends. Verify the kit URL returns 404, not a broken kit. [ASSUMPTION: only the 20 project-ready agents have kits] | [ ] | |
| K6 | On the slug A detail page, click Download Kit | Verify what it does (zip, multiple downloads, or scroll to files) and that every file it produces opens. | [ ] | |
| K7 | Compare the curl command shown on the page to the one in the PR #13 description | Uses `--remote-name-all` and does **not** contain `--output-dir`. Slug and base URL are correct. | [ ] | |

### 2.2 curl one-liner across terminals (#13)

Copy the command from the page with the page's copy button, if it has one, not by retyping it. Run it in an empty directory.

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| C1 | macOS zsh: paste and run. Then `ls agent-kits/<slug A>`. | 7 files, each non-empty (`wc -c`). Exit code 0 (`echo $?`). | [ ] | |
| C2 | Ubuntu 20.04 bash. First run `curl --version` to confirm 7.68. Then run the command. | Same as C1. This is the case the `--output-dir` removal was meant to fix. Verify no "unknown option" error. | [ ] | |
| C3 | Re-run the command in the same directory (C1 or C2) | Verify the behavior: files are overwritten or an error is reported. Record the result. [ASSUMPTION: re-running is a realistic user action] | [ ] | |
| C4 | Windows PowerShell: run the command exactly as shown | **Known risk.** Record what happens. Verify separately: (a) whether `mkdir -p`, `&&`, and `( ... )` subshell syntax are accepted by the PowerShell version under test (record `$PSVersionTable.PSVersion`); (b) whether `curl` resolves to `curl.exe` or to a PowerShell alias; (c) whether the `{...}` list in the quoted URL is passed to curl intact and expands to 7 files. | [ ] | |
| C5 | Windows PowerShell with `curl.exe` explicitly. If C4 failed, try the Windows instructions on the page, if any. | Verify whether any documented path gets a Windows user to the 7 files. If none exists, log a follow-up. The release notes or page should not claim PowerShell works unless this row passes. | [ ] | |
| C6 | Simulate a missing file: run the command with a bad slug (`<slug A>x`) | With `-f`, verify curl exits non-zero and does not save HTML 404 pages as `AGENTS.md` and the other names. Record the exit code and any files left behind. | [ ] | |

### 2.3 Verification status data (#14)

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| V1 | `/en/agents`: filter by status = Tested, then Unverified | Record both counts. Verify they are consistent with 61 agents having moved from tested to unverified. Get the expected totals from the data owner. I can't derive them from the request. | [ ] | |
| V2 | Open 5 agents from the Tested filter result | Each shows "Tested" (or Expert) on the card **and** on the detail page. Per #14, each should have ≥ 2 sample runs. Verify the runs are shown on the page, if the page displays them. | [ ] | |
| V3 | Open slug B and 2 other agents that moved to unverified. Check the card on `/agents`, the detail page, workflow cards that reference them, and `/install`. | "Unverified" on every surface. No stale "Tested" anywhere. | [ ] | |
| V4 | Same agents as V3 on `/ko/...` | Korean status badge corresponds to Unverified, not the Korean for Tested. | [ ] | |
| V5 | Bookmark an agent from slug B's list, then open `/bookmarks` | Bookmarked card shows the current status "Unverified". | [ ] | |
| V6 | Search `/agents` for "tested" | Verify the results match the status filter and the text doesn't imply verification that has been removed. | [ ] | |

### 2.4 `/agents` list: search, filters, toggle (#15, #19)

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| A1 | `/en/agents`: type a keyword from slug A's name | Slug A appears. Result count updates. | [ ] | |
| A2 | Apply one option from **each of the 7 filter groups**, one group at a time | Count updates and cards match the filter. Record the counts. | [ ] | |
| A3 | Combine 2 filters, the installable toggle, and a search term | Count matches the visible cards. Empty state shows when nothing matches. | [ ] | |
| A4 | Click "Clear all" | All filters, the toggle, and search reset. Count returns to 100. | [ ] | |
| A5 | Repeat A1–A4 on `/ko/agents` | Same counts as `/en`. Filter labels, counts text, empty state, and "Clear all" are in Korean. | [ ] | |
| A6 | Apply filters, then reload the page and use browser back/forward | Verify whether filter state persists through the URL. Record the behavior. It must not show a blank page or an error. | [ ] | |
| A7 | Search with Korean input (IME) on `/ko/agents` in Chrome and in Safari | Composition isn't cut off mid-character. Results update after composition ends. | [ ] | |

### 2.5 Agent detail page `/agents/<slug>` (#13, #15)

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| D1 | `/en/agents/<slug A>`: click the copy button on the curl command, if present, and paste it into a text editor | Pasted text is identical to the displayed command, with no smart quotes or added line breaks. | [ ] | |
| D2 | Click the bookmark button, reload the page, then open `/bookmarks` | Bookmark state persists after reload and the agent appears on `/bookmarks`. | [ ] | |
| D3 | Unbookmark from the detail page and from `/bookmarks` | Agent is removed in both places. | [ ] | |
| D4 | `/ko/agents/<slug A>`: switch the language (en ↔ ko) with the site's language switch | Stays on the same agent in the other locale. No 404. | [ ] | |
| D5 | Open a non-installable agent detail page in `/en` and `/ko` | Page renders with no install section errors (see K5). | [ ] | |

### 2.6 Home, `/install`, `/workflows/<slug>`, `/bookmarks`

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| H1 | `/en` and `/ko` home: click every card or link into agents and workflows | Destinations load. Locale is preserved. | [ ] | |
| H2 | `/en/install` and `/ko/install` | Page renders. Any kit links or commands shown point to `/kits/<slug>/...` URLs that return 200. | [ ] | |
| H3 | Open 2 workflows (`/en/workflows/<slug>` and `/ko/...`) | Agent cards render with the correct status badges (V3) and Korean card text on `/ko`. Agent links resolve. | [ ] | |
| H4 | `/bookmarks` with no bookmarks, in `/en` and `/ko` | Empty state renders in the right language. | [ ] | |
| H5 | Direct-load a deep URL (e.g. `/ko/agents/<slug A>`) in a new tab | Loads without redirecting to home and without 404. | [ ] | |

### 2.7 SEO files (#16)

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| E1 | `/sitemap.xml`: check that the URLs use the `https://yohan-work.github.io/agentive/` base | No `localhost` URLs and no URLs missing the `/agentive` base path. | [ ] | |
| E2 | Pick 3 entries (home, `/agents`, one agent). Check the hreflang alternates. | Each has `en` and `ko` alternates, and those URLs return 200. | [ ] | |
| E3 | Search the sitemap for `bookmarks` | Not present. | [ ] | |
| E4 | Spot-check 5 random sitemap URLs | All return 200. | [ ] | |
| E5 | `/robots.txt` | Verify it references the sitemap URL, and that the sitemap URL is correct and returns 200. Verify it doesn't disallow `/en/` or `/ko/` content. Record any `Disallow` lines and confirm they're intended (e.g. bookmarks). | [ ] | |
| E6 | Verify the robots.txt location | GitHub Pages project sites serve under `/agentive/`. Note that crawlers read robots.txt only at the domain root, so confirm with the owner whether `/agentive/robots.txt` is meant to be informational. Not a pass/fail on the page itself. | [ ] | |

### If time allows

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| T1 | Run K1 for all 20 slugs with `curl` from Ubuntu as well as macOS | Same results. | [ ] | |
| T2 | Keyboard-only pass on `/agents` filters, "Clear all", and the bookmark button | All reachable and operable with a visible focus ring. | [ ] | |
| T3 | Lighthouse or axe quick scan on `/ko/agents/<slug A>` | Record issues. Only new regressions matter for this release. | [ ] | |
| T4 | Check `<html lang>` on `/ko` pages | Verify it is `ko`. Record the value. | [ ] | |

---

## 3. Device and environment matrix

Mark each cell `✓`, `✗` (with a note), or `—` if not run.

### Browsers

| Key check | Chrome macOS | Safari macOS | Firefox macOS | Chrome Win11 | Firefox Win11 | iOS Safari 17+ (iPhone 13 mini, 375px) | Android Chrome (Pixel 7) |
|---|---|---|---|---|---|---|---|
| S1–S3 load, redirect, card count | | | | | | | |
| A1–A4 search, filters, Clear all (en) | | | | | | | |
| A5 `/ko/agents` filters and counts | | | | | | | |
| D1 copy curl command | | | | | | | |
| K3 per-file links open or download correctly | | | | | | | |
| D2/D3 bookmark persist and remove | | | | | | | |
| V3 status badges (no stale "Tested") | | | | | | | |
| M1 Korean badges and chips fit (see below) | n/a | n/a | n/a | n/a | n/a | | |

Note: "Safari latest on Windows 11" is in your supported list, but I'm not aware of a current Safari build for Windows. Confirm with the owner whether that combination is really in scope before you mark it.

**Mobile-specific (375px)**

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| M1 | iPhone 13 mini: `/ko/agents` and `/ko/agents/<slug A>`. Check every status and difficulty badge, filter chip, count label, and "Clear all". | No text overflows, gets clipped, or overlaps. No horizontal page scroll. Wrapping or truncation with the full text available is acceptable. **Known risk.** | [ ] | |
| M2 | iPhone 13 mini: curl command block on the detail page | The long command scrolls or wraps inside its block without widening the page. The copy button is reachable. | [ ] | |
| M3 | Pixel 7: repeat M1 | Same as M1. | [ ] | |
| M4 | Mobile: open the filter panel, apply filters, close it | Panel opens and closes. Results update. No layout that traps you. | [ ] | |

### Terminals (curl one-liner)

| Check | macOS zsh | Ubuntu 20.04 bash (curl 7.68) | Windows PowerShell (curl.exe) |
|---|---|---|---|
| Command runs without syntax or option error | | | |
| 7 files present and non-empty | | | |
| `agent.json` parses as JSON | | | |
| Bad slug fails without leaving 404 HTML saved as kit files (C6) | | | |

---

## 4. Content checks

| ID | Steps | Expected result | Pass | Notes |
|---|---|---|---|---|
| T-1 | Walk through `/ko` home, `/ko/agents`, `/ko/agents/<slug A>`, `/ko/agents/<slug B>`, `/ko/workflows/<one>`, `/ko/install`, `/ko/bookmarks`. List every string still in English. | Everything in the #15/#19 scope is Korean: detail page, status and difficulty badges, agent and workflow cards, search panel (filters, counts, "Clear all"). Log English strings **outside** that scope as follow-ups, not failures. **Known risk.** | [ ] | |
| T-2 | `/ko/agents` counts text with 0, 1, and many results | Korean count phrasing reads correctly, with no raw placeholders like `{count}` and no English plural left over. | [ ] | |
| T-3 | Check every status value and difficulty value in `/ko` | Each has a Korean label. None show raw keys (e.g. `unverified`, `badge.status.tested`). | [ ] | |
| T-4 | Agent content in `/ko` (descriptions, prompts) | Verify with the owner whether agent body content is meant to be translated in this release. The request covers UI chrome only. Record what you see. | [ ] | |
| T-5 | Status wording in `/en` and `/ko` | No copy on the home page, `/install`, or the detail page implies an agent is "tested" or "verified" when its status is Unverified. | [ ] | |
| L-1 | Every per-file link on slug A's detail page (7) | Each points to `/agentive/kits/<slug A>/<file>` and returns 200. | [ ] | |
| L-2 | Curl command URL | Base is `https://yohan-work.github.io/agentive/kits/<slug>/`, the slug matches the page, and all 7 filenames are spelled exactly as served. | [ ] | |
| L-3 | Header and footer nav links in `/en` and `/ko` | All resolve and stay in the current locale. | [ ] | |
| L-4 | External links (repo, license, etc.) | Resolve. No links to `localhost` or a preview domain. | [ ] | |
| D-1 | `/agents` total and installable counts in `/en` and `/ko` | 100 and 20 in both locales. | [ ] | |
| D-2 | Kit `agent.json` for slug A vs. its detail page | Name, slug, and status in `agent.json` match the page. Verify whether `agent.json` carries verifiedStatus, and if so that it isn't stale "tested" for a demoted agent. [ASSUMPTION: agent.json includes status] | [ ] | |
| D-3 | Kit `EVALUATION.md` for slug A | Verify it doesn't claim a higher verification level than the agent's current status. | [ ] | |

---

## Sign-off

- [ ] All smoke checks pass
- [ ] Failures triaged: blocker or follow-up issue linked
- [ ] Owner sign-off to announce: `________`

This checklist doesn't mean the release is safe. The go/no-go is the owner's decision, based on the results above.
