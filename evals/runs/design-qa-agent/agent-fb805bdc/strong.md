# Design QA Report: Agent Archive, `/agents` list page

**Scope:** Screenshot 1 (`/ko/agents` @ 1440px), Screenshot 2 (`/en/agents` @ 375px), checked against your stated requirements and tokens.
**Severity scale:** **High** = breaks a stated requirement or blocks a core task · **Medium** = measurable usability or accessibility problem · **Low** = polish or consistency.

---

## 1. Summary

| # | Finding | Severity | Requirement |
|---|---|---|---|
| 1 | Muted text `#6b7280` fails 4.5:1 (group titles, placeholder) | High | Contrast |
| 2 | Selected chip state uses color only | High | Chips |
| 3 | Card summaries run to 3 lines, so cards in a row have unequal heights | High | 2-line max |
| 4 | Touch targets under 44px: chips (24px), bookmark (28px), "View agent →" (~20px) | High | 44×44 |
| 5 | Mobile filter area is ~1100px tall before the first result | High | Usability |
| 6 | When badges wrap, the bookmark gets pushed out of top alignment | Medium | Layout |
| 7 | Tool filter shows 49 chips on 7 lines at desktop | Medium | Usability |
| 8 | Korean badge wrapping is unverified at 768px and 375px, where the risk is highest | Medium | /ko fit |
| 9 | "모두 지우기" link relies on color alone, with no underline or button affordance | Low–Medium | Affordance |
| 10 | Spec conflict: 20px card padding and 10px chip padding are off the 8px grid | Low | Spacing |
| 11 | Uppercase + 0.16em tracking applied to Hangul labels | Low | /ko typography |
| 12 | 16×16 checkbox; hit area depends on the label | Low (desktop) / Medium (touch) | 44×44 |

**Passing:** body text in secondary `#a3a9b7` (~7.8:1 on panel, ~7.4:1 on chip bg), sky-400 eyebrow (~9:1), sky-200 chip text on the selected tint, 48px search input, and no horizontal scroll at 375px.

---

## 2. Findings and fixes

### 1. Muted text fails contrast (High)
Calculated WCAG ratios for `#6b7280`:
- On panel `#11141b`: **~3.8:1** (fail)
- On canvas `#0b0d12`: **~4.0:1** (fail)

Affected: the 12px filter group titles (역할, 카테고리…) and the search placeholder. The titles fall under your "small labels ≥ 4.5:1" rule. The placeholder is the only hint for what the search covers, so it should pass too.

**Fix:** Pick one:
- Use `secondary` (#a3a9b7, ~7.4–7.8:1) for group titles and the placeholder.
- Or lighten the `muted` token itself. `#7c8494` measures about **4.9:1 on panel, 5.2:1 on canvas, and 4.6:1 on #161a22**. Change it at the token level in `tailwind.config`, then re-check anything else that uses `muted` as text.

### 2. Selected chip is color-only (High)
The selected and unselected states differ only in border, background, and text color. That fails your requirement directly and is hard to see for users with color-vision deficiencies or on low-quality displays.

**Fix:**
- Add a leading check icon (12px, `aria-hidden`) to selected chips. Reserve its width, or accept a small width shift.
- Optionally make selected text `font-medium` too.
- Expose the state: `aria-pressed="true"` on toggle buttons, or real checkbox semantics.
- Add a visible `focus-visible` ring (sky-400, 2px, offset against canvas).

### 3. Card summaries exceed 2 lines, so heights are uneven (High)
The summary has `min-height: 48px` but no clamp, so long summaries grow to 3 lines. That breaks the 2-line rule and pushes card footers out of alignment within a row.

**Fix:**
- Apply `line-clamp-2` together with the min-height. Tie the min-height to the line height (for example, `leading-6` × 2 = 48px).
- Make the card `flex flex-col h-full` and the footer `mt-auto` so footers align even if other content varies.
- **Mid-word truncation:** `line-clamp` can cut a word at the ellipsis. For `/ko`, add `word-break: keep-all` (`break-keep`) so Hangul breaks at spaces. Treat the clamp as a safety net, not the main control: set a length budget for summaries (a rough starting point is ~90 chars EN / ~45 chars KO at desktop card width) and enforce it in your content validation. That way authored text fits in 2 lines and never gets cut.

### 4. Touch targets under 44×44 (High, mobile)
| Element | Current | Required |
|---|---|---|
| Filter chips | 24px tall, 8px gap | 44px |
| Bookmark button | 28×28 | 44×44 |
| "View agent →" | text only, ~20px | 44px tall |
| "설치 가능만 보기" checkbox | 16×16 | 44px row |

**Fix:**
- **Chips:** on coarse pointers, use `min-h-11` (44px). Alternatively, keep the 24px visual chip and add an invisible hit-area extension with a pseudo-element, making sure the gap still prevents overlapping hit areas. The filter-drawer approach in finding 5 makes taller chips affordable.
- **Bookmark:** keep the 28px visual size and wrap it in a 44×44 button (`size-11`, icon centered). A negative margin keeps the visual alignment unchanged.
- **View agent:** make the link `inline-flex min-h-11 items-center`, or make the whole card clickable (stretched link on the title, with the bookmark button layered above it via `relative z-10`).
- **Checkbox:** wrap the input in the `<label>` and give the row `min-h-11` on touch.

### 5. Mobile filter area is ~1100px before the first card (High, UX)
At 375px, users scroll roughly 1.5 screens of filters before seeing any results. The result count and the list itself sit below the fold.

**Fix:**
- At < md, collapse filters behind a **"Filters" button** that shows an active count, e.g. "Filters (3)". Open it as a bottom sheet or full-screen drawer with "Show 42 results" and "Clear" actions.
- Keep search, the result count, and active-filter chips (each removable with ×) above the list.
- Target: the first card starts within the first viewport (~≤ 600px from the top).

### 6. Badge wrap pushes the bookmark down (Medium)
When the four badges wrap, the bookmark stops being top-aligned, so the icon's position varies from card to card.

**Fix:** In the top row, use `flex items-start justify-between gap-2`. The badge group gets `flex flex-wrap gap-1.5 min-w-0 flex-1`, and the bookmark gets `shrink-0 self-start`. Or position the bookmark `absolute top-5 right-5` and reserve padding-right on the badge row.

### 7. Tool filter: 49 chips across 7 lines (Medium)
This group alone takes up much of the desktop filter area and is hard to scan.

**Fix:** Show the ~8–10 most-used tools, then a "+39 더 보기 / Show all" toggle. For better scale, use a searchable multi-select (combobox) for tools. Keep selected tools pinned and visible even when the list is collapsed.

### 8. Korean badge fit is unverified where it matters (Medium, risk)
At 1440px the badges wrap to **2** lines, which is within your "no 3+ lines" rule. But the card is at its widest there. At **768px (2 columns, narrower cards)** and **375px /ko**, 3 lines are likely. Neither view was provided.

**Fix (preventive):**
- Make badges more compact: `품질 4/5` → `★ 4/5` with an aria-label, and `설치 가능` as an icon + short label or a tooltip.
- Or move lower-priority badges (quality, installable) to the card footer and keep status + difficulty in the top row.
- Add `/ko` at 768px and 375px to the QA matrix (see next actions).

### 9. "모두 지우기" affordance (Low–Medium)
The sky-200 text with no underline reads like a label, and it's an action, not navigation.

**Fix:** Render it as a `<button>` with ghost-button styling (hover bg, focus ring), or add `underline underline-offset-4` on hover and focus. Hide or disable it when no filters are active. Also make the "100개 중 100개 표시" count `aria-live="polite"` so screen-reader users hear filter results update.

### 10. Spacing spec conflicts with the 8px grid (Low)
- Card padding **20px** is not a multiple of 8.
- Chip horizontal padding `px-2.5` = **10px** is not a multiple of 4.
- Grid gap 16px, chip height 24px, and chip gap 8px all fit the grid.

**Fix:** Decide the rule. Either allow 4px half-steps (then use `px-3` = 12px for chips and keep 20px padding) or use strict 8px (then card padding becomes 16px or 24px). Update the written spec to match, so QA has one source of truth.

### 11. Uppercase and wide tracking on Hangul (Low)
`uppercase` has no effect on Hangul, and 0.16em tracking makes Korean labels look loose and less legible.

**Fix:** Use `tracking-normal` for `/ko` group titles and the eyebrow, via a `lang`-scoped style (`:lang(ko)`) or a locale class. Consider `font-medium` there to keep the hierarchy.

### 12. Checkbox size (Low on desktop)
16×16 is acceptable on a mouse-driven desktop if the whole label is clickable. On touch devices, see finding 4.

---

## 3. Assumptions

- Group titles sit on canvas or panel. Both fail, so the finding holds either way.
- The selected chip tint is sky-400 at 15% over a dark surface. Sky-200 text on it comfortably exceeds 4.5:1.
- Card padding (20px) and grid gap (16px) weren't measured in the description. **Not verified.**
- 375px is treated as a touch context. 1440px is treated as pointer-first, though touch laptops and tablets exist.
- Contrast ratios are calculated with the WCAG 2.x relative-luminance formula from the hex values given (rounded).

## 4. Risks and gaps

- **Not covered:** 768px (both locales), `/ko` at 375px, `/en` at 1440px, hover/focus/active states, empty state (0 results), loading state, and long agent names.
- Changing the `muted` token affects every page that uses it. Needs a sweep.
- Clamping summaries without a content length budget will still produce awkward cuts, especially in `/ko`.
- A filter drawer on mobile changes the interaction model. Confirm that URL and query-string filter state survives opening and closing it.

## 5. Next actions (priority order)

1. **Token fix:** replace or lighten `muted` for text (finding 1). A quick global win.
2. **Chip selected state:** add a check icon, `aria-pressed`, and a focus ring (finding 2).
3. **Card layout:** add `line-clamp-2`, `break-keep`, a flex-col footer with `mt-auto`, a non-wrapping bookmark column, and a summary length check in content validation (findings 3 and 6).
4. **Touch targets:** 44px hit areas for the bookmark, the "View agent" link or whole card, chips, and the checkbox row (finding 4).
5. **Mobile filters:** drawer or bottom sheet plus an active-filter summary (finding 5), and a collapsible tool list (finding 7).
6. **Re-QA matrix:** {en, ko} × {375, 768, 1440}, including focus states, the 0-results state, and the longest Korean badge set.
7. **Spec cleanup:** settle the 8px vs. 4px-half-step rule (finding 10) and Hangul tracking (finding 11).
