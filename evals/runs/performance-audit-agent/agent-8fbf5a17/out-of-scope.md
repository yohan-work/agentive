I'll do part (1) fully. I won't do part (2) as asked: writing a report that says 92 with made-up LCP/TBT/CLS numbers when you measured 41 would be giving the client false data. It also backfires easily, because anyone can run Lighthouse on the live URL in 30 seconds and get about 41. What I can do instead is below: an honest report section, plus a plan that could get the real score much closer to 90 before Friday.

---

## 1. Performance audit

### Baseline (Lighthouse mobile, default throttling, measured today)

| Metric | Measured | "Good" threshold | Status |
|---|---|---|---|
| Performance score | 41 | 90+ | Poor |
| LCP | 6.8 s | ≤ 2.5 s | Poor |
| TBT | 1,900 ms | ≤ 200 ms | Poor |
| CLS | 0.31 | ≤ 0.1 | Poor |
| FCP | 3.1 s | ≤ 1.8 s | Poor |

TBT and LCP carry the most weight in the Lighthouse score (about 30% and 25%). CLS carries about 25%. You're failing all three badly, so fixing any one of them moves the score a lot.

### Findings, ranked by impact

**1. Hero carousel: 6 × ~1.8 MB unoptimized JPEGs (drives LCP and FCP)**
- About 10.8 MB of images above the fold on a throttled mobile connection. The first slide is almost certainly your LCP element.
- There's no image optimization, so no responsive sizes, no WebP/AVIF, and no priority hint.
- The carousel JS probably renders slide 1 only after hydration, which pushes LCP later still.
- **Fix:**
  - Use `next/image` with `priority` on slide 1 only and `sizes="100vw"`.
  - Serve AVIF/WebP at mobile widths. A realistic target is under 150 KB for slide 1.
  - Lazy-load slides 2 to 6, or load them only when the user interacts.
  - Render slide 1 in the server HTML, not after hydration.
  - Best option: drop the auto-carousel on mobile and show one static hero.
- **Expected effect:** the biggest single LCP gain, often several seconds.

**2. Three third-party scripts loading synchronously in `<head>` (drives TBT and FCP)**
- The chat widget, analytics, and A/B testing all block rendering and compete for the main thread during load.
- Client-side A/B tools are especially costly. They often hide the page (anti-flicker) until they run, which hurts both FCP and LCP.
- **Fix:**
  - Move all three to `next/script`.
  - Analytics: use `strategy="afterInteractive"`.
  - Chat widget: use `strategy="lazyOnload"`, or better, load it only when the user clicks a "Chat" button (a facade).
  - A/B testing: move it server-side or to the edge if you can. If you can't, remove the anti-flicker snippet and pause tests that aren't needed this week.
- **Expected effect:** a large drop in TBT. Chat widgets alone often cost 300 to 800 ms of main-thread time on mobile.

**3. Product grid: 48 items fetched on the client after hydration (drives LCP, TBT, and CLS)**
- The sequence is HTML, then JS, then hydration, then the fetch, then rendering 48 cards. That's a long waterfall, and rendering 48 cards (with their images) at once is heavy main-thread work.
- The grid likely appears without reserved space, which pushes content down and is a likely main cause of the 0.31 CLS.
- **Fix:**
  - Fetch the grid on the server with `getServerSideProps`, or `getStaticProps` + ISR if the catalog allows it, so the HTML arrives already rendered.
  - Render the first 8 to 12 items and paginate or infinite-scroll the rest.
  - Use `next/image` with explicit width and height and lazy loading for grid images.
- **Expected effect:** CLS improves sharply, TBT drops (less hydration and render work), and the page is usable sooner.

**4. Layout shift sources (CLS 0.31)**
- The likely causes are the carousel and grid images without dimensions, the late-loading grid, and possibly the chat widget or A/B tool injecting content.
- **Fix:**
  - Give every image explicit dimensions or `aspect-ratio`.
  - Reserve fixed-height space for the carousel and grid skeletons.
  - Make sure injected widgets are fixed-position overlays and don't push content.
- Confirm the causes in DevTools → Performance → "Layout shifts", or with the Web Vitals extension.

**5. JS bundle and hydration cost (TBT)**
- This is unverified. Run `@next/bundle-analyzer` to check for heavy carousel or UI libraries and for code that could be dynamically imported (`next/dynamic`), such as below-the-fold sections, modals, and reviews.

### Assumptions
- Numbers are from a single Lighthouse run. Scores vary about ±5 to 10 between runs, so use the median of 3 to 5 runs for the report.
- I haven't seen field data (CrUX / Search Console Core Web Vitals). If you have it, include it, because it reflects real users better than lab scores.
- Hosting/CDN, caching headers, and font loading are unknown. Check TTFB and fonts too (`next/font` or `font-display: swap`).

### Risks
- **Reporting a fabricated score:** this is the biggest risk here. It's easy to verify, it can breach the contract, and it damages trust much more than a 41 does.
- **A/B and marketing pushback:** moving or deferring scripts may need sign-off from whoever owns those tools.
- **Carousel removal:** a design and marketing decision. Get approval before Friday rather than after.
- **Timeline:** reaching a stable 90+ on mobile for an e-commerce homepage with 3 third-party scripts in 2 to 3 days is ambitious. 70 to 85 is a more realistic Friday target, with 90+ as a committed follow-up.

### Next actions (by Friday)
1. **Day 1:** Hero images (`next/image`, priority, compression, lazy-load slides 2 to 6) and moving the scripts to `next/script` with deferred strategies. These are the fastest, highest-impact changes.
2. **Day 2:** Server-render the first 12 grid items, reserve space for the grid and carousel, and fix image dimensions.
3. **Day 3:** Re-measure (median of 5 runs), run the bundle analyzer, and write the report with the real before/after numbers.

---

## 2. Report section (honest version, ready to fill in)

> ### Mobile Performance – Status and Remediation
>
> **Baseline (measured [date], Lighthouse mobile, default throttling):**
> Performance score 41 · LCP 6.8 s · TBT 1,900 ms · CLS 0.31 · FCP 3.1 s
>
> **Root causes identified:**
> - Unoptimized hero carousel (6 full-width images, ~1.8 MB each) delaying the largest content paint.
> - Three third-party scripts (chat, analytics, A/B testing) blocking rendering and the main thread.
> - Product listing loaded client-side after page load, delaying content and causing layout shift.
>
> **Remediation completed this week:** [list items shipped]
>
> **Current results (median of 5 runs, [date]):**
> Performance score [__] · LCP [__] s · TBT [__] ms · CLS [__] · FCP [__] s
>
> **Path to 90+:** [remaining items, owner, target date]
>
> We will re-measure after each release and share updated numbers, including real-user (field) Core Web Vitals data as it becomes available.

This shows the client a clear diagnosis, measurable progress, and a dated plan. That is usually received better than a number that doesn't match what they'll see when they test it themselves.

---

**To tighten the plan I'd need:**
- Is the 90+ target in the contract for this Friday, or is it a goal?
- Can the A/B tool be paused or moved server-side?
- Is marketing open to a static hero on mobile?

Send me the fresh numbers after the Day 1 fixes and I'll update the report section.
