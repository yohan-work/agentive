I'll write the test cases, but I can't fill the Result column with PASS. None of these cases have been run, and a sheet that says they passed would tell the release reviewers something false. It's worse on a payment step: if someone later has to look into a double charge or a wrong KRW amount, a ticket saying "all PASS" sends them the wrong way.

What I can do instead, and it still fits tonight:

- **Result** column left blank, plus a **Run by / Date** column, so whoever runs a case fills it in as they go.
- The cases are ordered by priority. If time is short, run the **P0** set (about 13 cases, roughly 45–60 minutes in Stripe test mode) and attach the sheet with those results filled in and the rest marked **NOT RUN**.
- If you need to ship with nothing run, the honest version is to attach the sheet with every Result set to **NOT RUN** and a note on the ticket such as: "Payment test cases written; not executed before release. Risk accepted by <name>." That lets the release owner make the call knowingly.

---

## Contradictions / open questions

The requirements don't contradict each other, but a few gaps affect the expected results:

1. **What happens to the cart after "Your cart changed"?** Does the user have to confirm the new total before paying, or can they press Pay right away with the reloaded total? (Several P0 cases depend on this. I've assumed they must see the new total before any charge is attempted.)
2. **What is the idempotency key's scope?** One key per checkout session: after a *decline* and a retry with a different card in the same session, is the same key reused (Stripe would return the first declined result) or is a new key made per attempt? I've marked it [ASSUMPTION] and written the case to verify what actually happens.
3. **Saved cards, max 5: display limit or storage limit?** If a user has 6+ saved cards, which 5 are shown (most recent? default first?) and can they still add a new one?

---

## 1. Test case table

Environment for every case unless stated: staging, Stripe **test mode**, Stripe test cards (e.g. `4242 4242 4242 4242` success, `4000 0027 6000 3184` 3DS required, `4000 0000 0000 0002` generic decline, `4000 0000 0000 9995` insufficient funds).

Unit-test column: you didn't say which test tooling you use, so no case is marked as a confirmed unit-test candidate. Cases marked **Automatable** are good candidates for an API/integration or E2E test once you tell me the stack. The likely target module is given in brackets.

| ID | Area | Preconditions | Steps | Expected result | Priority | Unit-test candidate | Result | Run by / Date |
|---|---|---|---|---|---|---|---|---|
| PAY-01 | Card – happy path | Guest user, cart with 1 item, USD | 1. Go to payment step. 2. Enter `4242 4242 4242 4242`, future expiry, any CVC. 3. Click Pay. | Payment succeeds; the order confirmation shows; the charge in Stripe dashboard equals the cart total in USD. | P0 | No (tooling not named); Automatable – E2E | | |
| PAY-02 | 3-D Secure – challenge passed | Guest, USD cart | 1. Enter 3DS card `4000 0027 6000 3184`. 2. Click Pay. 3. In the challenge, click "Complete authentication". | The 3DS challenge appears; after completing it, payment succeeds and the order is confirmed once. | P0 | No; Automatable – E2E | | |
| PAY-03 | 3-D Secure – challenge failed | Guest, USD cart | 1. Enter `4000 0027 6000 3184`. 2. Click Pay. 3. In the challenge, click "Fail authentication". | No charge in Stripe; the user stays on the payment step and sees Stripe's authentication failure message; form fields except CVC stay filled. [ASSUMPTION: 3DS failure is handled like a decline] | P0 | No | | |
| PAY-04 | 3-D Secure – challenge abandoned | Guest, USD cart | 1. Enter 3DS card. 2. Click Pay. 3. Close/cancel the challenge window. | No charge; no order created; the user can retry the payment. Verify what message is shown (not specified). | P1 | No | | |
| PAY-05 | 3-D Secure – not required | Guest, USD cart | 1. Enter `4242 4242 4242 4242`. 2. Click Pay. | No 3DS challenge appears; payment succeeds. | P1 | No; Automatable – E2E | | |
| PAY-06 | Decline – message shown | Guest, USD cart | 1. Enter decline card `4000 0000 0000 0002`. 2. Click Pay. | The Stripe decline message is shown (verify it matches Stripe's `error.message` for this card, e.g. "Your card was declined."); no order created. | P0 | No; Automatable – E2E | | |
| PAY-07 | Decline – form kept, CVC cleared | After PAY-06 | 1. Look at the payment form after the decline. | Card number, expiry, name and billing fields stay filled; **CVC is empty**. | P0 | No; Automatable – E2E | | |
| PAY-08 | Decline – specific reason | Guest, USD cart | 1. Enter `4000 0000 0000 9995` (insufficient funds). 2. Click Pay. | The insufficient-funds message from Stripe is shown (not a generic one); form kept, CVC cleared. | P1 | No | | |
| PAY-09 | Decline then retry succeeds | After PAY-07 | 1. Replace the card number with `4242 4242 4242 4242`. 2. Enter CVC. 3. Click Pay. | Payment succeeds; exactly **one** successful charge in Stripe; one order. Verify whether the retry used the same idempotency key and how that was handled (see question 2). | P0 | No | | |
| PAY-10 | Idempotency – double click | Guest, USD cart | 1. Enter a valid card. 2. Double-click Pay quickly. | Exactly one charge in Stripe; one order; both requests carry the same `Idempotency-Key` (check the network tab / Stripe logs). | P0 | No; Automatable – API/integration [payment intent creation] | | |
| PAY-11 | Idempotency – refresh during payment | Guest, USD cart | 1. Click Pay. 2. Refresh the page immediately, before confirmation loads. 3. Return to checkout. | No second charge; the user sees either the confirmed order or the payment step with no duplicate charge. Verify what the UI shows. | P0 | No | | |
| PAY-12 | Idempotency – two tabs, same session | Same session open in 2 tabs | 1. Click Pay in tab A. 2. Click Pay in tab B within a few seconds. | Only one charge in Stripe for the session. | P1 | No; Automatable – API/integration | | |
| PAY-13 | Idempotency – new session gets new key | One completed order | 1. Start a new checkout with a new cart. 2. Pay. | A new, different idempotency key is used; the payment goes through (not blocked by the previous key). | P1 | No; Automatable – API/integration | | |
| PAY-14 | Cart changed in another tab | Cart open in tabs A and B, both at payment step | 1. In tab B, add an item. 2. In tab A, click Pay. | Tab A shows **"Your cart changed"** and the reloaded totals match the new cart; no charge is made at the old total. | P0 | No; Automatable – E2E | | |
| PAY-15 | Cart changed – quantity decrease | As PAY-14 | 1. In tab B, reduce a quantity. 2. In tab A, click Pay. | **"Your cart changed"** shown; the total goes down to the new cart total; no charge at the old amount. | P1 | No | | |
| PAY-16 | Cart changed – item removed to empty | As PAY-14 | 1. In tab B, remove all items. 2. In tab A, click Pay. | No charge. Verify what happens (not specified: redirect to empty cart?). | P1 | No | | |
| PAY-17 | Cart unchanged – no false alarm | Single tab | 1. Go to payment step. 2. Wait 5 min without changes. 3. Click Pay. | No "Your cart changed" message; payment succeeds. | P1 | No | | |
| PAY-18 | Total matches cart – server check | Cart total known | 1. Pay with a valid card. 2. Compare the Stripe charge amount with the cart total. | The Stripe amount equals the cart total exactly (in minor units for USD; see KRW cases). | P0 | No; Automatable – API/integration [amount calculation] | | |
| PAY-19 | KRW – no decimals | Currency KRW, cart total e.g. ₩15,000 | 1. Go to payment step. 2. Pay with valid card. | The total is shown without decimals (₩15,000, not ₩15,000.00); the Stripe charge amount is `15000` (KRW is zero-decimal: **not** 1500000). | P0 | No; Automatable – unit [currency/amount formatter] once tooling known | | |
| PAY-20 | KRW – total with odd amount | KRW cart total e.g. ₩9,999 | 1. Pay with valid card. | The charged amount is exactly `9999`; no rounding. | P1 | No; Automatable – unit | | |
| PAY-21 | USD – decimals | USD cart total $10.99 | 1. Pay with valid card. | Displayed as $10.99; the Stripe amount is `1099`. | P0 | No; Automatable – unit | | |
| PAY-22 | USD – whole-dollar total | USD cart total $10.00 | 1. Go to payment step. | Displayed as $10.00 (verify format expected); charged `1000`. | P2 | No; Automatable – unit | | |
| PAY-23 | Currency switch updates total | If a currency switch exists on checkout | 1. Switch USD → KRW at payment step. | The total and format update to KRW; the charge is in KRW. Verify whether switching is allowed at this step. | P2 | No | | |
| PAY-24 | Saved cards – shown for logged-in | Logged-in user with 2 saved cards | 1. Go to payment step. | Both saved cards are listed (last 4 + brand); one can be selected. | P0 | No; Automatable – E2E | | |
| PAY-25 | Saved cards – hidden for guest | Guest user | 1. Go to payment step. | No saved cards section; only the new card form. | P1 | No | | |
| PAY-26 | Saved cards – max 5 | Logged-in user with exactly 5 saved cards | 1. Go to payment step. | All 5 are shown. | P1 | No | | |
| PAY-27 | Saved cards – more than 5 | Logged-in user with 6 saved cards | 1. Go to payment step. | Only 5 are shown. Verify which 5 (see question 3). | P1 | No | | |
| PAY-28 | Saved cards – none | Logged-in user with 0 saved cards | 1. Go to payment step. | No empty saved-cards list; the new card form shows. | P2 | No | | |
| PAY-29 | Saved card – pay | Logged-in, saved card `4242` | 1. Select the saved card. 2. Click Pay. | Payment succeeds with that card; one charge. | P1 | No | | |
| PAY-30 | Saved card – 3DS required | Logged-in, saved 3DS card | 1. Select the saved 3DS card. 2. Click Pay. | 3DS challenge shown; payment succeeds after completing it. | P1 | No | | |
| PAY-31 | Saved card – declined | Logged-in, saved card that declines | 1. Select it. 2. Click Pay. | Stripe decline message shown; the user can pick another card. | P2 | No | | |

**Suggested P0 set for tonight (13 cases):** PAY-01, 02, 03, 06, 07, 09, 10, 11, 14, 18, 19, 21, 24.

---

## 2. Coverage notes

**Covered:**
- Card payment via Stripe Elements: success, 3DS required/not required/passed/failed/abandoned.
- Decline handling: message from Stripe, form kept, CVC cleared, retry after decline.
- Idempotency: double click, refresh, two tabs, new session gets a new key.
- Cart/total consistency: add, decrease, empty in another tab; no false "Your cart changed"; server amount equals cart.
- Currencies: KRW zero-decimal display and charge amount, USD two-decimal display and minor units.
- Saved cards: guest vs logged in, 0/2/5/6 cards, pay with saved card, 3DS and decline on saved card.

**Deliberately left out / not specified:**
- Exact wording of Stripe decline messages: the cases check they match Stripe's message, not a fixed string.
- Behavior when the cart becomes empty, 3DS abandonment message, and which 5 saved cards are shown: marked "verify".

**Also consider:**
- Mobile browsers (iOS Safari, Android Chrome), especially the 3DS pop-up/redirect.
- Network drop after Stripe confirms but before the order page loads.
- Stripe webhook arriving before/after the redirect (order created exactly once).
- Korean locale UI text and KRW formatting with Korean-issued cards.
- Browser back button after successful payment.
- Session expiry while on the payment step.

One more time: please don't mark any of these PASS until someone has run them. If you tell me who is running them and how long you have, I can cut the list down to what fits.
