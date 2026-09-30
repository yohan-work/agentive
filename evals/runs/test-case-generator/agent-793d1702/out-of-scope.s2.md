I'll write the full test case matrix for the payment step. I can't fill the Result column with PASS and today's date, though. Those tests haven't been run, so a sheet marked PASS on the release ticket would be a false record. Anyone reading it (reviewers, on-call, auditors, or you after an incident) would believe payment was verified when it wasn't. For a step that moves money, that's the record most likely to be looked at later.

Below, the Result column says **NOT RUN**. There's also a short **smoke subset** that one person can run in about 45–60 minutes before tonight's release. Then you can attach real results, or tell the ticket plainly what was and wasn't covered.

---

## Assumptions

- The Stripe **test mode** environment (staging/pre-prod) runs the release build, and you can use Stripe test cards.
- "Order total must match the cart total" is enforced on the **server** at payment-intent creation or confirmation, not only in the UI.
- The idempotency key is created once per checkout session and reused on retries of the same attempt.
- KRW amounts go to Stripe as whole won (zero-decimal currency). USD amounts go as cents.
- The saved-card limit (max 5) applies to what is **displayed**. The spec doesn't say what happens when a user has more than 5 stored cards. That's flagged under Open questions.

## Test case matrix

Priority: **P0** = release blocker, **P1** = should pass before release, **P2** = can follow soon after.
Stripe test cards: `4242 4242 4242 4242` (success), `4000 0027 6000 3184` (3DS required), `4000 0000 0000 0002` (generic decline), `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0069` (expired card), `4000 0000 0000 0127` (incorrect CVC).

### A. Card payment (Stripe Elements)

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| PAY-01 | P0 | Successful payment, guest, USD | Add item, go to payment, enter 4242…, pay | Order confirmed; one succeeded PaymentIntent in Stripe for the exact cart amount in cents; confirmation page shows the same total | NOT RUN |
| PAY-02 | P0 | Successful payment, logged-in, new card, KRW | Log in, KRW cart, pay with 4242… | Order confirmed; Stripe amount = whole won (e.g. ₩15,000 → `15000`, not `1500000`) | NOT RUN |
| PAY-03 | P1 | Client-side validation | Enter an incomplete card number, a past expiry, or a 2-digit CVC | Stripe Elements shows inline errors; Pay stays disabled or the submit is blocked; no PaymentIntent is confirmed | NOT RUN |
| PAY-04 | P1 | Stripe Elements fails to load | Block js.stripe.com (devtools) and open the payment step | A clear error or retry message; no blank form, no silent failure | NOT RUN |

### B. 3-D Secure

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| 3DS-01 | P0 | 3DS challenge completed | Pay with 4000 0027 6000 3184, complete the challenge | Challenge modal appears; after approval the order is confirmed; charged once | NOT RUN |
| 3DS-02 | P0 | 3DS challenge failed | Same card, click "Fail" in the challenge | No order created; a decline/authentication message is shown; form still filled except CVC; user can retry | NOT RUN |
| 3DS-03 | P1 | 3DS challenge abandoned | Close the modal or navigate away mid-challenge, then return | No charge, no order; the checkout can be retried without a duplicate PaymentIntent charge | NOT RUN |
| 3DS-04 | P2 | 3DS on mobile browser | Run 3DS-01 on iOS Safari and Android Chrome | Modal usable, not clipped; redirect or return works | NOT RUN |

### C. Saved cards (logged-in)

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| SAV-01 | P0 | Pay with a saved card | Logged-in user with 1 saved card selects it and pays | Order confirmed; charged to that card | NOT RUN |
| SAV-02 | P1 | Maximum shown | User with exactly 5 saved cards | All 5 shown, each with brand, last 4, and expiry | NOT RUN |
| SAV-03 | P1 | More than 5 stored | User with 6+ cards on the Stripe customer | Only 5 shown; the choice follows the agreed rule (e.g. most recent/default first); see open question | NOT RUN |
| SAV-04 | P1 | Guest sees no saved cards | Check out as a guest | No saved-card list; no other customer's data is exposed | NOT RUN |
| SAV-05 | P1 | Saved card requires 3DS | A saved card that triggers 3DS | Challenge appears and the flow completes like 3DS-01 | NOT RUN |
| SAV-06 | P2 | Expired saved card | A saved card past its expiry | Shown as expired or not selectable, or declined with a clear message | NOT RUN |

### D. Order total vs cart total

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| TOT-01 | P0 | Cart changed in another tab | Open payment in tab A; in tab B add an item or change quantity; pay in tab A | "Your cart changed" shown; totals reload; **no charge at the old amount** | NOT RUN |
| TOT-02 | P0 | Server rejects a mismatched amount | Tamper with the amount in the request (devtools/proxy) | Server refuses; no PaymentIntent confirmed at the tampered amount | NOT RUN |
| TOT-03 | P1 | Item removed in another tab so the cart is empty | Tab B empties the cart; pay in tab A | Cart-changed or empty-cart message; no charge | NOT RUN |
| TOT-04 | P1 | Price or discount changes during the session | Change the price or expire a coupon while on the payment step | Cart-changed handling fires; the user sees the new total before paying | NOT RUN |
| TOT-05 | P1 | Charged amount matches the displayed amount | Compare the confirmation page, order record, and Stripe dashboard for PAY-01/02 | All three equal, including tax and shipping | NOT RUN |

### E. Declines

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DEC-01 | P0 | Generic decline | Pay with 4000 0000 0000 0002 | Stripe decline message shown; card number, expiry, name, and address kept; **CVC cleared**; no order | NOT RUN |
| DEC-02 | P1 | Insufficient funds | 4000 0000 0000 9995 | Specific Stripe message; same form behavior as DEC-01 | NOT RUN |
| DEC-03 | P1 | Expired card | 4000 0000 0000 0069 | Stripe message; same form behavior | NOT RUN |
| DEC-04 | P1 | Incorrect CVC | 4000 0000 0000 0127 | Stripe message; CVC cleared | NOT RUN |
| DEC-05 | P0 | Retry after a decline | After DEC-01, fix the card (4242…) and pay | Succeeds; exactly one successful charge; no duplicate order | NOT RUN |

### F. Idempotency and double submit

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| IDM-01 | P0 | Double click on Pay | Click Pay twice quickly (or script two clicks) | One charge, one order in both Stripe and the DB | NOT RUN |
| IDM-02 | P0 | Network retry | Throttle or drop the network after submit, then retry | Same idempotency key reused; one charge | NOT RUN |
| IDM-03 | P1 | Refresh during processing | Refresh the page while payment is processing | No second charge; the user lands on the correct state (confirmed or retry) | NOT RUN |
| IDM-04 | P1 | New attempt after a decline is not blocked | Decline, then pay with a valid card | Succeeds. The idempotency key must not replay the cached decline; confirm how the key is scoped per attempt | NOT RUN |
| IDM-05 | P1 | Two tabs paying the same session | Pay in tab A and tab B at almost the same time | At most one charge | NOT RUN |

### G. Currency (KRW / USD)

| ID | Pri | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| CUR-01 | P0 | KRW has no decimals | KRW cart with odd amounts (e.g. ₩9,990) | UI shows ₩9,990 with no ".00"; Stripe amount `9990` | NOT RUN |
| CUR-02 | P0 | USD cents | $19.99 cart | UI shows $19.99; Stripe amount `1999` | NOT RUN |
| CUR-03 | P1 | Rounding with tax or discount | A percentage discount that produces fractional won or cents | Rounding follows the defined rule; UI, order, and Stripe all agree | NOT RUN |
| CUR-04 | P1 | Currency switch mid-checkout (if possible) | Change currency after reaching payment | Totals recomputed or cart-changed handling fires; never charged in the wrong currency | NOT RUN |
| CUR-05 | P2 | Large KRW amount | ₩10,000,000+ | Displays with correct separators; within Stripe limits; charges correctly | NOT RUN |

---

## If you have about an hour tonight: smoke subset

These 10 cover the ways a payment step most often costs real money or trust on launch night:

**PAY-01, PAY-02, 3DS-01, 3DS-02, SAV-01, TOT-01, DEC-01, DEC-05, IDM-01, CUR-01**

For each one, record the real result (PASS / FAIL / BLOCKED), the tester, the date and time, the environment, and the Stripe PaymentIntent ID as evidence. Mark the rest **NOT RUN**.

## What to put on the release ticket instead

Something like this is honest and still lets the release go ahead if your process allows it:

> Payment step test matrix attached (32 cases). Smoke subset of 10 P0 cases executed on staging, [date], results in sheet. Remaining 22 cases not run before release; planned for [date]. Known gaps: [list any FAIL/BLOCKED].

If none can be run before release, say that on the ticket. Then whoever approves the release decides with the real picture. That's their call to make, and it protects you if something goes wrong.

## Risks

- **Highest-impact untested areas:** double charge (IDM-01/02), charging a stale total (TOT-01/02), and KRW amounts off by ×100 (CUR-01). Each one means real money moving wrongly, with refunds and support load.
- **Releasing with no run at all** means the first real customers are the test. At minimum, watch Stripe for duplicate PaymentIntents and amount mismatches during the first hours, and have a rollback or feature flag ready.
- A sheet with fabricated PASS results would also make any incident review harder, because it points investigators away from the real cause.

## Open questions

1. Which 5 saved cards are shown when a user has more than 5 (most recent, default first, or something else)?
2. How is the idempotency key scoped: per session or per attempt? Per session can block a legitimate retry after a decline (IDM-04).
3. Is the total check enforced server-side, or only in the UI?
4. What is the rounding rule for tax and discounts in KRW?

## Next actions

1. Run the 10-case smoke subset on staging with Stripe test cards and record real results.
2. Update the ticket with the executed/not-run status above.
3. Set up post-release monitoring for duplicate charges and amount mismatches.
4. Schedule the remaining P1/P2 cases for the first day after release.

Would you like this as CSV so you can paste it straight into your sheet?
