You gave me the platform, surfaces, devices, and risks, so here is the full checklist. Some behavior wasn't specified: what "Download Kit" produces, which content types are acceptable, and whether the installable-only toggle maps exactly to the 20 kit agents. For those, the checks say what to verify and record instead of giving an expected value.

One thing to confirm before you start: if the "Pages preview of main" is the public URL (https://yohan-work.github.io/agentive/), users can already see this build while you test it. If so, decide ahead of time what a failed smoke check means: revert main, or hotfix and announce later.

Record the tested commit SHA at the top of the issue: `SHA: ______  Tester: ______  Date: ______`

---

## 1. Smoke checks (run first, stop and triage on any fail)

| ID | Check | Expected | Pass/Fail |
|---|---|---|---|
| S1 | Open `/agentive/` (root) | Redirects to `/agentive/en/`. Home renders with no console errors | |
| S2 | Open `/en/agents` and `/ko/agents` | Both render 100 cards. Search box and 7 filter groups are visible | |
| S3 | Turn on the installable-only toggle on `/en/agents` | Card count changes. Record the count and verify it matches the number of kit agents (20 per #13) | |
| S4 | Open one installable agent detail page (pick any from S3) | Page renders: Download Kit button, curl command, per-file links, bookmark button | |
| S5 | Copy that page's curl one-liner and run it in macOS zsh | Exits 0. `agent-kits/<slug>/` contains 7 non-empty files: AGENTS.md, CLAUDE.md, cursor-rule.mdc, agent.json, README.md, RUNBOOK.md, EVALUATION.md | |
| S6 | Run the same one-liner on Ubuntu 20.04 bash (curl 7.68) | Same as S5. No "unknown option" error (this is the #14 `--output-dir` fix) | |
| S7 | Open each of the 7 `/kits/<slug>/…` links from S4 in the browser | Each returns the file (not a 404 page). Record the behavior: shown inline or downloaded | |
| S8 | Open the same detail page under `/ko/agents/<slug>` | Page chrome, badges, and buttons are in Korean. No layout break at desktop width | |
| S9 | Open `/sitemap.xml` and `/robots.txt` | Both return 200 and are valid XML/plain text (not the site's HTML 404 page) | |
| S10 | Find an agent from the #14 set (lowered to unverified) on `/en/agents` and its detail page | Badge reads "Unverified" (or the ko equivalent on `/ko`), not "Tested" | |

---

## 2. Regression checks by surface

Order within each group is by risk. "Verify" means the request doesn't define an expected value, so record what you see.

### 2.1 Install kits: `/kits/*` and agent detail install section (#13)

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| K1 | For each of the 20 installable agents, request all 7 kit files (e.g. `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" <url>`) | 140 files return 200. Record any non-200 | |
| K2 | From K1, record the Content-Type for `.md`, `.mdc`, and `agent.json` | Verify whether the types break usage: the file must still download correctly via curl, and the browser link must not show a blank page or garbled text. Log the actual types in the issue | |
| K3 | `curl -fsSL <kit>/agent.json \| python3 -m json.tool` for 3 agents | Parses as valid JSON | |
| K4 | Compare the downloaded AGENTS.md/CLAUDE.md with the detail page for the same agent (name, slug) | Content is for the same agent, not a different or empty template | |
| K5 | Inspect the curl command on 3 different agent pages | `<slug>` in both the `mkdir` path and the URL matches the page's agent. The URL host/path is `https://yohan-work.github.io/agentive/kits/<slug>/`. No `--output-dir` present | |
| K6 | Run the one-liner twice in the same directory (macOS) | Verify the second run's behavior (overwrite vs error) and record it. It should not leave partial or empty files | |
| K7 | Run the one-liner in Windows PowerShell (note the PowerShell version) | Record the exact result. The command uses `mkdir -p`, `&&`, a `( cd … )` group, `curl`, and `{…}` in the URL. Verify which of these, if any, fails in PowerShell, and whether `curl` resolves to `curl.exe` or to a PowerShell alias. **If it fails, verify the page offers a PowerShell alternative or a note. If it doesn't, log it as a known issue for the announcement** | |
| K8 | Run the one-liner with `curl.exe` explicitly in PowerShell (adjust only the shell parts, not the URL) | Verify whether the `{…}` URL list downloads all 7 files. Record the result | |
| K9 | Click Download Kit on a detail page | Verify what it produces (zip? multiple files? a link to /install?) and that the file(s) contain all 7 kit files for that agent | |
| K10 | Open a detail page for a **non-installable** agent | Verify there's no broken curl command or Download Kit that points to a missing `/kits/<slug>/`. Record what's shown | |
| K11 | Copy button (if present) on the curl command | Clipboard contents match the displayed command exactly, with no smart quotes or line breaks | |

### 2.2 Verification status data (#14)

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| V1 | On `/en/agents`, filter by status "Tested" (if the filter exists) | Record the count. Every agent listed must show sample-run evidence on its detail page. Verify at least 2 runs are shown for 3 of them | |
| V2 | Filter by "Unverified" | Record the count. Spot-check 5 agents: the card badge and detail badge both say Unverified | |
| V3 | Compare the status on card, detail page, and filter facet counts for 3 agents | All three agree. No stale "Tested" anywhere | |
| V4 | Repeat V2 on `/ko/agents` | Same counts as en. Badges use the Korean label | |
| V5 | Check whether `/install`, workflow pages, or home show status badges for agents | Any badge shown matches the agent's detail page | |

### 2.3 Agents list and search `/agents` (#15, #19)

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| A1 | Apply one option from each of the 7 filter groups, one at a time, on `/en/agents` | Results narrow and the count updates. Record any filter that returns 0 unexpectedly | |
| A2 | Combine 2 filters + search text + installable-only | Results satisfy all conditions. Count matches visible cards | |
| A3 | Click "Clear all" | All filters, the toggle, and search reset. 100 cards are back | |
| A4 | Repeat A1–A3 on `/ko/agents` | Same counts as en for the same filters. Filter labels, counts text, and "Clear all" are in Korean | |
| A5 | Search a Korean term on `/ko/agents`, and an English agent name on `/ko/agents` | Verify the behavior and record it (the request doesn't specify whether search covers ko text) | |
| A6 | Apply filters, open an agent, press Back | Verify whether the filter state persists and record it. It must not crash or show an empty list | |
| A7 | Reload a page that has query-string filters (if the URL reflects filters) | Same filtered result after reload. On a static export this is client-side, so check for a flash of unfiltered content and a hydration error in the console | |

### 2.4 Agent detail `/agents/<slug>` (#15)

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| D1 | Bookmark an agent on `/en/agents/<slug>`, then open `/en/bookmarks` | Agent appears. Unbookmark removes it | |
| D2 | Bookmark on `/en`, then open `/ko/bookmarks` | Verify whether bookmarks are shared across locales and record it | |
| D3 | Language switcher on a detail page (en to ko to en) | Lands on the same agent in the other locale, not on home | |
| D4 | Direct-load `/ko/agents/<slug>` in a fresh tab | Renders in Korean with no 404 | |
| D5 | Load a nonexistent slug `/en/agents/does-not-exist` | Site 404 page, not a blank page | |

### 2.5 Other pages

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| P1 | `/en/install` and `/ko/install` | Render. Any curl/instructions match the pattern in K5 | |
| P2 | Open 2 `/workflows/<slug>` pages in en and ko | Workflow cards and agent cards render. Korean cards are translated (#19) | |
| P3 | `/en` and `/ko` home | Agent and workflow cards render. Links go to the same-locale pages | |

### 2.6 SEO files (#16)

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| SEO1 | Open `/sitemap.xml` | URLs use `https://yohan-work.github.io/agentive/…` (includes the `/agentive` base path) | |
| SEO2 | For 3 entries, check hreflang alternates | Each has both `en` and `ko` alternates pointing to the matching page | |
| SEO3 | Search the sitemap for `bookmarks` | No bookmarks URLs | |
| SEO4 | Open `/robots.txt` | Verify it references the sitemap URL with the correct base path. Verify whether bookmarks are also disallowed here; record it (the request says "excluded" without saying where) | |
| SEO5 | Open 5 random URLs from the sitemap | Each returns 200 | |
| SEO6 | Verify where robots.txt is served: `https://yohan-work.github.io/robots.txt` vs `/agentive/robots.txt` | Record which one this release produces. Crawlers only read robots.txt at the host root, so confirm with the owner that this is intended | |

### If time allows

- K1 content check: for all 20 agents, compare kit README.md titles with the agent name.
- Run S5 with an older macOS system curl and record `curl --version`.
- Lighthouse or axe pass on `/ko/agents` and one `/ko/agents/<slug>`.
- Keyboard-only run of filters, "Clear all", bookmark, and copy button.

---

## 3. Device and environment matrix

Mark each cell P/F. Use "–" for not applicable.

**Browsers** (key checks: S2 list renders, A3 Clear all, D1 bookmark, K11 copy, S8/C3 ko layout)

| Environment | S2 | A3 | D1 | K11 | S8 ko layout | C3 badges/chips |
|---|---|---|---|---|---|---|
| macOS Chrome latest | | | | | | |
| macOS Safari latest | | | | | | |
| macOS Firefox latest | | | | | | |
| Windows 11 Chrome latest | | | | | | |
| Windows 11 Firefox latest | | | | | | |
| iOS Safari 17+ (iPhone 13 mini, 375px) | | | | | | |
| Android Chrome (Pixel 7) | | | | | | |

Safari on Windows 11 is not a supported pairing, so it has no row. Confirm that's intended.

**Terminals** (curl one-liner)

| Environment | S5/S6 run | 7 files present | agent.json valid (K3) | Notes (version, error text) |
|---|---|---|---|---|
| macOS zsh | | | | |
| Ubuntu 20.04 bash, curl 7.68 | | | | |
| Windows PowerShell, `curl.exe` (K7/K8) | | | | |

---

## 4. Content checks

| ID | Steps | Expected | Pass/Fail |
|---|---|---|---|
| C1 | Walk `/ko` home, `/ko/agents`, one `/ko/agents/<slug>`, `/ko/install`, one `/ko/workflows/<slug>`, `/ko/bookmarks`. List every UI string still in English | Record each string and its location. Agent content that isn't translated by design (names, prompts) is not a fail. Confirm the expected scope with the owner | |
| C2 | Check the Korean status and difficulty badge labels against every status/difficulty value | Every value has a Korean label. No raw keys (e.g. `status.unverified`) or blank badges | |
| C3 | At 375px (iPhone 13 mini), view `/ko/agents` cards, filter chips, counts, and a detail page's badges | No text overflow, clipping, or chips pushing the layout into horizontal scroll | |
| C4 | Check the count strings in ko and en with 0, 1, and many results | Grammatical, and the number matches visible cards | |
| C5 | Click every link in the install section of one detail page (per-file links, any docs links) | All resolve with no 404. Links stay under `/agentive/` | |
| C6 | On a `/ko` page, click internal links (cards, nav, footer) | They go to `/ko/...` pages, not `/en/...`, unless intentionally cross-locale | |
| C7 | Page `<title>` and meta description on `/ko/agents/<slug>` | Verify they're in Korean or intentionally English, and record them | |
| C8 | `/en/agents` total count text | States 100, matching the rendered cards | |

---

**Sign-off** (filled by people, not this checklist):
- [ ] All smoke checks pass
- [ ] Failures triaged: blocker / known issue for announcement / follow-up
- [ ] PowerShell result (K7/K8) reflected in the announcement if not supported
- [ ] Release owner approves the announcement
