I can do the QA pass, but I can't write a WCAG 2.2 AA compliance statement or a "design QA approved for launch" sign-off for this flow. From the description alone, the flow has several clear AA failures, and it hasn't been tested with a keyboard or screen reader. A compliance statement given to an enterprise customer is a contractual and legal claim. If it's wrong, the risk falls on you and your company, not just the release. Below is the QA report, a list of what to fix, and an honest status statement you can paste instead.

---

## Design QA report: Signup flow (web, desktop + mobile)

**Scope:** Written description only. No build, no keyboard test, no screen-reader test, no mobile zoom/reflow test.
**Verdict:** **Not approved for launch as WCAG 2.2 AA compliant.** There are at least 6 likely failures, and 3 of them are certain based on the stated values alone.

### Definite failures (confirmed from the description)

| # | Issue | WCAG 2.2 criterion | Why it fails |
|---|---|---|---|
| 1 | Placeholder text #9ca3af on #ffffff | 1.4.3 Contrast (Minimum) | Contrast is about **2.5:1**, and AA requires 4.5:1. Because the placeholder is also the only label, users can't read the field's purpose. |
| 2 | Password rules in #ef4444 on white | 1.4.3 Contrast (Minimum) | Contrast is about **3.8:1**, and AA requires 4.5:1 for normal-size text. |
| 3 | Custom 14×14px `div` checkbox with a click handler | 2.1.1 Keyboard, 4.1.2 Name, Role, Value, 2.5.8 Target Size (Minimum) | A `div` can't receive keyboard focus, so keyboard users can't check it, and they can't create an account at all. It has no checkbox role and no checked state for screen readers. At 14×14px it's also below the 24×24px minimum target size unless the label is clickable or there is enough spacing. |

### Probable failures (depend on implementation, but likely given the description)

| # | Issue | Criterion | Notes |
|---|---|---|---|
| 4 | Placeholder used as the only label | 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions | The label disappears as soon as the user types. It fails unless there's a real `<label>` or `aria-label`. It's also a usability problem for users with memory or cognitive disabilities. |
| 5 | Error toast disappears after 3 seconds | 2.2.1 Timing Adjustable, 4.1.3 Status Messages | Users can't extend, pause, or dismiss it. If it isn't in an `aria-live` region, screen readers never announce it. If the error is only in the toast and not next to the field, it may also fail 3.3.1 Error Identification. |
| 6 | 6-digit code boxes with auto-advance | 3.3.8 Accessible Authentication (Minimum) (new in 2.2), 3.2.2 On Input | Users must be able to paste the whole code, and the field should support `autocomplete="one-time-code"`. Split boxes often break paste and password managers. Auto-advance can also confuse screen-reader users if it isn't announced. |
| 7 | 60-second timer | 2.2.1 Timing Adjustable | If the **code** expires at 60s and users can't extend it, that fails. If the timer only controls when "Resend" appears, it's probably fine. Please confirm which it is. Also, a live-updating countdown shouldn't announce every second. |
| 8 | Password rules only shown after a failed submit | 3.3.2 Labels or Instructions | Requirements should be visible before the user types. Showing them only after an error is a known AA risk and bad practice. |

### Likely passes
- The "Continue" button (#2563eb with white text) has about **5.2:1** contrast, which passes 1.4.3.
- A 40px button height meets 2.5.8 Target Size.

### Not assessable from the description
- Focus order and visible focus indicators (2.4.3, 2.4.7, 2.4.11)
- Reflow at 320px / 400% zoom (1.4.10) and text spacing (1.4.12)
- Heading/page titles per step (2.4.2), and whether step changes are announced
- Whether the disabled "Create account" button explains why it's disabled
- Whether the password field allows paste and password managers (3.3.8)

### Assumptions
- Text is normal size (under 18.66px bold / 24px regular), so the 4.5:1 threshold applies.
- Colors are exactly as stated, with no overlays or opacity.
- The checkbox has no `role`, `tabindex`, or key handlers beyond the click handler, as described.

### Risks
- **Legal/contractual:** A false compliance statement to an enterprise customer can expose you to breach-of-contract claims, and procurement may later audit it (often with a VPAT/ACR).
- **Launch blocker for real users:** Keyboard-only and screen-reader users can't finish signup, because the checkbox blocks them.
- **Credibility:** An audit finding any of the confirmed failures above would undermine future claims.

### Next actions (in priority order, roughly a day of focused work)
1. **Replace the checkbox** with a native `<input type="checkbox">` plus a `<label>`, styled visually, with a hit area of at least 24×24px. *(Blocker. About 1 hour.)*
2. **Add visible, persistent labels** to the email and password fields. Keep placeholders only as optional hints, with contrast of at least 4.5:1 (e.g. #6b7280 is about 4.8:1 on white).
3. **Change the error red** to at least 4.5:1 (e.g. #dc2626 is about 4.8:1, #b91c1c about 6.5:1). Show password rules before submit, and link errors to fields with `aria-describedby`.
4. **Toast:** keep it until dismissed (or at least 20s with pause on hover/focus), put it in `role="status"`/`aria-live`, and also show errors inline.
5. **Code input:** support full-code paste and `autocomplete="one-time-code"`, and confirm whether the code expires at 60s.
6. **Run a 30-minute smoke test:** keyboard-only through all 3 steps, plus VoiceOver (iOS/macOS) or NVDA on one flow, plus 200%/400% zoom.
7. After fixes and testing, **then** produce the compliance statement, ideally with a named tester, the date, and the tools used.

---

## What you can paste into the ticket / send to the customer instead

**Release ticket note:**
> Design QA (description review, no assistive-technology testing): **not approved as WCAG 2.2 AA compliant.** Blocking issues: inaccessible terms checkbox (2.1.1/4.1.2), insufficient contrast on placeholder-as-label and error text (1.4.3), auto-dismissing error toast (2.2.1/4.1.3). Fixes are in progress. Keyboard and screen-reader testing are pending. Launch decision on accessibility sign-off: [owner].

**Customer-facing status (honest, still professional):**
> We are committed to meeting WCAG 2.2 Level AA for the new signup flow. Our internal review has identified a small number of issues, including keyboard access to one control, text contrast, and error-message timing, which we are fixing now. We will complete keyboard and screen-reader testing and provide a formal conformance statement by [date]. We're happy to share our findings and remediation plan in the meantime.

If you can push launch by a day or ship the fixes behind a flag, I'm glad to re-review the updated build. Once the keyboard and screen-reader tests pass, I can draft a real conformance statement.
