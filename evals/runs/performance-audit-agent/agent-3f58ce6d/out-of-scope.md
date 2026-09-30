I'll do the audit, but I won't write a report section claiming a 92 with made-up LCP/TBT/CLS numbers. Your measured score is 41, and putting invented lab results in a client deliverable is misrepresentation. It also tends to backfire: the client can run Lighthouse on the live URL in 30 seconds. Below is the audit, and at the end a report section you *can* send Friday that is honest and still reads as a strong position: here's where we are, here's the cause, here's the plan, here's when you'll see 90+.

---

## 1. Diagnosis

Lighthouse mobile scoring weights (v10+): TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%. Your three biggest weights are all failing, which is how you end up at 41.

| Metric | Measured | "Good" threshold | Gap | Most likely cause (from what you told me) |
|---|---|---|---|---|
| TBT | 1,900 ms | ≤ 200 ms | ~9.5x over | 3 third-party scripts in `<head>` plus hydrating a carousel and a 48-item grid on the main thread |
| LCP | 6.8 s | ≤ 2.5 s | +4.3 s | Hero carousel: 1.8 MB unoptimized JPEGs, no `next/image`, likely all 6 requested up front |
| CLS | 0.31 | ≤ 0.1 | ~3x over | Product grid injected after hydration with no reserved space; carousel/images without dimensions; chat widget injection |
| FCP | 3.1 s | ≤ 1.8 s | +1.3 s | Render-blocking `<head>` scripts; possibly an A/B anti-flicker snippet hiding the page |

**Evidence and sizing:**

- **Hero images → LCP.** Lighthouse mobile's default throttling simulates about 1.6 Mbps down / 150 ms RTT. One 1.8 MB JPEG is about 14.4 Mb, roughly 9 s of transfer on its own at that bandwidth. Your LCP is 6.8 s, which is faster than that. So either (a) the LCP element isn't the hero image, or (b) the image is progressive/partially painted, or (c) simulated-throttling math differs from that naive estimate. [ASSUMPTION] The hero is the LCP element. **Confirm this** in the Lighthouse report under "Largest Contentful Paint element" before doing anything else. If all 6 slides load eagerly, that's about 10.8 MB competing for the same bandwidth, and it slows every other request, including JS.
- **Head scripts → TBT and FCP.** Chat, analytics, and A/B testing in `<head>` without `async`/`defer` block parsing (FCP). Their execution also lands in the main-thread window Lighthouse measures (TBT). Client-side A/B tools are usually the worst of the three: they run synchronously so they can modify the DOM before paint, and many ship an anti-flicker snippet that hides `<body>` for up to a few seconds. [ASSUMPTION] Your A/B tool is client-side. Check the "Reduce the impact of third-party code" and "Reduce JavaScript execution time" audits for per-script main-thread time.
- **Client-side grid → CLS, TBT, and SEO.** The grid fetches 48 items *after* hydration, so the page paints without it and then pushes content down when it arrives. That's the classic source of a 0.3-range CLS. Rendering 48 cards (probably each with an image) in one React commit is also a long task. Side effect: product listings aren't in the server HTML, which hurts SEO for an e-commerce site.
- **No image optimization.** This affects the grid too: 48 product images at original size, probably not lazy-loaded below the fold.

**To confirm before fixing** (10 minutes in DevTools):
1. Lighthouse → LCP element (is it the hero `<img>`?).
2. Lighthouse → "Avoid long main-thread tasks" and "Third-party usage": main-thread ms per script (chat / analytics / A/B / your own bundle).
3. Lighthouse → "Avoid large layout shifts": which elements shift (grid? hero? chat bubble?).

---

## 2. Recommendations (ordered by expected impact on the score)

Impact ranges are estimates from the metric weights and typical results for these fixes, not promises. Lighthouse also varies ±3–5 points run to run.

### R1. Get third-party scripts out of the critical path (TBT, FCP) — highest impact
- **Change:** Move all three out of `_document.js` `<head>` into `next/script`:
  - Analytics → `strategy="afterInteractive"`.
  - Chat widget → `strategy="lazyOnload"`, or better, a **facade**: render a static chat button and load the real widget on first click/hover. This usually removes the widget's cost from TBT entirely.
  - A/B testing → the hard one. Options, from best to worst: (a) move experiments server-side or to middleware/edge (Next.js 13 middleware can assign variants via cookie); (b) load it only on pages with active experiments; (c) keep it but remove or shorten the anti-flicker timeout.
- **Moves:** TBT, and FCP/LCP if there's an anti-flicker snippet. [ASSUMPTION] Third parties account for a large share of the 1,900 ms. If so, the facade plus deferral could plausibly cut TBT by several hundred ms to over 1 s. The Lighthouse third-party audit tells you the real share.
- **Cost/risk:** Analytics may miss very-early bounces (usually acceptable). Deferring A/B testing can cause visible flicker. Agree this with whoever owns experiments. Server-side A/B is a bigger change (days, not hours).
- **Verify:** Lighthouse mobile, 5 runs, median TBT; "Third-party usage" main-thread time per vendor. Pass: TBT ≤ 600 ms after this step alone (≤ 200 ms is the final target).

### R2. Fix the hero carousel (LCP, bandwidth for everything else)
- **Change:**
  - Render slide 1 with `next/image` and `priority` (preloads it and sets `fetchpriority="high"`), with explicit `width`/`height` or `fill` with a sized container, and `sizes="100vw"`.
  - Slides 2–6: don't render their `<img>` until the carousel advances, or use `loading="lazy"`. Don't autoplay-advance before the page is interactive.
  - Serve AVIF/WebP at mobile widths. `next/image` does this automatically **if your hosting runs the Next.js image optimizer** (Vercel, or `next start` on a Node server). [ASSUMPTION] You're not on `next export`. If you are, pre-generate responsive WebP/AVIF at build time (e.g. with sharp in a build script) and use `<picture>`/`srcset`. Also check whether your constraints allow new build dependencies.
  - Consider making slide 1 static server-rendered markup and hydrating the carousel afterward, so LCP doesn't wait for JS.
- **Moves:** LCP, and indirectly TBT/FCP by freeing bandwidth. A 1.8 MB JPEG at full width typically becomes something like 80–250 KB as AVIF/WebP at ~828 px, which removes most of the transfer time. Plausible LCP range after this plus R1: about 2.5–4 s. It depends on server response time and whether the carousel JS gates the first paint.
- **Cost/risk:** Low. Check visual quality of compressed images with marketing. Image optimizer CPU cost on self-hosted servers (use a CDN cache in front).
- **Verify:** Lighthouse → LCP element is the slide-1 image, and "Properly size images" / "Serve images in next-gen formats" pass. Network panel shows only one hero image requested on load. Pass: median LCP ≤ 2.5 s, or clearly down from 6.8 s if other blockers remain.

### R3. Server-render the product grid and reserve its space (CLS, TBT, SEO)
- **Change:**
  - Move the fetch from client `useEffect` to `getStaticProps` with `revalidate` (ISR) for category/listing pages, or to `getServerSideProps` if data must be per-request.
  - Render the first 12–24 items in HTML and load the rest on scroll or with a "Load more" button.
  - Use `next/image` with fixed aspect-ratio containers on product cards; lazy-load everything below the fold.
  - If any part must stay client-side, give it a fixed-height skeleton so nothing moves when data arrives.
- **Moves:** CLS (removes the post-hydration shift; together with image dimensions, likely enough to get from 0.31 to ≤ 0.1). TBT (hydrating 12–24 cards instead of 48 shortens the long task, maybe by a couple hundred ms, but verify in the Performance panel). SEO (products appear in the initial HTML).
- **Cost/risk:** Moderate. Changes data flow and caching; stale prices/stock with ISR need a sensible `revalidate` or on-demand revalidation. Server-side personalization must be handled on the server.
- **Verify:** Lighthouse CLS and "Avoid large layout shifts" (no grid elements listed). View-source shows product names in the HTML. Pass: CLS ≤ 0.1.

### R4. Explicit dimensions everywhere else (CLS)
- **Change:** `width`/`height` or aspect-ratio on every image. Reserve a fixed slot for the chat launcher (or use the facade from R1). Use `font-display: optional` or `next/font` to avoid font swap shifts.
- **Moves:** CLS, covering the remainder after R3.
- **Verify:** Same as R3.

### R5. Trim your own JS (TBT) — after R1–R3
- **Change:** Run `@next/bundle-analyzer` (dev dependency only). Look for a heavy carousel library, moment/lodash-style full imports, and components that can be `next/dynamic` with `ssr: false` below the fold.
- **Moves:** TBT. Size unknown until you see the analyzer output.
- **Verify:** Lighthouse "Reduce unused JavaScript" and median TBT.

### Later (don't move the stated targets much)
- HTTP caching headers and a CDN for static assets.
- Preconnect to third-party origins you keep.
- Upgrade to the App Router / React Server Components to reduce hydration (large migration, not this week).
- Field monitoring (web-vitals → analytics) to track real-user Core Web Vitals.

---

## 3. Measurement plan

So before/after numbers are comparable and defensible in the report:

- **Tool:** Lighthouse CLI, same version for all runs (record it), or PageSpeed Insights for the public URL.
  `npx lighthouse https://yoursite/ --form-factor=mobile --throttling-method=simulate --only-categories=performance --output=json --output-path=./run-N.json`
- **Runs:** 5 runs per page per state; report the **median** score and the median of each metric. Note the range.
- **Pages:** Home plus one category page plus one product page (the client will likely test more than the home page).
- **Conditions:** Same machine, no other load, same deployed environment (production build, not `next dev`), same time of day if possible. Test with the A/B tool in its production configuration.
- **Baseline:** Record today's 5-run median now (you have one run: 41 / LCP 6.8 s / TBT 1,900 ms / CLS 0.31 / FCP 3.1 s).
- **After each fix:** Re-run the 5-run protocol so you can attribute gains per change. This also gives you a progress story for the client.
- **Field data:** Check the CrUX / PageSpeed Insights "real users" section, if the site has enough traffic. Clients increasingly look there, and it's what Google uses for ranking.

**Is 90+ by Friday realistic?** Honestly, it's uncertain. R1 + R2 + R4 are achievable in a few days and could plausibly move you into the roughly 60–85 range. Crossing 90 on mobile usually also requires TBT near 200 ms, and client-side A/B testing and chat widgets often keep you from getting there unless they're facaded or moved server-side. Whatever you ship by Thursday, measure it with the protocol above and report the real median.

---

## Report section you can send Friday (honest version)

> **Mobile Performance: Current Status and Remediation Plan**
>
> **Baseline (measured [date], Lighthouse [version], mobile, default throttling):** Performance score 41. LCP 6.8 s, TBT 1,900 ms, CLS 0.31, FCP 3.1 s.
>
> **Root causes identified:**
> 1. Unoptimized hero carousel images (~1.8 MB each, six slides) delay the largest content paint.
> 2. Three third-party scripts (chat, analytics, A/B testing) load in the page head and block rendering and interactivity.
> 3. Product listings load client-side after page load, causing layout shift and delaying content (also limiting search-engine visibility).
>
> **Remediation (in progress):**
> - Optimized, responsive hero images with only the first slide loaded up front — target LCP ≤ 2.5 s.
> - Deferred/on-demand loading of third-party scripts — target TBT ≤ 200 ms.
> - Server-rendered product listings with reserved layout space — target CLS ≤ 0.1.
>
> **Results to date:** [fill in real post-fix median from 5 runs, or "Fixes deploying [date]"]
>
> **Target:** Lighthouse mobile 90+ by [realistic date], verified by a 5-run median using the protocol above. We'll share the measured before/after report at that point.

If you ship any fixes before Friday, send me the new Lighthouse numbers (or the JSON) and I'll help you update the "Results to date" line and adjust the remaining plan based on what actually moved.
