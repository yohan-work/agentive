Here's a design QA pass based on your descriptions. I've checked each item against your stated requirements, and where contrast matters I've calculated the ratios from the hex values you gave.

**Severity scale**
- **High:** fails a stated requirement or accessibility baseline, or badly hurts the core task.
- **Medium:** visible inconsistency or friction.
- **Low:** polish.

---

## Summary

| # | Finding | Screen | Severity |
|---|---|---|---|
| 1 | Muted text (#6b7280) fails 4.5:1 on both panel and canvas | Both | High |
| 2 | Selected filter chip is distinguished by color only | Both | High |
| 3 | Touch targets under 44×44 (chips, bookmark, "View agent", checkbox) | 375px | High |
| 4 | ~1100px of filters before the first result on mobile | 375px | High |
| 5 | Card summaries run to 3 lines; not line-clamped; uneven card heights | 1440px | High (spec) / Medium (visual) |
| 6 | Badge wrap pushes bookmark button out of top alignment | 1440px | Medium |
| 7 | Tool filter group: 49 chips / 7 rows | 1440px | Medium |
| 8 | Chip padding (10px horizontal) and card padding (20px) are off the 8px grid | Both | Low |
| 9 | Uppercase + 0.16em tracking applied to Korean text | /ko | Low |
| 10 | "모두 지우기" link styling / semantics | 1440px | Low |
| 11 | Coverage gaps: /ko at 375 and 768 not checked | — | Needs verification |

---

## Findings

### 1. Muted text fails contrast (High)
Here are the ratios I calculated:

| Foreground | Background | Ratio | Req. 4.5:1 |
|---|---|---|---|
| muted #6b7280 | panel #11141b | **~3.8:1** | Fail |
| muted #6b7280 | canvas #0b0d12 | **~4.0:1** | Fail |
| secondary #a3a9b7 | panel #11141b | ~7.8:1 | Pass |
| secondary #a3a9b7 | chip bg #161a22 | ~7.4:1 | Pass |
| sky-400 #38bdf8 | canvas | ~9:1 | Pass |

**Where it's used:** the 12px filter group titles (역할, 카테고리, …) and the search placeholder. Small labels need to meet 4.5:1 under your own requirement, and 12px uppercase text is exactly the case where low contrast hurts most.

**Fix:** raise the `muted` token to about **#858b98**, which gives ~5.4:1 on panel and ~5.7:1 on canvas. That still leaves visible hierarchy below secondary (#a3a9b7). Change it at the token level rather than per component, and re-check anything else using `muted` (timestamps, footers, helper text).

The placeholder should also not be the only description of the field. Keep a visible label or an `aria-label` such as "에이전트 검색".

### 2. Selected chip relies on color alone (High)
Selected and unselected chips differ only in border color, background tint and text color, with the same shape and weight. That breaks your requirement ("more than color alone"). It also fails for colorblind users, and on the dark panel the 15% sky tint is subtle.

**Fix:** add a non-color signal, ideally two of these:
- A leading check icon (12px) on selected chips.
- `font-medium` on selected chips.
- Border at full opacity rather than 40%.

Expose the state to assistive tech with `aria-pressed="true"` on chip buttons, or use checkbox semantics if they're multi-select. To stop chips jumping when the icon appears, reserve its space or animate the width. Otherwise the whole wrapped row reflows on every click.

### 3. Touch targets below 44×44 on mobile (High)
| Element | Size at 375px | Required |
|---|---|---|
| Filter chips | 24px tall | 44px |
| Bookmark icon button | 28×28 | 44×44 |
| "View agent →" link | ~20px tall, text-only | 44px |
| "설치 가능만 보기" / install-only checkbox | 16×16 | 44×44 |

**Fixes:**
- **Bookmark:** keep the 28px visual but grow the hit area to 44px with padding plus negative margin, or an `::after` overlay (`absolute -inset-2`).
- **View agent:** make the whole card the link, using a stretched-link pattern: `relative` on the card and `after:absolute after:inset-0` on the link. Give the bookmark button `relative z-10` so it still gets its own taps. If you'd rather keep the link separate, give it `min-h-11 inline-flex items-center`.
- **Checkbox:** wrap the checkbox and its text in one `<label>` with `min-h-11 flex items-center gap-2`, so the text is tappable too.
- **Chips:** raising them to 44px as they are would make finding 4 much worse. Solve both together by moving filters into a sheet (see 4), where chips or list rows can be 44px tall.

Also mark the "→" as `aria-hidden`, and add the agent name for screen readers (e.g. `<span class="sr-only">: {agent name}</span>`), so there aren't 100 identical "View agent" links.

### 4. Filters push results ~1100px down on mobile (High)
On a 375px screen that's roughly 1.5–2 screen heights of controls before the user sees a single agent. Browsing is the primary task, so this is the biggest UX problem on mobile.

**Fix, recommended:**
- Below `md`, replace the stacked groups with a sticky row holding the search input and a **"Filters (n)"** button.
- The button opens a bottom sheet or full-screen dialog with the groups as accordions, plus "Clear all" and "Show N results" actions.
- Show active filters as removable chips in a single horizontally scrollable row above the results.

**Lighter alternative:** collapse every group into an accordion that starts closed, and put the tool group behind its own search (see 7).

### 5. Card summaries: 3 lines, uneven heights (High against spec)
`min-height: 48px` sets a floor but not a ceiling. Summaries that run long spill to 3 lines, which breaks "max 2 lines", and cards in the same row end up with different heights above the footer.

**Fix:**
- **Summary:** `line-clamp-2 min-h-12` (leading-6 × 2 = 48px, which matches your current floor).
- **Card:** `flex h-full flex-col`. Summary block stays as it is. Footer: `mt-auto` so footers align across the row.
- **Grid:** keep the default `items-stretch` so cards in a row are equal height.

**Mid-word truncation:** `line-clamp` puts the ellipsis wherever the second line runs out, which can be mid-word. Clamping can't fully guarantee your "no truncation mid-word" rule, so:
- For Korean, add `word-break: keep-all` (`break-keep`) so lines break between eojeol instead of inside words.
- The real guarantee is content-side. Set a summary length budget that fits 2 lines at the narrowest card width (for example about 90 characters in English and 45–50 in Korean; measure at your actual card width). Enforce it in your content validation, and keep `line-clamp` as a safety net only.
- If a summary is clamped, make sure the full text is available on the detail page, and optionally in a `title` attribute.

### 6. Badge wrap breaks bookmark alignment (Medium)
With four badges (검증됨, 중급, 설치 가능, 품질 4/5), the row wraps and the bookmark drops out of the top-right corner. It's inconsistent from card to card, and in Korean the badges are wider, so it gets worse.

**Fix:** split the top row into two regions.
```html
<div class="flex items-start justify-between gap-3">
  <div class="flex min-w-0 flex-1 flex-wrap gap-1.5"><!-- badges --></div>
  <button class="shrink-0 self-start …"><!-- bookmark --></button>
</div>
```
Also consider cutting the badge count in the top row. For example, keep status and difficulty as badges, and move "설치 가능" and "품질 4/5" into the card footer as icon + text metadata. That also makes the Korean requirement much safer (see 11).

### 7. Tool filter: 49 chips across 7 rows (Medium)
At desktop this one group dominates the filter area and makes scanning slow.

**Fix:**
- Show the 8–12 most-used tools, followed by a "+37개 더 보기 / Show 37 more" toggle.
- Or turn the group into a searchable multi-select (combobox) and show selected tools as chips.
- Sort by frequency, not alphabetically, so the visible chips are the useful ones.

### 8. Spacing values off the 8px grid (Low)
- Chips use `px-2.5` = **10px** horizontal padding. The 24px height (4px + 16px line) is fine as a 4px half-step, but 10px isn't on either grid. Use `px-2` (8px) or `px-3` (12px, a 4px half-step).
- **Card padding of 20px is itself off the 8px grid**, so the spec contradicts itself. Decide deliberately: either allow 4px half-steps (then 20px is valid, and say so in the spec) or move to 16px/24px (`p-4` / `p-6`).
- The 8px chip gap and 16px grid gap are compliant.

### 9. Uppercase and tracking on Korean labels (Low)
The eyebrow "에이전트 라이브러리" and the group titles get `uppercase` plus 0.16em tracking. Uppercase does nothing to Hangul, and wide letter-spacing makes Korean look loose and harder to read. It also widens labels.

**Fix:** under `:lang(ko)` (or a `ko` locale class), set `tracking-normal`, and consider `font-medium` to keep the label feel. Leave the English styling as it is.

### 10. "모두 지우기" clear-all control (Low)
- It clears state rather than navigating, so it should be a `<button>`, not a link.
- It's sky-200 with no underline next to secondary-colored text, so it's told apart mostly by color. Add hover/focus underline and a visible focus ring.
- Show it only when filters are active, or disable it when nothing is filtered. With "100개 중 100개 표시" there is nothing to clear.
- Put the result count in an `aria-live="polite"` region so screen reader users hear the count change when filters change.

### 11. Coverage gaps: needs verification
From the descriptions, I can't confirm several things:
- **/ko at 375px and 768px.** The Korean badge requirement ("no wrapping onto 3+ lines") is most at risk in narrow cards. At 1440 the badges already take 2 lines. At 768 with 2 columns, or at 375, the four Korean badges could reach 3 lines. Please capture /ko at 375 and 768 with the longest badge combination. The fix in 6 (fewer top-row badges) should prevent it.
- **Focus states** for chips, the bookmark, the checkbox, and card links (a visible `focus-visible` ring against #0b0d12).
- **Bookmark button accessibility:** accessible name (`aria-label="북마크"` / "Bookmark {name}") and toggled state (`aria-pressed`).
- **Grid gap and card padding actually rendered.** The screenshots didn't state them, so check they're 16px and 20px as specified.
- **Long Korean placeholder at 375px.** "이름, 역할, 작업, 태그, 도구로 검색..." may be cut off in a full-width input on small screens. Consider a shorter one such as "에이전트 검색…".

---

## Suggested fix order
1. Raise the `muted` token (1). It's one change and fixes several failures.
2. Add a non-color selected state and `aria-pressed` to chips (2).
3. Use `line-clamp-2`, a flex-column card and a `mt-auto` footer (5), and split the badge row from the bookmark (6).
4. On mobile, build the filter sheet or accordion (4), which also solves chip target size, then fix the bookmark, "View agent" and checkbox hit areas (3).
5. Collapse the tool filter (7), then the spacing, Korean typography and clear-all cleanup (8–10).
6. Re-shoot /ko at 375 and 768 to close out 11.
