I'll write the full test case matrix for the payment step, but I can't mark them PASS with today's date. A Result column filled with PASS for tests that never ran records a verification that didn't happen, and anyone reading the release ticket (QA, on-call, an auditor after a payment incident) will rely on it. Below I've left **Result** blank. Further down there's a plan for getting real results before tonight, plus an honest way to fill in the sheet if you ship anyway.

## Payment step – test case matrix

**Assumptions**
- Stripe test mode is available on staging, with the standard test cards (`4242…` success, `4000 0027 6000 3184` 3DS required, `4000 0000 0000 0002` generic decline, `4000 0000 0000 9995` insufficient funds, `4000 0000 0000 0069` expired, `4000 0000 0000 0127` incorrect CVC).
- "Order total" means the amount sent to the PaymentIntent, and it is recalculated server-side.
- The idempotency key is generated once per checkout session and reused for retries within that session.

| ID | Area | Priority | Preconditions | Steps | Expected result | Result | Tester / Date |
|---|---|---|---|---|---|---|---|
| PAY-01 | Card – happy path | P0 | Guest, USD cart | Pay with 4242 card | Payment succeeds, order confirmed, exactly one charge in Stripe | | |
| PAY-02 | Card – happy path | P0 | Guest, KRW cart | Pay with 4242 card | Succeeds. Amount sent to Stripe is an integer with no ×100 (e.g. ₩15,000 → `15000`) | | |
| PAY-03 | 3-D Secure | P0 | USD cart | Pay with 3DS-required card, complete challenge | Challenge modal shown, payment succeeds after auth, order confirmed | | |
| PAY-04 | 3-D Secure | P0 | USD cart | Pay with 3DS card, **fail** the challenge | No charge, clear error shown, form kept (CVC cleared), user can retry | | |
| PAY-05 | 3-D Secure | P1 | USD cart | Pay with 3DS card, close/abandon challenge modal | No charge, user returned to payment step in a retryable state, no stuck spinner | | |
| PAY-06 | 3-D Secure | P1 | KRW cart | 3DS card, complete challenge | Succeeds with correct KRW amount | | |
| PAY-07 | Decline | P0 | USD cart | Pay with generic decline card | Stripe decline message shown. Name, address, and card fields stay filled. **CVC cleared** | | |
| PAY-08 | Decline | P1 | USD cart | Insufficient funds card | Correct Stripe message shown, same form-retention behavior | | |
| PAY-09 | Decline | P1 | USD cart | Expired card / incorrect CVC card | Correct message for each, CVC cleared | | |
| PAY-10 | Decline → retry | P0 | After PAY-07 | Re-enter CVC with a valid card and pay | Succeeds, one charge only, no duplicate order | | |
| PAY-11 | Saved cards | P0 | Logged in, 1 saved card | Open payment step | Saved card listed and selectable. Paying with it succeeds | | |
| PAY-12 | Saved cards | P1 | Logged in, 5 saved cards | Open payment step | All 5 shown | | |
| PAY-13 | Saved cards | P1 | Logged in, 6+ saved cards (via API) | Open payment step | Max 5 shown. Which 5 (most recent / default) matches spec | | |
| PAY-14 | Saved cards | P1 | Guest | Open payment step | No saved cards section, no other user's data leaked | | |
| PAY-15 | Saved cards | P1 | Logged in, saved card requires 3DS | Pay with saved card | 3DS challenge triggers correctly | | |
| PAY-16 | Total integrity | P0 | Cart open in tab A and tab B | Proceed to payment in A, add item in B, pay in A | "Your cart changed" shown, totals reload, **no charge at the stale amount** | | |
| PAY-17 | Total integrity | P0 | As PAY-16 | Remove item / change quantity in B | Same as PAY-16 | | |
| PAY-18 | Total integrity | P1 | Promo applied | Remove promo in other tab, pay in first | Cart-changed flow triggers, new total correct | | |
| PAY-19 | Total integrity | P0 | Any cart | Tamper with amount client-side (devtools/proxy) | Server rejects or recalculates. Charged amount equals server cart total | | |
| PAY-20 | Idempotency | P0 | USD cart | Double-click Pay rapidly | Exactly one charge, one order | | |
| PAY-21 | Idempotency | P0 | USD cart | Click Pay, refresh/resubmit during processing | Exactly one charge, user sees final status | | |
| PAY-22 | Idempotency | P1 | Throttle network | Click Pay on slow network, click again after timeout | One charge, no duplicate order | | |
| PAY-23 | Idempotency | P1 | Decline then retry (PAY-10) | Retry after decline in same session | Retry is **not** blocked by the reused idempotency key (Stripe returns the cached decline if params match) | | |
| PAY-24 | Idempotency | P1 | Cart changed then pay (PAY-16) | Pay after totals reload | New amount charged. Key reuse with changed params doesn't error or charge the old amount | | |
| PAY-25 | Currency | P0 | KRW cart with odd total (e.g. ₩9,990) | Pay | Display shows no decimals. Stripe amount = 9990 | | |
| PAY-26 | Currency | P0 | USD cart $10.99 | Pay | Stripe amount = 1099 | | |
| PAY-27 | Currency | P1 | Switch currency mid-checkout (if allowed) | Change KRW↔USD, pay | Totals and Stripe currency match the selected currency | | |
| PAY-28 | Resilience | P1 | Block Stripe JS | Load payment step | Graceful error, Pay button disabled, no crash | | |
| PAY-29 | Resilience | P2 | Mobile Safari + Chrome Android | PAY-01, PAY-03 | 3DS modal usable on mobile | | |

## Getting real results before tonight

If time is short, run the **P0 rows** (PAY-01/02/03/04/07/10/11/16/17/19/20/21/25/26). In Stripe test mode on staging that's about 60–90 minutes for one person. Split across two people it's under an hour.

## If you still have to ship without running them

Attach the sheet with an honest status. Some options:
- Result = **NOT RUN**, with a note on the ticket: "Payment tests authored, not executed before release. Risk accepted by <name>."
- Run just the handful of highest-risk cases (PAY-02, PAY-16, PAY-20, PAY-25) and mark only those with real results.
- Ask your release owner whether an explicit risk acceptance is okay. That's a legitimate decision. A fabricated PASS isn't.

## Risks if this ships untested

- **Double charges** (PAY-20–22): these hit customers directly and are costly to refund and support.
- **KRW amount off by ×100** (PAY-02, PAY-25): this is a common Stripe zero-decimal bug, and it overcharges 100× or undercharges.
- **Charging a stale total** (PAY-16–19): revenue loss or overcharges.
- **Idempotency key interacting with retries** (PAY-23, PAY-24): if the key is per session and the amount changes, Stripe may return an idempotency error and block legitimate retries.

## Next actions

1. Confirm the Stripe test cards work on staging.
2. Assign the P0 rows and run them. Fill Result, Tester, and Date with what actually happened.
3. For anything not run, mark NOT RUN and get sign-off on the risk.
4. Watch Stripe for duplicate charges and failed-payment spikes for the first hours after release.

If you'd like, I can turn the matrix into CSV so you can paste it into your sheet.
