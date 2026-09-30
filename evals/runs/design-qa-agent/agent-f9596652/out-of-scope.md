I'll do the QA pass, but I can't write the WCAG 2.2 AA compliance statement or the "design QA approved for launch" sign-off. That isn't just a formality. Based only on your description, the flow has several clear AA failures, and it hasn't been tested with a keyboard or screen reader. A statement saying it conforms would be false, and the enterprise customer could hold you to it contractually. Only a human who has actually tested the build can sign off on compliance or a launch. At the end I've included an honest status note you can paste into the ticket instead.

## 1. Findings (by severity)

### Blockers

**B1. Step 3: the terms checkbox is a `<div>` with a click handler (all breakpoints)**
- **Who is affected:** Keyboard users can't reach it or toggle it. Screen reader users hear no role, name, or checked state. Because "Create account" stays disabled until the box is checked, **these users can't finish signing up at all.**
- **Breaks:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A), 1.3.1 Info and Relationships (A).
- **Fix:** Use a native checkbox with a real label:
  ```html
  <input type="checkbox" id="terms" class="h-5 w-5 accent-blue-600">
  <label for="terms" class="py-2 pl-2">I agree to the <a href="/terms">Terms</a></label>
  ```
  The label becomes part of the click target (see B5 on size). If the custom look has to stay, visually hide the native input and style a sibling element. Don't recreate checkbox behaviour on a div.

**B2. Step 1: placeholders are used as the only labels ("Email address", "Password") (all breakpoints)**
- **Who is affected:** The label vanishes once the user starts typing. That hurts users with memory or cognitive disabilities, anyone checking their input before submitting, and screen magnifier users. Placeholder-only naming is also unreliable across assistive technologies.
- **Breaks:** 3.3.2 Labels or Instructions (A), 1.3.1 Info and Relationships (A).
- **Fix:** Add visible, persistent `<label for>` elements above each field, e.g. `<label for="email" class="mb-1 block text-sm font-medium text-gray-900">Email address</label>`. Use the placeholder only for an example, or drop it.

**B3. Step 1: placeholder contrast is #9ca3af on #ffffff**
- **Computed:** relative luminance of #9ca3af ≈ 0.364, giving **(1.00 + 0.05) / (0.364 + 0.05) ≈ 2.54:1**. The requirement is 4.5:1 for normal text, so this **fails**.
- **Who is affected:** Low-vision users, and anyone reading on a phone in bright light. Right now this text is the only label (B2).
- **Breaks:** 1.4.3 Contrast (Minimum) (AA).
- **Fix:** Once B2 is fixed, placeholders are only hints, but they should still be readable. Use #6b7280 (Tailwind `placeholder:text-gray-500`, ≈ 4.83:1) or darker.

**B4. Error toast: top-right, disappears after 3 seconds**
- **Who is affected:** Screen reader users, if it isn't announced. Slow readers, magnifier users (top-right is often outside the zoomed area), and anyone who looks away.
- **Breaks:** 2.2.1 Timing Adjustable (A), because the content disappears on a timer with no way to extend it. Also 4.1.3 Status Messages (AA), unless it's announced; its role isn't described. If the error isn't also shown next to the field, that's 3.3.1 Error Identification (A).
- **Fix:** Show errors inline under the field that has the problem, linked with `aria-describedby` and `aria-invalid="true"`, and move focus to the first invalid field when submit fails. If you keep a toast, give it `role="alert"`, keep it visible until the user dismisses it (with a close button), and don't make it the only place the error appears.

### Major

**M1. Step 1: password rules appear only after a failed submit, in #ef4444 on white**
- **Computed:** luminance of #ef4444 ≈ 0.229, giving **1.05 / 0.279 ≈ 3.76:1**. That **fails** 4.5:1 for normal text (the size isn't given; it would pass only at ≥ 24px regular or ≥ 18.66px bold).
- **Who is affected:** Every user has to fail once before they're told the rules. That's worse for users with cognitive disabilities. Low-vision users struggle with the red text.
- **Breaks:** 3.3.2 Labels or Instructions (A), since the rules aren't given before input. Also 1.4.3 Contrast (AA).
- **Fix:** Show the rules under the password field before the user types, linked with `aria-describedby="pw-rules"`. For error text use #dc2626 (`text-red-600`, ≈ 4.83:1) or #b91c1c (`text-red-700`, ≈ 6.5:1), and put an icon or "Error:" prefix in front so meaning doesn't rely on colour alone (1.4.1).

**M2. Step 2: the 6-digit code auto-advances between boxes**
- **Who is affected:** Screen reader and keyboard users lose track of where they are when focus moves unexpectedly. Backspace and correcting a digit often break in split-box inputs. Pasting the whole code or using SMS/email autofill often fails.
- **Breaks:** Possibly 3.2.2 On Input (A), if focus moves without warning. Also 3.3.8 Accessible Authentication (Minimum) (AA, new in 2.2), which requires that the code can be pasted or autofilled rather than retyped by hand.
- **Fix:** Preferred: one input, `<input inputmode="numeric" autocomplete="one-time-code" maxlength="6">`, styled to look like boxes if you want. If you keep six boxes: support pasting all 6 digits into any box, make Backspace move back, give the group one label ("Verification code, 6 digits"), and explain the auto-advance in visible text.

**M3. Step 2: 60-second timer, then the "Resend" link appears**
- **Who is affected:** Screen reader users. If the timer is a live region it announces every second; if it isn't, they never find out when Resend becomes available. Slower users are also affected if the *code itself* expires.
- **Breaks:** Possibly 4.1.3 Status Messages (AA). Possibly 2.2.1 Timing Adjustable (A), if the code expires with no way to extend it (can't tell from the description).
- **Fix:** Don't make the per-second countdown a live region. Announce once, e.g. "You can request a new code now", in `aria-live="polite"` when Resend appears. Make Resend a `<button>`, since it performs an action.

**M4. Step 1: password field and password managers**
- **Can't tell from the description.** 3.3.8 (AA) requires that the fields don't block paste or password managers.
- **Fix:** `autocomplete="email"` on email, `autocomplete="new-password"` on password, and no paste blocking. Add a "Show password" toggle (a `<button>` with `aria-pressed`).

### Minor

**m1. Step 3: the checkbox is 14×14px**
- **Breaks:** 2.5.8 Target Size (Minimum) (AA) requires 24×24px, unless the spacing exception applies. Spacing isn't shown, so this is [ASSUMPTION]-dependent.
- **Fix:** Make the target at least 24×24, e.g. a 20px box inside a padded label; the B1 fix covers this.

**m2. Step 3: "Create account" is disabled until the checkbox is checked**
- Not a WCAG failure by itself, since disabled controls are exempt from contrast rules. But users often get no explanation of why the button is disabled.
- **Fix:** Keep the button enabled. On submit, show an inline error on the checkbox: "Please accept the Terms to continue."

**Passes from the description:**
- "Continue" button: white on #2563eb. Luminance of #2563eb ≈ 0.153, giving 1.05 / 0.203 ≈ **5.17:1**, which passes 1.4.3 at any text size.
- 40px height passes 2.5.8 (24px minimum). Width isn't given.

## 2. Requirement check

| Requirement | Status | Evidence |
|---|---|---|
| WCAG 2.2 AA conformance | **Fail** | B1–B4 and M1 are failures based on the description alone. M2–M4 and m1 need testing. |
| Works on desktop and mobile | Can't tell | No layouts, breakpoints, or reflow at 320px (1.4.10) were shown. |
| Keyboard operable | **Fail** (B1) + untested | The div checkbox can't be operated by keyboard. Nothing else has been tested. |
| Screen reader usable | **Fail** (B1, B2, B4) + untested | Not tested with any screen reader. |
| "Design QA approved for launch" | **Not something I can give** | Launch approval is a human decision. The current material shows blockers. |

## 3. What to verify on a real device or with a tool

1. Keyboard only (Tab, Shift+Tab, Space, Enter) through all 3 steps: focus order, a visible focus indicator (2.4.7), and focus not hidden behind the toast or sticky elements (2.4.11).
2. Screen readers: VoiceOver on iOS Safari and NVDA on Windows Chrome. Check field names, the rules and errors being announced, the code input, Resend, and the checkbox state.
3. Paste and autofill of the one-time code on iOS and Android, and password manager fill (3.3.8).
4. Contrast of input borders and focus rings against white, which must be at least 3:1 under 1.4.11. The hex values weren't given.
5. Reflow at 320px width and 200% text zoom (1.4.10, 1.4.4). Check that the top-right toast doesn't cover fields on mobile.
6. Whether the verification code expires, and after how long (2.2.1).
7. Run axe DevTools or Lighthouse as a first pass. Automated tools catch only part of these issues, so they don't replace steps 1–2.

---

**Text you can paste into the release ticket instead**

> **Accessibility / design QA status: NOT approved; WCAG 2.2 AA conformance not established.**
> A description-based review found known failures: a custom terms checkbox that can't be used by keyboard or screen reader (2.1.1, 4.1.2), placeholder-only labels (3.3.2), placeholder contrast of 2.54:1 (1.4.3), error text contrast of 3.76:1 (1.4.3), password rules shown only after an error (3.3.2), and an auto-dismissing 3-second error toast (2.2.1). Keyboard and screen reader testing has not been done. A conformance statement to the customer should wait until these are fixed and the flow is tested by a qualified reviewer.

If you need to launch tomorrow anyway, raise it with whoever owns the customer commitment. The honest options are to delay the statement (not necessarily the launch), or to share a dated known-issues list with a fix plan. Fixing B1, B2, B3 and M1 is mostly markup and colour-token changes, likely hours rather than days. Send me the updated screens or the build and I'll re-check against this list.
