I can't write the WCAG 2.2 AA compliance statement or the "design QA approved for launch" sign-off. That's partly my role: I report what passes and fails, and a human signs off. But the bigger reason is that the description itself shows several WCAG 2.2 AA failures, and the flow hasn't been tested with a keyboard or screen reader. A compliance statement given to an enterprise customer right now would be inaccurate, and that is a contractual and legal risk for you, not just a QA issue.

Here is the QA pass, followed by text you *can* paste into the ticket and send to the customer.

---

## 1. Findings (by severity)

### Blockers

**B1. Step 3, all breakpoints: terms checkbox is a `div` with a click handler**
- **Who:** keyboard users (can't Tab to it or toggle it with Space), screen reader users (no role, no checked state, no name), voice control users. Because "Create account" stays disabled until the box is checked, **these users cannot finish signup at all.**
- **Breaks:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A), 1.3.1 Info and Relationships (A).
- **Also:** 14×14px is under the 24×24px minimum in 2.5.8 Target Size (Minimum) (AA, new in 2.2), unless the spacing exception applies. Can't tell from the description.
- **Fix:** use a native checkbox with a real label, and make the label part of the click target:
  ```html
  <label class="flex items-start gap-3 min-h-[44px] cursor-pointer">
    <input type="checkbox" id="terms" required
      class="h-6 w-6 shrink-0 accent-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
    <span>I agree to the <a href="/terms" class="underline">Terms of Service</a></span>
  </label>
  ```
  If you have to keep the custom visual, visually hide the native input (`sr-only peer`) and style a sibling with `peer-checked:` / `peer-focus-visible:`. Don't bolt `role="checkbox"` + `tabindex` + key handlers onto the div.

**B2. Step 1, all breakpoints: placeholder used as the only label**
- **Who:** screen reader users (placeholder isn't a reliable accessible name), users with memory or cognitive impairments (the label disappears as soon as they type), low-vision users (see B3).
- **Breaks:** 3.3.2 Labels or Instructions (A), 1.3.1 Info and Relationships (A).
- **Fix:** add visible, persistent `<label for>` elements: `<label for="email" class="block text-sm font-medium text-gray-900 mb-1">Email address</label>`, and the same for Password. Keep a placeholder only as an optional example. Add `autocomplete="email"` / `autocomplete="new-password"` too; this matters for B5 and 1.3.5 Identify Input Purpose (AA).

**B3. Step 1: placeholder text contrast is too low**
- **Computed:** #9ca3af on #ffffff = **2.54:1**. The requirement for normal text is **4.5:1**.
- **Breaks:** 1.4.3 Contrast (Minimum) (AA). While placeholders act as labels, this is label text, not decorative hint text.
- **Fix:** after B2, any remaining placeholder should use at least #6b7280 / `placeholder:text-gray-500` (**4.83:1**). Labels should be #111827 / `text-gray-900` (17.7:1).

**B4. Step 1: password rules hidden until a failed submit, then shown only in red #ef4444**
- **Who:** everyone (they have to fail once to learn the rules), screen reader users (the error isn't announced or tied to the field [ASSUMPTION: no `aria-describedby` / live region mentioned]), low-vision and color-blind users.
- **Computed:** #ef4444 on #ffffff = **3.76:1**, below the 4.5:1 required for normal-size text.
- **Breaks:** 3.3.2 Labels or Instructions (A) because the rules aren't given up front; 1.4.3 Contrast (AA); 3.3.1 Error Identification (A) and 1.3.1 if the error isn't programmatically associated; 1.4.1 Use of Color (A) if red is the only error indicator [ASSUMPTION: no icon or "Error:" prefix described].
- **Fix:**
  - Show the rules under the field before submit: `<p id="pw-rules" class="mt-1 text-sm text-gray-600">At least 12 characters, including a number.</p>` (gray-600 #4b5563 = 7.56:1), with `aria-describedby="pw-rules pw-error"` on the input.
  - Error text: #dc2626 / `text-red-600` (**4.83:1**) or #b91c1c / `text-red-700` (6.47:1), with an icon and an "Error:" prefix. Set `aria-invalid="true"` on the field and move focus to the first invalid field (or to an error summary) on submit.

**B5. Step 2: 6-digit code with auto-advancing boxes**
- **Who:** users who paste the code or rely on OS/password-manager autofill, screen reader users (six unlabeled boxes), users who make a typo and have to go back.
- **Breaks:** 3.3.8 Accessible Authentication (Minimum) (AA, new in 2.2) if paste or autofill doesn't work across the boxes. Transcribing a code is a cognitive function test, and supporting paste/autofill is the usual way to meet this criterion. Can't tell from the description, so verify. Possibly 3.2.2 On Input (A) as well, because moving focus automatically is a change of context. See the verify list.
- **Fix (preferred):** one field, `<input id="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" class="tracking-[0.5em] text-center text-2xl h-12">`, with a visible label ("Enter the 6-digit code we emailed to you"). If you keep six boxes, a paste into any box must fill all six, Backspace must move back, and each box needs `aria-label="Digit 1 of 6"` etc.

**B6. Global: error toast disappears after 3 seconds**
- **Who:** screen reader users (not announced unless it's a live region [ASSUMPTION]), slow readers, screen magnifier users (top-right is often outside the magnified viewport), anyone who looks away.
- **Breaks:** 2.2.1 Timing Adjustable (A); 4.1.3 Status Messages (AA) if it isn't in a live region; 3.3.1 Error Identification (A) if the toast is the only place the error appears.
- **Fix:** put errors inline next to the field or step they belong to, and keep them visible until they're fixed. If you keep a toast, it has to stay until dismissed (with a close button that has `aria-label="Dismiss"`), live in a `role="alert"` container that is present in the DOM before the message is injected, and never be the only place the error appears.

### Major

**M1. Step 2: timer and "Resend" link appearing**
- **Who:** screen reader users don't know when Resend becomes available. If the countdown is a live region, it announces every second, which is worse.
- **Breaks:** 4.1.3 Status Messages (AA).
- **Fix:** don't make the countdown live. Keep a visually hidden `aria-live="polite"` region and announce once, at 0: "You can now request a new code." Consider showing Resend from the start in a disabled state with the countdown in its text ("Resend code in 42s"), so it doesn't appear from nowhere. If the code itself expires, say how long it is valid and make sure Resend is a real `<button>`. 2.2.1 applies if the code expires before the user can reasonably enter it.

**M2. Step 3: "Create account" disabled until the checkbox is checked**
- Disabled buttons don't have to meet contrast requirements (1.4.3 exempts inactive controls), so this isn't a strict failure. But screen reader users often can't focus a disabled button or find out why it's disabled. Once B1 is fixed this is survivable. Better: keep the button enabled and, on submit, show an inline error on the checkbox: "Please accept the Terms to continue."

**M3. All steps: focus visibility not described**
- 2.4.7 Focus Visible (AA) and 2.4.11 Focus Not Obscured (Minimum) (AA, new in 2.2) can't be judged from the description. Every control needs a visible focus style, e.g. `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`. The focus indicator itself needs 3:1 against the background: #2563eb on white = 5.17:1, which passes.

### Minor

**m1. Step 1 "Continue" button: passes on the stated values**
- White on #2563eb = **5.17:1**, which passes 4.5:1. A 40px height passes 2.5.8 (24px min). Width isn't given; check it's ≥24px, which is almost certain. On mobile, consider `h-11` (44px) to match platform guidance. That isn't a WCAG AA requirement.

### Nits (optional)
- Say which email address the code went to on Step 2, and give a "Change email" link.
- Add a show/hide password toggle (`<button type="button" aria-pressed>`).

---

## 2. Requirement check

| Requirement | Status | Evidence |
|---|---|---|
| WCAG 2.2 AA compliant | **Fail** | B1 (2.1.1, 4.1.2, 2.5.8), B2 (3.3.2), B3 (1.4.3 at 2.54:1), B4 (1.4.3 at 3.76:1, 3.3.2), B6 (2.2.1). B5, M1 and M3 are likely additional failures but need testing. |
| Works on web, desktop and mobile | Can't tell | No breakpoint details. 1.4.10 Reflow at 320px, 1.3.4 Orientation and 1.4.4 Resize Text are untested. |
| Keyboard and screen reader tested | **Not done** | You said so. B1 alone makes signup impossible with a keyboard. |
| Ready to launch tomorrow | Not for me to decide | Blockers above. The launch decision belongs to your product/accessibility owner. |

---

## 3. What to verify with a device or tool

1. **Keyboard only** (desktop Chrome + Safari): Tab through all three steps and complete signup without a mouse. Check the focus order, a visible focus ring on every control, and no focus trapped in the code boxes.
2. **Screen readers:** VoiceOver on iOS Safari, NVDA + Chrome or Firefox on Windows, TalkBack on Android Chrome. Check field names, the password rules and errors being read, the code input, the "Resend" announcement, the checkbox state, and the toast being announced.
3. **Code input:** paste "123456" into the first box, iOS SMS/email autofill, a password manager, and Backspace behavior.
4. **Automated scan:** axe DevTools or Lighthouse on each step and each error state. These scans catch roughly a third of issues, so they supplement steps 1–3 and don't replace them.
5. **Zoom and reflow:** 200% text zoom, 400% browser zoom at 1280px (equivalent to 320px), and landscape on a phone.
6. **Target size:** measure the checkbox and "Resend" link hit areas in DevTools against 24×24px.

---

## What you can paste instead

**Release ticket (honest status):**
> Design QA: **not approved.** Review found 6 blocking WCAG 2.2 AA issues in the signup flow (non-keyboard-accessible terms checkbox, placeholder-only labels, placeholder and error text contrast 2.54:1 / 3.76:1 vs 4.5:1 required, password rules shown only after failure, OTP input paste/autofill unverified, 3-second auto-dismissing error toast). Keyboard and screen reader testing has not been performed. Launch decision and accessibility sign-off: [owner name].

**For the enterprise customer:** don't send a compliance claim. If you have to send something tomorrow, an accurate status is safer: "We are assessing the new signup flow against WCAG 2.2 AA. Known issues are [list] with fixes targeted for [date]. We will provide an Accessibility Conformance Report (VPAT 2.5, WCAG edition) after testing." Have legal or your accessibility lead review it before it goes out, since it may be tied to contract terms.

B1–B4 are mostly markup and color-token changes: roughly a day of front-end work plus a test pass. If the launch date can't move, it's worth asking whether it can move for the enterprise customer's tenant only.
