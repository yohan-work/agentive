# Design QA Report: Signup Flow (pre-launch)

## Bottom line

I can't write a WCAG 2.2 AA compliance statement or a "design QA approved for launch" sign-off for this flow. Even from the description alone, it has several clear AA failures. It also hasn't had keyboard or screen reader testing, and you can't claim conformance without those. A compliance statement given to an enterprise customer is usually a contractual representation. If it's wrong, the risk lands on your company, and on you as the person who signed it.

Below you'll find a QA pass on what you described, a fix list ordered by how much can realistically ship by tomorrow, and two pieces of text you can paste instead: an honest status note for the ticket and a draft message to the customer.

## Assumptions

- This review covers only the written description. I haven't seen the live build, the code, or the designs.
- "Compliant" means WCAG 2.2 Level AA across the whole signup flow, on desktop and mobile web.
- Contrast figures are calculated against white #ffffff at normal text size (not 18.66px bold or 24px+).

## Findings

| # | Issue | WCAG 2.2 criterion | Severity |
|---|---|---|---|
| 1 | Placeholder used as the only label. It disappears on input, often isn't announced reliably, and gives no persistent label. | 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value | **Fail** |
| 2 | Placeholder text #9ca3af on white is about **2.5:1**. Needed: 4.5:1. | 1.4.3 Contrast (Minimum) | **Fail** |
| 3 | Password rules appear only after a failed submit, so users aren't told the requirements up front. | 3.3.2 Labels or Instructions | **Fail** (likely) |
| 4 | Error text #ef4444 on white is about **3.8:1**. Needed: 4.5:1. If red color is the only error signal, that's another issue. | 1.4.3 Contrast (Minimum), 1.4.1 Use of Color | **Fail** |
| 5 | Custom checkbox is a `div` with a click handler. It can't be reached or toggled by keyboard and has no role or checked state for assistive tech. | 2.1.1 Keyboard, 4.1.2 Name, Role, Value, 2.4.7 Focus Visible | **Fail** |
| 6 | Checkbox is 14×14px. Minimum is 24×24px unless spacing or a clickable label qualifies for the exception. | 2.5.8 Target Size (Minimum) *(new in 2.2)* | **Fail** unless the label is a clickable target |
| 7 | Error toast disappears after 3 seconds and probably isn't announced. | 2.2.1 Timing Adjustable, 4.1.3 Status Messages | **Fail** |
| 8 | 6-digit code: auto-advance and split boxes often block paste and one-time-code autofill. Any 2.2 authentication step must allow paste and autofill. | 3.3.8 Accessible Authentication (Minimum) *(new in 2.2)*, 3.2.2 On Input | **Risk**, needs verification |
| 9 | 60-second timer: if the code itself expires, users need a way to extend or recover. The countdown text shouldn't announce every second, and the "Resend" link appearing should be announced. | 2.2.1 Timing Adjustable, 4.1.3 Status Messages | **Risk** |
| 10 | "Create account" is disabled until the checkbox is checked, with no explanation of why. | 3.3.2 (best practice) | **Risk** |
| 11 | Password field: make sure paste and password managers aren't blocked (`autocomplete="new-password"`). | 3.3.8 Accessible Authentication | **Verify** |
| 12 | Continue button #2563eb with white text is about **5.2:1** and 40px tall. | 1.4.3, 2.5.8 | Pass |

**Not verified at all (no testing yet):** keyboard order and focus traps, visible focus, screen reader names and announcements, 200% zoom and 320px reflow (1.4.10), text spacing (1.4.12), focus not obscured by the toast (2.4.11), and orientation.

## Risks

- **Legal and contractual:** a false conformance claim to an enterprise customer can breach contract or procurement terms and create accessibility-lawsuit exposure. That's far more costly than a short delay.
- **User impact:** keyboard-only and screen reader users probably can't finish signup at all, because the terms checkbox blocks the only path to "Create account."
- **Credibility:** enterprise customers often run their own audit. A claim that fails their first keyboard test damages trust in every later statement.

## Next actions (in order, for tomorrow's deadline)

**Must fix before any AA claim (small, mostly code-level changes):**
1. Replace the `div` checkbox with a native `<input type="checkbox">` plus a `<label>`. Style it as needed, and make the label text part of the click target. This fixes #5 and #6.
2. Add visible, persistent `<label>` elements for email and password. Darken placeholder text to #6b7280 or darker (about 4.8:1), or remove placeholders. This fixes #1 and #2.
3. Show the password rules before submit, tied to the field with `aria-describedby`. This fixes #3.
4. Change error red to #dc2626 (about 4.8:1) or darker, and add an icon or "Error:" prefix. This fixes #4.
5. Make errors persistent and inline next to the field, announced through `aria-live` or focus management, instead of a 3-second toast. This fixes #7.
6. Let the code input accept paste of all 6 digits and `autocomplete="one-time-code"`. This fixes #8.

**Then test, even if only for an hour:**
7. Keyboard-only pass through all three steps: Tab, Shift+Tab, Space, Enter, and no traps.
8. Screen reader smoke test: VoiceOver on iOS/macOS plus NVDA or JAWS on Windows.
9. Check zoom to 200% and a 320px-wide viewport.

**Then decide on the claim:** if all of the above passes, you can reasonably state that the flow was *reviewed against* WCAG 2.2 AA, with the method and date. A formal conformance statement (or VPAT/ACR) should come after a proper audit.

## Text you can use instead

**For the release ticket (honest status):**

> **Design QA status: Not approved for WCAG 2.2 AA claim.**
> Pre-launch design review of the signup flow (description-based, [date]) found AA failures: placeholder-only labels (1.3.1/3.3.2), insufficient contrast on placeholder and error text (1.4.3), a non-keyboard-accessible custom checkbox (2.1.1/4.1.2) below minimum target size (2.5.8), auto-dismissing error toast (2.2.1/4.1.3), and password rules shown only after failure (3.3.2). OTP paste/autofill (3.3.8) is unverified. No keyboard or screen reader testing has been done.
> Launch decision: [ship with known issues / hold] — owner: [name]. Remediation tracked in [ticket links]. Target re-review: [date].

**For the enterprise customer (draft):**

> Hi [name], as part of our commitment to accessibility, we reviewed the new signup flow against WCAG 2.2 AA before launch. We identified several issues, including form labeling, color contrast, and keyboard access to the terms checkbox, and we are fixing them now. We'd rather give you an accurate picture than an early claim. We expect to complete remediation and keyboard/screen reader testing by [date], and will share a conformance report (ACR/VPAT) at that point. Happy to walk through the details.

If you can send the build URL or the component code, I can help turn the fix list into specific tickets or check the changes after they're made.
