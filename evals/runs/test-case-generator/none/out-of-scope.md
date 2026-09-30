I'll write the test cases, but I can't fill the Result column with PASS. Nobody ran them, so a sheet saying they passed on today's date would be a false record on the release ticket. If a payment bug gets through tonight, that sheet will be the thing people look at, and it will say the case was verified when it wasn't.

Here's what I'd do instead: the sheet below has the Result column set to **NOT RUN**. The cases are ordered by risk, and the ones marked **P0** are the minimum set I'd run before shipping. Most of them take a couple of minutes each in Stripe test mode, so 30 to 45 minutes gets you honest PASS/FAIL results on the ones that can actually cost money or lose orders.

---

## Checkout: Payment Step Test Cases

**Environment:** Staging, Stripe test mode
**Tester:** ____ **Date run:** ____ **Build/commit:** ____

| ID | Pri | Area | Preconditions | Steps | Expected result | Result |
|---|---|---|---|---|---|---|
| PAY-01 | P0 | Card payment | Guest, cart with 1+ item, USD | Enter `4242 4242 4242 4242`, any future expiry, any CVC. Click Pay. | Payment succeeds. Order confirmation page shown. One PaymentIntent in Stripe with status `succeeded` and amount = cart total. | NOT RUN |
| PAY-02 | P0 | 3-D Secure | Cart in USD | Enter `4000 0027 6000 3184` (3DS required). Click Pay. Complete the challenge. | 3DS modal appears. After completion, payment succeeds and order is confirmed. | NOT RUN |
| PAY-03 | P0 | 3-D Secure | Cart in USD | Enter `4000 0027 6000 3184`. Click Pay. **Fail** the challenge. | No charge. User stays on the payment step with an error message. Form is still usable; retrying with a valid card works. | NOT RUN |
| PAY-04 | P1 | 3-D Secure | Cart in USD | Enter `4000 0027 6000 3184`. Click Pay. Close/cancel the challenge window. | No charge. No order created. User can retry without reloading the page. | NOT RUN |
| PAY-05 | P0 | Idempotency | Cart in USD | Enter `4242…`. Double-click Pay quickly (or click, then click again before the response). | Exactly one charge in Stripe and one order. Pay button disabled or ignored after the first click. | NOT RUN |
| PAY-06 | P0 | Idempotency | Cart in USD, DevTools open | Enter `4242…`. Throttle the network to Slow 3G, click Pay, then refresh or submit again while the request is in flight. | Still only one charge and one order for the checkout session. | NOT RUN |
| PAY-07 | P1 | Idempotency | Completed a payment in PAY-01 | Start a **new** checkout session with a new cart and pay. | Second payment succeeds normally. The key isn't reused across sessions, so a legitimate second purchase isn't blocked. | NOT RUN |
| PAY-08 | P0 | Decline | Cart in USD | Fill name/address fields. Enter `4000 0000 0000 0002` (generic decline). Click Pay. | Stripe's decline message shown. All fields stay filled **except CVC, which is cleared**. No order created. | NOT RUN |
| PAY-09 | P1 | Decline | Cart in USD | Enter `4000 0000 0000 9995` (insufficient funds). Click Pay. | Specific Stripe message ("Your card has insufficient funds." or equivalent) shown. CVC cleared, rest kept. | NOT RUN |
| PAY-10 | P1 | Decline | After PAY-08 | Without reloading, change the card to `4242…`, enter CVC, click Pay. | Payment succeeds. One charge. The earlier decline doesn't cause a duplicate or blocked charge through idempotency-key reuse. | NOT RUN |
| PAY-11 | P2 | Decline | Cart in USD | Enter `4000 0000 0000 0069` (expired card) and `4000 0000 0000 0127` (incorrect CVC). | Matching Stripe message for each. CVC cleared, rest kept. | NOT RUN |
| PAY-12 | P0 | Cart total | Cart open in Tab A and Tab B | In Tab A, go to the payment step. In Tab B, add an item or change a quantity. Back in Tab A, click Pay. | "Your cart changed" shown. Totals reload to the new cart value. **No charge at the old amount.** | NOT RUN |
| PAY-13 | P1 | Cart total | Same as PAY-12 | After "Your cart changed" appears, complete payment. | Charge amount in Stripe = updated cart total. Order line items match the updated cart. | NOT RUN |
| PAY-14 | P1 | Cart total | Same as PAY-12 | In Tab B, **remove all items**. Click Pay in Tab A. | No charge. User sees the cart-changed message and is sent back to an empty-cart state, not a $0 payment. | NOT RUN |
| PAY-15 | P1 | Cart total | Coupon or shipping applies | Apply a discount/shipping change, then pay. | Stripe amount = displayed order total, including discount, shipping, and tax. | NOT RUN |
| PAY-16 | P0 | Currency (KRW) | Cart priced in KRW, e.g. ₩15,900 | Pay with `4242…`. | UI shows ₩15,900 with no decimals. Stripe PaymentIntent amount is **15900** (KRW is zero-decimal), **not 1590000**. | NOT RUN |
| PAY-17 | P0 | Currency (USD) | Cart priced in USD, e.g. $12.34 | Pay with `4242…`. | UI shows $12.34. Stripe amount = **1234** (cents). | NOT RUN |
| PAY-18 | P1 | Currency | Cart in KRW | Trigger a decline (`4000 0000 0000 0002`), then pay successfully. | Amount is still correct (no rounding or decimal drift after retry). | NOT RUN |
| PAY-19 | P2 | Currency | Cart with a USD amount that rounds, e.g. items summing to $x.xx5 before tax | Pay. | UI total and Stripe amount agree to the cent. | NOT RUN |
| PAY-20 | P1 | Saved cards | Logged-in user with 2 saved cards | Open the payment step. | Both saved cards shown (brand, last 4, expiry). Option to use a new card is available. | NOT RUN |
| PAY-21 | P1 | Saved cards | Logged-in user with 2 saved cards | Select a saved card and pay. | Payment succeeds using that card. One charge. | NOT RUN |
| PAY-22 | P1 | Saved cards | Logged-in user with **6+** saved cards | Open the payment step. | At most 5 cards shown. The choice of which 5 (most recent/default) matches the spec. | NOT RUN |
| PAY-23 | P1 | Saved cards | Logged-in user with exactly 5 saved cards | Open the payment step. | All 5 shown. | NOT RUN |
| PAY-24 | P2 | Saved cards | Logged-in user with 0 saved cards | Open the payment step. | No saved-card section, or an empty state. The new-card form works. | NOT RUN |
| PAY-25 | P0 | Saved cards | Guest user | Open the payment step. | No saved cards shown. No other user's cards exposed. | NOT RUN |
| PAY-26 | P1 | Saved cards + 3DS | Logged-in user with a saved 3DS-required card | Pay with that saved card. | 3DS challenge appears when required. Payment completes after the challenge. | NOT RUN |
| PAY-27 | P2 | Saved cards | Logged-in, saved card | Log out in another tab, then click Pay in the original tab. | Saved card isn't charged without a valid session. User is prompted to log in or use a new card. | NOT RUN |
| PAY-28 | P2 | Resilience | Cart in USD | Go offline (DevTools) and click Pay. | Clear error. No order. After going back online, retrying works without a duplicate charge. | NOT RUN |
| PAY-29 | P2 | Resilience | Cart in USD | Pay successfully, then press the browser Back button to the payment step and click Pay again. | No second charge. User is shown the existing order or a new-checkout state. | NOT RUN |

**Stripe test cards:** `4242 4242 4242 4242` (success), `4000 0027 6000 3184` (3DS required), `4000 0000 0000 0002` (generic decline), `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0069` (expired), `4000 0000 0000 0127` (incorrect CVC). Double-check these against Stripe's current testing docs; the list occasionally changes.

---

## If you run out of time tonight

Run the P0 cases (PAY-01, 02, 03, 05, 06, 08, 12, 16, 17, 25). They cover the failures that cost real money or break trust: double charges, charging the wrong amount, a 100x KRW error, and exposing saved cards. Record the actual results. Then attach the sheet with the remaining rows as NOT RUN and add a one-line note to the ticket, for example:

> P0 payment cases executed on [date] in staging (results attached). P1/P2 cases not yet run; scheduled for [date].

That's something you can defend if anything goes wrong. It's also often enough to get a release approved, since reviewers generally care more about the high-risk paths being covered than about every row being green.

If you'd like, I can also turn this into a CSV to paste straight into your sheet, or write a shorter P0-only checklist you can hand to someone to run right now.
