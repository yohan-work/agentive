I can't fill the Result column with PASS. None of these cases have been run, and a ticket showing dated PASS results would tell reviewers that payment was tested when it wasn't. For a payment step, that's the kind of record that causes trouble later: a double charge or a KRW amount error in production, with a sheet saying it passed.

Here's what I can do instead:

- Below are the full test cases with the **Result** column left blank, so whoever runs them can fill it in honestly.
- If there isn't time to run all of them tonight, the **P0** cases are the smallest set I'd run before release. They cover charging the right amount, charging only once, 3-D Secure, declines, and KRW formatting. With two people, most of them should take about an hour in Stripe test mode.
- If you release without running them, I'd attach the sheet marked **"Not executed – release accepted with known test gap"** plus the sign-off of whoever accepts that risk. That keeps the ticket truthful.

**Questions (most important first):**
1. Can you run the P0 cases in Stripe test mode before release, even partly? If yes, I'll trim the sheet to that set.
2. For the "cart changed" check: is the cart total re-checked on the server when the user clicks Pay, or only when the payment page loads? Several expected results depend on this; I've marked them [ASSUMPTION].
3. What test tooling does the project use (e.g. Jest/Vitest, Playwright/Cypress, Stripe CLI)? I haven't marked any case as a confirmed unit-test candidate because no tooling was named. The "Unit candidate?" column says which module each would target *if* the tooling supports it.

---

## 1. Test cases – Payment step

Stripe test cards referenced: `4242 4242 4242 4242` (success), `4000 0025 0000 3155` (3DS required), `4000 0000 0000 0002` (generic decline), `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0069` (expired card), `4000 0000 0000 0127` (incorrect CVC).

| ID | Area | Preconditions | Steps | Expected result | Priority | Unit candidate? | Result |
|---|---|---|---|---|---|---|---|
| PAY-01 | Card payment – happy path | Guest user; cart with 1 item; USD; Stripe test mode | 1. Go to payment step. 2. Enter 4242 card, valid future expiry, any CVC. 3. Click Pay. | Payment succeeds; order confirmation shown; exactly one PaymentIntent with status `succeeded` in Stripe dashboard; amount equals cart total. | P0 | No (E2E) | |
| PAY-02 | Card payment – Stripe Elements load | Any user at payment step | 1. Open payment step. 2. Inspect card field. | Stripe Elements card field renders inside a Stripe iframe; no console errors; card number is not in the app's own DOM/network payloads. | P0 | No (E2E) | |
| PAY-03 | 3-D Secure – challenge completed | Guest; USD cart | 1. Enter `4000 0025 0000 3155`. 2. Click Pay. 3. In 3DS modal, click "Complete authentication". | 3DS challenge appears; after completing, payment succeeds; order confirmed; one charge in Stripe. | P0 | No (E2E) | |
| PAY-04 | 3-D Secure – challenge failed | Guest; USD cart | 1. Enter `4000 0025 0000 3155`. 2. Click Pay. 3. In 3DS modal, click "Fail authentication". | No charge; user stays on payment step with an error message (verify exact text from Stripe/app); form stays filled except CVC; user can retry. | P0 | No (E2E) | |
| PAY-05 | 3-D Secure – challenge closed/abandoned | Guest; USD cart | 1. Enter 3DS card. 2. Click Pay. 3. Close the 3DS modal without completing. | No charge; no order created; user returned to payment step able to retry; Pay button re-enabled. | P1 | No (E2E) | |
| PAY-06 | 3-D Secure – not required | Guest; USD cart | 1. Pay with 4242 card. | No 3DS challenge shown; payment succeeds directly. | P1 | No (E2E) | |
| PAY-07 | Saved cards – shown to logged-in user | Logged-in user with 2 saved cards | 1. Go to payment step. | Both saved cards listed (verify display: brand + last 4 + expiry); user can select one. | P0 | Possibly – saved-card list component (render test) | |
| PAY-08 | Saved cards – pay with saved card | Logged-in user with ≥1 saved card | 1. Select a saved card. 2. Click Pay. | Payment succeeds using the selected card; one charge; order confirmed. | P0 | No (E2E) | |
| PAY-09 | Saved cards – maximum 5 (boundary) | Logged-in user with exactly 5 saved cards | 1. Go to payment step. | All 5 saved cards shown. | P1 | Possibly – saved-card list component / API that returns cards | |
| PAY-10 | Saved cards – over the maximum | Logged-in user with 6+ saved cards (set up via Stripe/API) | 1. Go to payment step. | Only 5 cards shown. Verify which 5 (e.g. most recent or default first); the requirement doesn't say. | P1 | Possibly – same as PAY-09 | |
| PAY-11 | Saved cards – none | Logged-in user with 0 saved cards | 1. Go to payment step. | No saved-card list (or empty state); new-card form shown and usable. | P1 | Possibly – saved-card list component | |
| PAY-12 | Saved cards – guest | Guest user | 1. Go to payment step. | No saved cards shown; only the new-card form. | P0 | Possibly – saved-card list component | |
| PAY-13 | Saved cards – belong to current user only | Users A and B each have saved cards | 1. Log in as A, view payment step. 2. Log out; log in as B, view payment step. | Each user sees only their own cards; A's cards never visible to B (check also via network response). | P0 | No (integration/API) | |
| PAY-14 | Saved card – 3DS required | Logged-in user; saved card is a 3DS-required test card | 1. Select that saved card. 2. Click Pay. | 3DS challenge shown; on completion payment succeeds. | P1 | No (E2E) | |
| PAY-15 | Total match – normal | USD cart with 2 items, known total | 1. Go to payment step. 2. Note displayed total. 3. Pay. | Displayed order total equals cart total; charged amount in Stripe equals that total. | P0 | Possibly – total calculation module | |
| PAY-16 | Cart changed in another tab – item added | Payment step open in Tab 1 | 1. In Tab 2, add an item to the cart. 2. Return to Tab 1. 3. Click Pay. | Message "Your cart changed" shown; totals reload to the new cart total; no charge at the old amount. [ASSUMPTION: detected at Pay click; verify whether it also appears on tab focus.] | P0 | No (E2E) | |
| PAY-17 | Cart changed in another tab – item removed | Payment step open in Tab 1 | 1. In Tab 2, remove an item. 2. Return to Tab 1. 3. Click Pay. | "Your cart changed" shown; total reloads to the lower amount; no charge at the old amount. | P0 | No (E2E) | |
| PAY-18 | Cart changed – quantity change | Payment step open in Tab 1 | 1. In Tab 2, change an item's quantity. 2. In Tab 1, click Pay. | "Your cart changed" shown; totals reload. | P1 | No (E2E) | |
| PAY-19 | Cart changed – pay after reload | After PAY-16 | 1. After totals reload, click Pay again. | Payment succeeds at the **new** total; exactly one charge. | P0 | No (E2E) | |
| PAY-20 | Cart changed – cart emptied | Payment step open in Tab 1 | 1. In Tab 2, remove all items. 2. In Tab 1, click Pay. | No charge. "Your cart changed" shown; verify what happens with an empty cart (redirect to cart / Pay disabled); the requirement doesn't say. | P1 | No (E2E) | |
| PAY-21 | Cart unchanged – no false alarm | Payment step open in two tabs, no cart edits | 1. Switch between tabs. 2. Click Pay in Tab 1. | "Your cart changed" does **not** appear; payment succeeds. | P1 | Possibly – cart-version comparison function | |
| PAY-22 | Decline – generic | Guest; USD | 1. Enter `4000 0000 0000 0002`, fill all fields. 2. Click Pay. | Stripe decline message shown (verify exact text, e.g. "Your card was declined."); no charge; no order. | P0 | No (E2E) | |
| PAY-23 | Decline – form kept except CVC | After PAY-22 | 1. Inspect the form after decline. | Card number, expiry, and other entered fields (name, postal code if present) remain filled; **CVC is empty**. | P0 | No (E2E) | |
| PAY-24 | Decline – insufficient funds | Guest; USD | 1. Pay with `4000 0000 0000 9995`. | Stripe's insufficient-funds message shown (verify exact text); form kept except CVC. | P1 | No (E2E) | |
| PAY-25 | Decline – expired card | Guest; USD | 1. Pay with `4000 0000 0000 0069`. | Stripe's expired-card message shown; form kept except CVC. | P1 | No (E2E) | |
| PAY-26 | Decline – incorrect CVC | Guest; USD | 1. Pay with `4000 0000 0000 0127`. | Stripe's incorrect-CVC message shown; CVC empty; other fields kept. | P1 | No (E2E) | |
| PAY-27 | Decline then success | After a decline | 1. Change to 4242 card, re-enter CVC. 2. Click Pay. | Payment succeeds; exactly one successful charge; decline message cleared. | P0 | No (E2E) | |
| PAY-28 | Decline – saved card | Logged-in; saved card that declines | 1. Select it. 2. Click Pay. | Stripe decline message shown; user can pick another card or enter a new one. | P2 | No (E2E) | |
| PAY-29 | Idempotency – double click | Guest; USD; 4242 card entered | 1. Double-click Pay rapidly. | Exactly one charge in Stripe; exactly one order created. | P0 | No (E2E) | |
| PAY-30 | Idempotency – same key per session | Browser devtools open | 1. Click Pay; capture request. 2. Trigger a retry of the same payment (e.g. network throttling then retry). | Both requests carry the same idempotency key; Stripe returns the original result; one charge. | P0 | Possibly – idempotency-key generator / payment API handler | |
| PAY-31 | Idempotency – new session gets new key | Completed one checkout | 1. Start a new checkout session with a new cart. 2. Pay. | A different idempotency key is used; the second payment is charged normally (not blocked as a duplicate). | P0 | Possibly – idempotency-key generator | |
| PAY-32 | Idempotency – retry after decline | Checkout session with a declined attempt | 1. Decline (PAY-22). 2. Retry with 4242. | Retry is processed and succeeds (not blocked by the earlier key). Verify how the key is handled after a decline. [ASSUMPTION: a decline does not lock the session.] | P0 | Possibly – payment API handler | |
| PAY-33 | Idempotency – cart changed then pay | Cart changed after page load (PAY-16) | 1. Reload totals. 2. Pay. | Charge is for the new total. Verify that reusing the same session key with a different amount doesn't cause a Stripe idempotency error. | P0 | Possibly – payment API handler | |
| PAY-34 | Idempotency – Enter key + click | Card entered | 1. Press Enter in a card field and immediately click Pay. | One charge only. | P1 | No (E2E) | |
| PAY-35 | Pay button during processing | Card entered | 1. Click Pay. 2. Observe button while processing. | Button disabled / shows loading until result; re-enabled on decline. | P1 | Possibly – payment form component | |
| PAY-36 | KRW – no decimals shown | Cart in KRW (e.g. ₩15,000) | 1. Go to payment step. | Total shown with no decimal places (e.g. "₩15,000", not "₩15,000.00"). | P0 | Yes if tooling allows – currency formatting function | |
| PAY-37 | KRW – amount sent to Stripe | KRW cart ₩15,000 | 1. Pay with 4242. 2. Check Stripe dashboard. | Charged amount is ₩15,000 (Stripe `amount` = 15000, not 1500000). | P0 | Yes if tooling allows – amount-to-minor-units conversion | |
| PAY-38 | USD – two decimals | USD cart $12.50 | 1. Go to payment step. 2. Pay. | Total shown as "$12.50"; Stripe `amount` = 1250. | P0 | Yes if tooling allows – currency formatting + conversion | |
| PAY-39 | USD – rounding boundary | USD cart whose items sum to a fractional cent before rounding (e.g. tax) | 1. Go to payment step. 2. Pay. | Displayed total equals charged amount to the cent; no off-by-one-cent. Verify the rounding rule used. | P1 | Yes if tooling allows – total calculation | |
| PAY-40 | KRW – large amount | KRW cart ₩1,234,567 | 1. Pay. | Displayed "₩1,234,567"; Stripe amount 1234567. | P1 | Yes if tooling allows – formatting/conversion | |
| PAY-41 | KRW – minimum/small amount | KRW cart with the smallest allowed amount | 1. Pay. | Verify behavior against Stripe's minimum charge for KRW; clear error if below minimum. | P2 | Possibly – validation function | |
| PAY-42 | Currency consistency | USD cart | 1. Go to payment step. 2. Pay. | Currency shown = currency charged in Stripe (`usd`); same check for KRW (`krw`). | P0 | Possibly – payment API handler | |
| PAY-43 | Cart changed + KRW | KRW cart; payment step open | 1. Change cart in another tab. 2. Pay. | "Your cart changed"; reloaded total still formatted with no decimals. | P2 | No (E2E) | |
| PAY-44 | Reload page mid-payment | Card entered, not paid | 1. Refresh the page. | No charge; payment step reloads with correct total; card fields empty (Stripe Elements don't persist). | P1 | No (E2E) | |
| PAY-45 | Back button after success | Payment succeeded | 1. Press browser Back. 2. Try to pay again. | No second charge; user redirected to confirmation or cart. Verify intended behavior. | P1 | No (E2E) | |

## 2. Coverage notes

**Covered:**
- Card payment via Stripe Elements: success, Elements loading, reload, back-after-success.
- 3-D Secure: required + completed, required + failed, abandoned, not required, on a saved card.
- Saved cards: 0, 2, exactly 5, more than 5, guest, isolation between users, paying with one, declined saved card.
- Total match and "Your cart changed": item added, removed, quantity changed, cart emptied, no-change (false positive), paying after reload, combined with KRW.
- Declines: generic, insufficient funds, expired, incorrect CVC; form kept except CVC; retry to success.
- Idempotency: double click, Enter + click, same key on retry, new key on new session, retry after decline, amount change within a session, button disabled while processing.
- Currencies: KRW no decimals (display and Stripe amount), USD two decimals, rounding, large and minimum amounts, currency consistency.

**Suggested minimum set if time is short (P0):** PAY-01, 02, 03, 04, 07, 08, 12, 13, 15, 16, 17, 19, 22, 23, 27, 29, 30, 31, 32, 33, 36, 37, 38, 42.

**Deliberately left out:**
- Other payment methods (wallets, bank transfer); not in the request.
- Stripe webhook and fulfilment processing after payment; outside the payment step as described.
- Load and performance testing.

**Also consider:**
- Network drop between the Stripe confirmation and the order-creation call (charge without an order).
- Payment step on mobile browsers (3DS modal in a small viewport).
- Locale of Stripe decline messages (Korean vs English UI).
- Accessibility of error messages (screen reader announcement of the decline).
- Deleting or expiring a saved card while it's selected.
- Session timeout while on the payment step.
