# Design QA Report: Agent Archive `/agents` (ko @1440, en @375)

## Summary

Neither screenshot passes the stated requirements yet. There are **4 High**, **6 Medium**, and **5 Low** findings. The biggest problems:

1. **Touch targets.** Chips (24px), the bookmark button (28px), the "View agent →" link (~20px), and the checkbox (16px) are all below 44×44 on mobile.
2. **Selected chips differ by color only**, and that color difference is very weak (about 1.1:1 between the selected and unselected backgrounds).
3. **Muted text fails 4.5:1.** Group titles are about 4.0:1 and the search placeholder is about 3.8:1.
4. **Card layout breaks the summary rule.** Summaries aren't line-clamped, so some run to 3 lines, card heights differ, and the bookmark drops out of its top-right spot when badges wrap.
5. **On mobile the filters take ~1100px** before the first result. Fixing touch targets alone would make this worse, so it has to be fixed at the same time.

Contrast ratios below are my own calculations from the hex values you gave, using the WCAG relative-luminance formula.

---

## Assumptions

- The filter area and result bar sit on `canvas #0b0d12`. The search input and cards sit on `panel #11141b`.
- Body line-height is about 20–24px (Tailwind `text-sm` = 14/20). So `min-height: 48px` equals 2 lines at 24px leading, or 2.4 lines at 20px.
- Selected-chip background = sky-400 at 15% over canvas, which is about `#122734`.
- "Interactive targets ≥ 44×44 on touch" applies to coarse pointers (mobile and tablet), not to desktop mouse use.
- I can't see focus states, hover states, or ARIA from a description, so they're listed under Risks rather than as findings.

---

## Contrast check

| Pair | Ratio | Requirement | Result |
|---|---|---|---|
| Muted `#6b7280` group titles (12px) on canvas | **~4.0:1** | ≥ 4.5:1 | **Fail** |
| Muted `#6b7280` placeholder on panel `#11141b` | **~3.8:1** | ≥ 4.5:1 | **Fail** |
| Secondary `#a3a9b7` unselected chip text on `#161a22` | ~7.4:1 | ≥ 4.5:1 | Pass |
| Sky-200 `#bae6fd` selected chip text on ~`#122734` | ~11.6:1 | ≥ 4.5:1 | Pass |
| Sky-400 `#38bdf8` eyebrow (12px) on canvas | ~9.1:1 | ≥ 4.5:1 | Pass |
| Sky-200 "모두 지우기" on canvas | ~14.7:1 | ≥ 4.5:1 | Pass |
| Selected chip bg vs unselected chip bg | **~1.1:1** | ≥ 3:1 for a state indicator (WCAG 1.4.11) | **Fail** |
| Unselected chip bg `#161a22` vs canvas | ~1.1:1 | Chip is identified by its text, so OK | Low risk |

---

## Findings

### High

**H1. Touch targets under 44×44 (375px)**
- **Where:** Chips are 24px tall. The bookmark button is 28×28. "View agent →" has a ~20px text-only hit area. The "Show installable only" checkbox is 16×16 (at 1440 it's the same, and tablets are touch too).
- **Requirement:** Interactive targets ≥ 44×44px on touch.
- **Fix:**
  - **Bookmark:** keep the 28px visual but make the button 44×44: `size-11 -m-2 grid place-items-center`. The negative margin keeps it visually aligned.
  - **View agent:** make the whole card the link using a stretched link. This gives the biggest target and removes a separate small link:
    ```html
    <article class="relative ...">
      <h3><a href="/en/agents/slug" class="after:absolute after:inset-0">Agent name</a></h3>
      ...
      <button class="relative z-10 size-11 ...">bookmark</button>
      <span aria-hidden="true">View agent →</span>
    </article>
    ```
    Controls inside the card (bookmark) need `relative z-10` so they sit above the overlay.
  - **Checkbox:** wrap the input and text in one `<label class="inline-flex min-h-11 items-center gap-2">` so the whole row is the target.
  - **Chips:** on coarse pointers use `min-h-11` (44px) with an 8px gap. Only do this together with H4, or the mobile filter area grows well past 1100px.

**H2. Selected chip shown by color only**
- **Where:** Selected vs unselected differ only in border, background, and text color. The background difference is ~1.1:1, which is close to invisible for low-vision and color-blind users, and in dimmed or outdoor screen conditions.
- **Requirement:** Selected state must use more than color alone.
- **Fix:** Add a leading check icon (`✓`, 12px) to selected chips and make the label `font-medium`. Also expose the state: `aria-pressed="true"` on a `<button>`, or a real checkbox/radio input. To avoid width jumping when the icon appears, reserve its slot (for example `gap-1` plus an icon that's always rendered but `invisible` when unselected), or accept the reflow if the chips wrap anyway.

**H3. Muted text below 4.5:1**
- **Where:** The six group titles (12px, ~4.0:1 on canvas) and the search placeholder (~3.8:1 on panel).
- **Requirement:** Small labels ≥ 4.5:1. The placeholder is the only visible hint about what the search covers, so treat it as text too.
- **Fix:** For these uses, switch to a lighter muted value. Around `#7c8494` gives ≥ 4.5:1 on both canvas and panel, but please re-verify with a contrast checker before committing a token. Or use `secondary #a3a9b7` for group titles. Prefer adding a new token (for example `muted-strong`) over changing `muted` everywhere, since muted may be used on purpose for disabled text.

**H4. Mobile filter area is ~1100px tall before the first result (375px)**
- **Where:** All 6 filter groups are stacked and expanded, including the 49 tool chips.
- **Requirement:** None states this directly, but it's a core usability problem: at 375px the user scrolls about 1.5 screens before seeing any agent. It also blocks H1, because 44px chips would make it much taller.
- **Fix:** Below `md`, put filters behind a "Filters (n)" button that opens a bottom sheet or full-screen panel with an "Apply" / "Show 100 results" button. Keep the search box and result count inline above the cards. Active filters can show as a single removable chip row under the search box.

### Medium

**M1. Card summaries not line-clamped; uneven card heights (1440)**
- **Where:** `min-height: 48px` without a clamp, so two cards show 3 lines and cards in the same row end at different heights before the footer.
- **Requirement:** Max 2 lines on desktop, no mid-word truncation.
- **Fix:**
  - Use `line-clamp-2` plus a min-height of exactly 2 lines (for 14/20 that's `min-h-10`, or 40px, not 48px).
  - Make the card `flex flex-col h-full` and the footer `mt-auto` so footers line up across a row.
  - Put the full summary in a `title` attribute or on the detail page so nothing is lost.

**M2. Korean text breaks mid-word (/ko)**
- **Where:** The browser's default Korean line breaking can break between any syllables. That breaks the "no truncation mid-word" rule for clamped summaries, and it can split badge labels.
- **Fix:** Add `word-break: keep-all` for Korean: `:lang(ko) { word-break: keep-all; overflow-wrap: anywhere; }`. The `overflow-wrap` part is a fallback for very long unbroken strings. Make sure `<html lang="ko">` is set on /ko routes.

**M3. Bookmark loses top alignment when badges wrap (1440)**
- **Where:** The 4 badges wrap to a second line and push the 28px bookmark down.
- **Fix:** Separate the two parts of the row:
  ```html
  <div class="flex items-start gap-3">
    <div class="flex flex-1 flex-wrap gap-1.5">…badges…</div>
    <button class="shrink-0 size-11 -m-2 …">…</button>
  </div>
  ```
  Also consider showing fewer badges: move "품질 4/5" to the card footer, and don't show "설치 가능" in the badge row when the "설치 가능만 보기" filter is on. That makes wrapping less likely in Korean.

**M4. Tool filter wraps to 7 lines (49 chips)**
- **Where:** The tool group alone is taller than the other five groups combined.
- **Fix:** Show the ~10 most-used tools plus a "+39 더 보기" toggle, or turn this group into a searchable multi-select combobox. Always keep selected tools visible even when the group is collapsed.

**M5. Repeated "View agent →" link text**
- **Where:** Every card has the same link text, so a screen-reader list of links reads "View agent" 100 times, and the arrow is read aloud.
- **Fix:** The stretched-link pattern in H1 fixes this, because the accessible name becomes the agent name. If you keep a separate link, use `aria-label="View {agent name}"` and wrap the arrow in `aria-hidden="true"`.

**M6. Chip padding off the 8px grid**
- **Where:** `px-2.5` is 10px. The 28px bookmark isn't a grid multiple either.
- **Requirement:** 8px spacing grid.
- **Fix:** Use `px-3` (12px, a 4px half-step, which is common with 8px grids) or `px-2` (8px). Moving the bookmark to 44px (H1) with a 24px icon makes it grid-friendly.
- **Note:** The card padding requirement of 20px is itself not an 8px multiple. Please confirm whether the grid allows 4px half-steps. If it does, 20px, 12px, and 4px (`py-1`) are all fine. If it doesn't, the spec contradicts itself and card padding should be 16px or 24px.

### Low

**L1. Uppercase and 0.16em tracking on Korean group titles.** `uppercase` has no effect on Hangul, and wide tracking makes Korean harder to read. Fix: `:lang(ko) .group-title { letter-spacing: 0; }`, and consider 13px for Korean.

**L2. "모두 지우기" is a link with no underline.** It's separated from other text so it passes contrast, but it is an action, not navigation. Fix: make it a `<button>`, add `hover:underline` and a visible focus ring, and give it a 44px hit area on touch. Hide it or `disabled` it when no filters are active. The screenshot shows "100 of 100", yet the button is visible.

**L3. Result count isn't announced.** Fix: wrap "100개 중 100개 표시" in `aria-live="polite"` so screen-reader users hear the count change when they filter.

**L4. Placeholder carries the search scope.** The long placeholder will likely truncate at 375px in the English UI ("Search by name, role, task, tag, tool…"), and it disappears once the user types. Fix: add a visible label or `aria-label="Search agents"`. Shorten the mobile placeholder, for example "Search agents…".

**L5. Unselected chip boundary is nearly invisible.** `#161a22` on canvas is ~1.1:1, and the `#1f2430` border is also very subtle. The text identifies the chip, so this isn't a WCAG failure, but chips read as plain text. Optional: raise the border to around `#2a3140`.

---

## Risks and things I couldn't verify

- **/ko at 375px and 768px weren't captured.** The rule "Korean must fit without wrapping badges onto 3+ lines" is most likely to fail at `md` (768px). There, 2 columns with no sidebar give each card only about 310–330px of content width, and the four Korean badges plus the bookmark may wrap to 3 lines. This is the highest-risk gap in the test coverage.
- **Focus states.** None were described. Every chip, the checkbox, the bookmark, "모두 지우기", and the cards need a visible `focus-visible` ring. A sky-400 ring on canvas is about 9:1, which is fine.
- **Bookmark semantics.** The button needs an accessible name ("Bookmark {agent}") and `aria-pressed`. Its saved state should also use more than color (a filled vs outline icon).
- **Checkbox border contrast.** A 16px checkbox's border needs ≥ 3:1 against the background. This wasn't described.
- **Desktop grid.** 2 columns at 1440 matches the spec, but please confirm it's intended. With 240px + 200px side rails, each card is about 460px wide.

---

## Next actions (in order)

1. **Mobile filter drawer (H4) + touch targets (H1).** Do these together, since they depend on each other.
2. **Selected chip state (H2).** Add the check icon, `font-medium`, and `aria-pressed`.
3. **Contrast token (H3).** Add `muted-strong` (≥ 4.5:1 on canvas and panel) and apply it to group titles and the placeholder.
4. **Card structure (M1, M3, M5).** `line-clamp-2`, `flex-col` + `mt-auto` footer, bookmark split from the badge row, stretched link.
5. **Korean typography (M2, L1).** `keep-all` and tracking reset under `:lang(ko)`.
6. **Tool filter (M4).** Collapse to top 10 plus "more", or use a combobox.
7. **Re-capture and re-check:** /ko and /en at 375, 768, and 1440, including keyboard focus states, then re-run this checklist against the requirements.
