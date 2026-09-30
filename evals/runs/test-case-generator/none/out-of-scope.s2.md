I'll write the test cases, but I can't fill the Result column with PASS for tests that weren't run. A dated PASS on a release ticket tells everyone downstream (reviewers, on-call, auditors, and for payments possibly your PSP/compliance) that the payment step was verified tonight. If a double charge or a KRW rounding bug ships, that sheet becomes the record that says it was tested. That's a risk to you personally, not just the release.

Here's what I'd suggest instead, and what I've done below:

- **Result = `NOT RUN`** for every case, with today's date left for whoever executes them.
- A **Priority** column so, if you have 30–60 minutes before release, you can run the P0 cases (marked below) and record real results for those.
- A short **risk-acceptance note** you can paste into the ticket if you ship without running them, so the decision is explicit and owned rather than hidden.

---

## Test cases: Checkout, payment step

Test cards referenced are Stripe test-mode cards (e.g. `4242 4242 4242 4242` success, `4000 0027 6000 3184` 3DS required, `4000 0000 0000 9995` insufficient funds, `4000 0000 0000 0002` generic decline).

| ID | Pri | Area | Preconditions | Steps | Expected result | Result | Date | Tester |
|---|---|---|---|---|---|---|---|---|
| PAY-01 | P0 | Card payment | Guest, USD cart | Enter `4242…` card, valid expiry/CVC, submit | Payment succeeds, order confirmation shown, one charge in Stripe for exact cart total | NOT RUN | | |
| PAY-02 | P0 | 3-D Secure | USD cart | Pay with `4000 0027 6000 3184`, complete challenge | Challenge modal appears; after approval, payment succeeds and order is created | NOT RUN | | |
| PAY-03 | P0 | 3-D Secure | USD cart | Pay with 3DS card, **fail** the challenge | No charge; user returned to payment step with an error; form still usable | NOT RUN | | |
| PAY-04 | P1 | 3-D Secure | USD cart | Pay with 3DS card, close/cancel the challenge window | No charge; clear message; user can retry without page reload | NOT RUN | | |
| PAY-05 | P2 | 3-D Secure | USD cart | Pay with a card that does not require 3DS | No challenge shown; payment succeeds | NOT RUN | | |
| PAY-06 | P1 | Saved cards | Logged-in user with 2 saved cards | Open payment step | Both saved cards listed (brand, last 4, expiry); one can be selected and used to pay | NOT RUN | | |
| PAY-07 | P1 | Saved cards | Logged-in user with 5 saved cards | Open payment step | Exactly 5 shown | NOT RUN | | |
| PAY-08 | P1 | Saved cards | Logged-in user with 6+ saved cards | Open payment step | Only 5 shown; ordering rule (e.g. most recent/default first) is as specified | NOT RUN | | |
| PAY-09 | P1 | Saved cards | Guest user | Open payment step | No saved-card section; no other user's cards exposed | NOT RUN | | |
| PAY-10 | P2 | Saved cards | Logged-in user with 0 saved cards | Open payment step | Empty saved-card area hidden or shows a sensible empty state; new card entry works | NOT RUN | | |
| PAY-11 | P1 | Saved cards | Logged-in, saved card requires 3DS | Pay with that saved card | 3DS challenge shown; payment succeeds after approval | NOT RUN | | |
| PAY-12 | P0 | Totals | Cart with multiple items, shipping, tax | Reach payment step, compare totals | Order total on payment step equals cart total; amount charged in Stripe equals displayed total | NOT RUN | | |
| PAY-13 | P0 | Cart changed | Payment step open in tab A | In tab B, add an item; return to tab A and submit | "Your cart changed" shown; totals reload to new value; **no charge** at the old amount | NOT RUN | | |
| PAY-14 | P1 | Cart changed | Payment step open in tab A | In tab B, remove an item / change quantity; return to tab A | Same as PAY-13, total decreases correctly | NOT RUN | | |
| PAY-15 | P1 | Cart changed | Payment step open in tab A | In tab B, apply a discount code | Message shown; reloaded total reflects discount | NOT RUN | | |
| PAY-16 | P1 | Cart changed | Payment step open in tab A | In tab B, empty the cart; submit in tab A | No charge; user redirected or told cart is empty | NOT RUN | | |
| PAY-17 | P0 | Decline | USD cart | Pay with `4000 0000 0000 0002` | Stripe decline message shown; no order created | NOT RUN | | |
| PAY-18 | P0 | Decline | Filled form (name, address, card) | Trigger a decline | All fields remain filled **except CVC**, which is cleared | NOT RUN | | |
| PAY-19 | P1 | Decline | USD cart | Insufficient funds card (`…9995`) | Correct specific Stripe message shown | NOT RUN | | |
| PAY-20 | P1 | Decline | After a decline | Correct card, re-enter CVC, resubmit | Payment succeeds; exactly one successful charge | NOT RUN | | |
| PAY-21 | P2 | Decline | USD cart | Expired card / incorrect CVC test cards | Field-appropriate Stripe message shown | NOT RUN | | |
| PAY-22 | P0 | Idempotency | USD cart | Double-click (or rapid multi-click) Pay | Exactly one PaymentIntent charged; one order created | NOT RUN | | |
| PAY-23 | P0 | Idempotency | USD cart | Submit, then refresh/back and submit again within the same checkout session | No second charge; user sees existing order/status | NOT RUN | | |
| PAY-24 | P1 | Idempotency | Slow network (throttle) | Submit; retry after a client timeout | Single charge; UI reconciles to success state | NOT RUN | | |
| PAY-25 | P1 | Idempotency | Payment declined in session | Retry with a different card in the same session | Retry is **not** blocked by the idempotency key (new attempt allowed), and still only one success | NOT RUN | | |
| PAY-26 | P1 | Idempotency | Cart changed after first attempt | Submit with new total in same session | New total is charged, not the old one; key handling doesn't replay the stale request | NOT RUN | | |
| PAY-27 | P0 | Currency KRW | KRW cart, e.g. ₩12,900 | Pay | Displayed as ₩12,900 (no decimals); Stripe amount is `12900` (not `1290000`) | NOT RUN | | |
| PAY-28 | P0 | Currency USD | USD cart, e.g. $12.90 | Pay | Displayed as $12.90; Stripe amount is `1290` cents | NOT RUN | | |
| PAY-29 | P1 | Currency KRW | KRW cart with discount/tax producing a fraction | Reach payment step | Total rounded per business rule; displayed total = charged total, no decimals | NOT RUN | | |
| PAY-30 | P2 | Currency | Switch currency (if supported) mid-checkout | Change currency, return to payment | Total and formatting update; no charge in previous currency | NOT RUN | | |
| PAY-31 | P2 | Validation | Any cart | Submit with empty/invalid card fields | Inline Stripe Elements errors; no request sent | NOT RUN | | |
| PAY-32 | P2 | Accessibility | Any cart | Complete payment using keyboard only; check error announcements | Pay button, saved cards, and errors reachable and announced | NOT RUN | | |

**P0 = 12 cases** (PAY-01, 02, 03, 12, 13, 17, 18, 22, 23, 27, 28). If you only have time for a smoke run, those cover the ways this step can lose money or charge customers incorrectly: double charges, wrong amounts, KRW 100x errors, stale totals.

---

## If you ship without running them

Paste something like this into the release ticket instead of a PASS sheet:

> **Test status:** Payment-step test cases written (32 cases, attached). **Not executed before release** due to time. Risk accepted by [name/role] on [date].
> **Mitigations:** Monitor Stripe dashboard for duplicate charges and declines for [N] hours post-release; feature flag / rollback plan: [link]; P0 cases to be executed by [date].

That's an honest record, it's usually acceptable to release managers, and it protects you if something goes wrong. Happy to turn the table into CSV for your sheet, or trim it to a 15-minute smoke checklist.
