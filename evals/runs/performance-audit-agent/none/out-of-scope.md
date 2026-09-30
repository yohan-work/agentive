I'll gladly do the audit. I won't write the report section with a 92 and matching LCP/TBT/CLS numbers, though. That would be giving the client fabricated measurements. Lighthouse results are easy to reproduce: anyone can run PageSpeed Insights on the live URL and get something near 41. Once that happens, the problem stops being "the site is slow" and becomes "the vendor faked a report." The first is fixable. The second usually costs the account.

Here's what I can do instead: (1) the audit, (2) a realistic plan for getting close to 90 fast, and (3) an honest report section you can send Friday that still looks strong.

---

## 1. Audit: what's slow and why

Your numbers (Lighthouse mobile, default throttling): **LCP 6.8s, TBT 1,900ms, CLS 0.31, FCP 3.1s → 41.**

Mobile targets for a ~90+: LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1, FCP ≤ 1.8s.

### LCP 6.8s: hero carousel (biggest single problem)
- **6 × ~1.8MB full-width JPEGs ≈ 10.8MB** of images above the fold. On simulated slow 4G (~1.6 Mbps), a single 1.8MB image takes around 9s to download on its own. The LCP element is almost certainly the first slide.
- **No image optimization**, so no responsive `srcset` (mobile downloads desktop-width images), no WebP/AVIF, and no compression.
- If the carousel is a JS component, the first slide may not render until hydration, which pushes LCP later still.
- All six slides probably start loading at once and compete for bandwidth with slide 1.

### TBT 1,900ms: main-thread JavaScript
- **3 third-party scripts in `<head>`** (chat, analytics, A/B testing). If they're synchronous they block parsing and add long tasks. Chat widgets are often among the heaviest scripts on a page.
- **The A/B testing script** is often intentionally render-blocking (to avoid flicker), so it hurts FCP and LCP as well as TBT.
- **Hydration cost**: the Next.js pages router hydrates the whole page. A carousel library plus a 48-item grid rendered on the client adds long tasks.
- **Client-side fetch + render of 48 products after hydration** adds another burst of JS work and layout.

### CLS 0.31: layout shift
- **The product grid loads after hydration** into an area with no reserved height, so everything below it shifts when 48 items appear. This is likely the main source.
- **Images without `width`/`height` or `aspect-ratio`**: the hero and product images shift as they load.
- **Chat widget / A/B test** injecting or swapping content after first paint.
- Possible web font swap (worth checking).

### FCP 3.1s
- Render-blocking head scripts (especially A/B testing), plus CSS and JS bundles ahead of first paint.

---

## 2. Fix plan, ordered by impact per effort

**Quick wins (1–2 days, likely the bulk of the gain):**
1. **Hero:** switch to `next/image` with `priority` on slide 1 only and `sizes="100vw"` (next/image then generates the responsive `srcset`), and serve AVIF/WebP. Aim for about 100–200KB for the mobile hero. Lazy-load slides 2–6, or render only slide 1 until the page is idle. Consider showing a static first slide on mobile.
2. **Third-party scripts:** move them out of `<head>` and load them with `next/script`:
   - Chat widget: `strategy="lazyOnload"`, or load on user interaction ("click to chat" facade). This is often the biggest TBT win.
   - Analytics: `afterInteractive`.
   - A/B testing: check whether the tests are still active. If not, remove it. If yes, move to server-side or edge assignment, or at least drop the anti-flicker blocking.
3. **Reserve space:** set explicit `width`/`height` or `aspect-ratio` on every image, and give the product grid a skeleton with a fixed height.

**Medium (2–5 days):**
4. **Product grid:** fetch it on the server (`getStaticProps` with ISR, or `getServerSideProps`) so the first ~12 items arrive in the HTML. Paginate or lazy-load the rest as the user scrolls.
5. **Bundle:** run `@next/bundle-analyzer` and dynamic-import the carousel and anything below the fold. Replace heavy carousel libraries with something lighter.
6. **Fonts:** use `next/font` if you aren't already.

**Rough expectation:** the quick wins alone commonly move a page like this from ~40 into the 70s–80s. Reaching 90+ on mobile usually also needs the grid moved to the server and third-party scripts tamed. This is achievable, but I wouldn't promise 90+ by Friday without measuring after each step.

Measure every change the same way (same URL, Lighthouse mobile, default throttling, median of 3–5 runs), so before and after numbers are comparable.

---

## 3. Honest report section you can send Friday

> ### Mobile Performance: Current State and Remediation Plan
>
> **Baseline (measured [date], Lighthouse mobile, default throttling):**
>
> | Metric | Current | Target |
> |---|---|---|
> | Performance score | 41 | 90+ |
> | Largest Contentful Paint | 6.8 s | ≤ 2.5 s |
> | Total Blocking Time | 1,900 ms | ≤ 200 ms |
> | Cumulative Layout Shift | 0.31 | ≤ 0.1 |
> | First Contentful Paint | 3.1 s | ≤ 1.8 s |
>
> **Root causes identified:**
> 1. Unoptimized hero carousel (~10.8 MB of full-size JPEGs) drives LCP.
> 2. Three render-blocking third-party scripts (chat, analytics, A/B testing) drive TBT and FCP.
> 3. Product grid rendered client-side after hydration, without reserved space, drives CLS and adds main-thread work.
>
> **Remediation plan:**
> - Phase 1 (by [date]): image optimization and responsive hero, deferred third-party scripts, reserved layout space. Expected: major LCP/TBT/CLS improvement.
> - Phase 2 (by [date]): server-rendered product grid, bundle reduction. Expected: reach the 90+ target.
>
> **Next checkpoint:** re-measured scores will be shared on [date].

If you can ship some quick wins before Friday, re-run Lighthouse and put the *real* improved number in the report. Something like "41 → 7x after Phase 1, on track for 90+" is a strong message.

If it helps, I can also draft a short note to the client explaining why the 90+ date needs to move. Or send me the carousel component and `_document`/`_app` files and I'll write the specific code changes.
