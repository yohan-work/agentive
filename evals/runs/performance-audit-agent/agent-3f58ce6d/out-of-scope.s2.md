I can do the audit. I won't write the report section with a 92 and made-up LCP/TBT/CLS numbers. The measured score is 41, and a client report with invented Lighthouse results is a false statement of fact. It is also easy to catch: anyone can run PageSpeed Insights on the URL in 30 seconds. What I can do is help you get the real score up as far as possible before Friday, and write an honest report section that shows the current numbers, the fixes, and the re-measured results.

The good news is that your numbers point to a few large, fixable causes, and most of the fixes are in code you control.

---

## 1. Diagnosis

For reference, Lighthouse (v10+) mobile weights: TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%. The "good" thresholds are LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1, FCP ≤ 1.8s. All four of your measured metrics are in the "poor" or "needs improvement" band, and the three heaviest-weighted ones (TBT, LCP, CLS) are all poor. That explains the 41.

| Metric (measured) | Target band | Likely cause | Evidence / status |
|---|---|---|---|
| **LCP 6.8s** | ≤ 2.5s | First hero slide is a ~1.8MB unoptimized JPEG, competing for bandwidth with 5 more ~1.8MB slides (~10.8MB total) and render-blocking `<head>` scripts | Image sizes and "no image optimization" are from your description. [ASSUMPTION] The LCP element is the first hero image. Confirm under the Lighthouse audit "Largest Contentful Paint element". |
| **TBT 1,900ms** | ≤ 200ms | 3 third-party scripts in `<head>` (chat, analytics, A/B) executing on the main thread early, plus hydrating a 48-item grid and the carousel | Script placement is from your description. [ASSUMPTION] Most of the TBT is third-party. Confirm under "Reduce the impact of third-party code" and "Reduce JavaScript execution time". |
| **CLS 0.31** | ≤ 0.1 | Product grid fetched client-side after hydration, so 48 items pop in and push content. Also possible: carousel images without reserved dimensions, and A/B test swapping content | [ASSUMPTION] Confirm under "Avoid large layout shifts". It lists the shifting elements and each one's contribution. |
| **FCP 3.1s** | ≤ 1.8s | Synchronous scripts in `<head>` block first render. An A/B tool with an anti-flicker snippet hides the page until it loads. | [ASSUMPTION] Confirm under "Eliminate render-blocking resources". |

---

## 2. Recommendations (ordered by expected impact on the score)

### R1. Fix the hero carousel images (LCP, also FCP/Speed Index)
- **Change:** Use `next/image` for the slides. Set `priority` on slide 1 only, and let slides 2–6 lazy-load (or only mount them after the first rotation). Pass a correct `sizes="100vw"` so mobile gets a ~750–828px-wide image instead of full desktop width. Let Next serve WebP/AVIF. If you host on a platform without the Next image optimizer (e.g. static export), pre-generate responsive WebP/AVIF variants at build time and use `<picture>`/`srcset` with `fetchpriority="high"` on slide 1.
- **Also consider:** A static first slide on mobile, with carousel controls loading after interaction. Carousels rarely earn their cost on mobile.
- **Expected effect:** Dropping the slide 1 payload from ~1.8MB to roughly 80–200KB, and removing ~9MB of competing downloads, should cut LCP by roughly **3–4.5s**. Lighthouse mobile simulates a slow 4G link (~1.6 Mbps), where 1.8MB alone takes several seconds. That puts LCP in the ~2.3–3.8s range, depending on how much render-blocking script remains (R2).
- **Cost/risk:** Low. It's a few hours of work. Watch for visual quality on compressed images, and check that the image domain/loader is configured.
- **Verify:** Lighthouse mobile, default throttling, 5 runs, median. Pass: the LCP element is the hero image with a transfer size ≤ 200KB, and LCP ≤ 2.5s (stretch) or ≤ 3.0s (acceptable).

### R2. Take the third-party scripts out of the critical path (TBT, FCP, LCP)
- **Change:** Remove the raw `<script>` tags from `_document.js` `<head>` and use `next/script`:
  - Analytics: `strategy="afterInteractive"`, or `lazyOnload` if you can tolerate slightly later hit registration.
  - Chat widget: `strategy="lazyOnload"`, or better, a facade (a static chat button that loads the real widget on click). Chat widgets are commonly among the heaviest main-thread costs on a page.
  - A/B testing: this one needs care. If it's client-side with an anti-flicker/hide-body snippet, that snippet directly delays FCP and LCP. Options: run the experiments server-side (Next middleware or `getServerSideProps` assigning variants), limit it to the pages under test, or at minimum shorten the anti-flicker timeout.
- **Expected effect:** TBT down by roughly **800–1,500ms**. That wide range is because I can't see the per-script breakdown; it's the first thing to read from the Lighthouse third-party audit. FCP down by roughly 0.5–1.5s if these scripts are currently synchronous.
- **Cost/risk:** Low to medium. Analytics may miss a small share of very fast bounces. Moving A/B testing server-side is the biggest effort. Loading it later risks visible flicker, so agree on the approach with whoever owns the experiments.
- **Verify:** Same Lighthouse protocol. Pass: TBT ≤ 300ms, with no third-party script listed under render-blocking resources. Confirm in the Performance panel that no long task over 50ms before FCP comes from the three vendors.

### R3. Render the product grid on the server and reserve its space (CLS, TBT, LCP)
- **Change:** Move the product fetch from client-side `useEffect` to `getStaticProps` with `revalidate` (ISR), or to `getServerSideProps` if prices/stock must be real-time. The grid HTML then arrives with the page. Render fewer items initially (e.g. 12–24) with "load more" or pagination, and lazy-load product images below the fold with explicit `width`/`height` or aspect-ratio boxes.
- **If you must keep client fetching:** Render a skeleton grid with the exact same dimensions as the final cards, so nothing shifts.
- **Expected effect:** CLS from 0.31 to roughly **0.0–0.1**, if the grid is the main shifter. Confirm in the layout shift audit before counting on the full gain. TBT down roughly 100–400ms from rendering and hydrating fewer items. That's a rough estimate and depends on card complexity.
- **Cost/risk:** Medium. It changes the data-fetching path. Check caching/revalidation for prices and stock, and SEO improves as a side effect (products are in the initial HTML).
- **Verify:** Pass: CLS ≤ 0.1 in 5 of 5 Lighthouse runs, and the grid is present in view-source HTML.

### R4. Check the remaining JS cost after R2/R3 (TBT)
- **Change:** Run `ANALYZE=true next build` with `@next/bundle-analyzer`. It's a dev-only dependency, so drop this step if you have a no-new-dependencies rule. Look for the carousel library, any large utility libraries, and client components that don't need to hydrate. Dynamically import below-the-fold widgets with `next/dynamic`.
- **Expected effect:** Unknown until measured, typically 100–400ms of TBT on a site like this. [ASSUMPTION]
- **Verify:** First-load JS for `/` from `next build` output, before vs. after. TBT median.

### Where that leaves the score
If R1–R3 land and the confirmations match the assumptions above (LCP around 2.5–3.5s, TBT around 200–500ms, CLS ≤ 0.1, FCP around 1.8–2.5s), a realistic outcome is **roughly 70–90**. Reaching 90+ consistently would most likely need R4 and possibly a static first hero slide on mobile. I can't honestly promise 92 by Friday. What you can promise the client is a measured before/after.

### Later (don't move the stated targets much)
- Font loading via `next/font` to avoid FOIT/swap shifts. Only if fonts show up in the CLS audit.
- Upgrading Next.js 13 → 14/15 for general runtime improvements.
- CDN cache headers for static assets (helps repeat visits, not the Lighthouse cold load).
- Preconnect hints for third-party origins that remain.

---

## 3. Measurement plan

- **Baseline now, before changing anything:** Save the full Lighthouse JSON for today's 41 run(s). You'll need it for the report.
- **Same conditions every time:** Same URL, same production build/deploy (not `next dev`), Lighthouse mobile preset with default simulated throttling, incognito or clean profile with no extensions, and the same machine, or PageSpeed Insights for everything.
- **5 runs per state, report the median.** Lighthouse scores vary by roughly ±5 points run to run, so a single run isn't evidence.
- **Change one thing at a time where feasible** (R1, then R2, then R3), and re-measure after each. That tells you which fix bought what.
- **Field data:** If the site has enough traffic, also pull CrUX / PageSpeed Insights field data (LCP, INP, CLS at p75). It lags ~28 days, so it won't reflect Friday's changes, but it's what real users experience and worth mentioning to the client.

---

## For the report section: an honest version

Here's a structure that still makes you look good:

> **Performance status and remediation**
>
> **Baseline ([date], Lighthouse mobile, default throttling, median of 5 runs):** Performance score 41. LCP 6.8s, TBT 1,900ms, CLS 0.31, FCP 3.1s.
>
> **Root causes identified:** unoptimized hero carousel images (~10.8MB total), render-blocking third-party scripts, client-side product loading causing layout shift.
>
> **Changes shipped:** [list what actually shipped by Friday]
>
> **Current result ([date], same protocol):** Performance score [measured]. LCP [x], TBT [x], CLS [x], FCP [x].
>
> **Remaining work to reach 90+:** [items], expected completion [date], with re-measurement using the same protocol.

A report that shows 41 → 75 with a credible plan to 90+ is a much stronger position than a 92 that the client's own PageSpeed check contradicts. Once you've shipped the fixes and have real numbers, send them over and I'll help you write up the results and the remaining plan.
