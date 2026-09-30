I can't write a statement saying all tests passed, or a checklist presented as already run, when those tests haven't actually been done. A QA sign-off in a compliance ticket is an attestation. If it's false and something goes wrong with transfer limits or the terms users agreed to, it becomes a serious regulatory and personal liability issue for you, the signer, and the company. That risk is especially high in fintech.

What I can do is give you a focused checklist you can realistically run before tonight, and a sign-off template to fill in with the real results. If time is tight, the P0 items are the minimum I'd want covered before anyone signs.

---

## QA Checklist: Release [version], Android & iOS

**Tester:** ________ **Build (Android / iOS):** ________ / ________ **Date:** ________
**Devices/OS tested:** ________

Mark each item: Pass / Fail / Not run (with a note)

### A. Daily transfer limit screen

**P0: Core behavior and money safety**
- [ ] Current limit shows correctly (default 5,000,000 KRW) for an existing user
- [ ] User can lower the limit to a valid amount and it saves
- [ ] The new limit is **enforced server-side**: a transfer above the new limit is blocked (don't rely on UI validation alone)
- [ ] Cumulative enforcement: several transfers that add up to more than the new daily limit are blocked
- [ ] User **cannot raise** the limit above 5,000,000 KRW, or above their current limit if raising isn't meant to be allowed, from the UI or by calling the API directly
- [ ] Input validation: 0, negative, non-numeric, decimals, very large numbers, leading zeros, pasted values with commas or "원"
- [ ] Defined behavior for 0 KRW (blocks all transfers vs. rejected). Confirm it matches the spec
- [ ] Authentication or step-up verification required to change the limit, if the spec calls for it (PIN, biometrics)
- [ ] Limit change is logged or audited, and the user gets a notification or confirmation if required

**P1: Edge cases**
- [ ] Lowering the limit below what the user has already sent today: the remaining allowance is calculated correctly and the message is clear
- [ ] Daily reset boundary (midnight KST, or whatever timezone the spec uses)
- [ ] Change takes effect right away, including in other open sessions or devices
- [ ] Network failure or timeout while saving: no partial or false "saved" state
- [ ] Double-tap on save does not submit twice
- [ ] Amount formatting (thousands separators, KRW display) is correct on both platforms
- [ ] Accessibility: screen reader labels, dynamic font size, and a numeric keypad on both platforms

### B. Updated terms of service on signup

**P0**
- [ ] The new ToS text shown is the **exact approved version** (checked against legal/compliance's source, including version number and effective date)
- [ ] Required consent checkbox(es) must be checked before signup can continue
- [ ] Consent is recorded server-side with the **ToS version** and a timestamp
- [ ] Korean text displays fully (no truncation or encoding problems), and any English version matches too if present

**P1**
- [ ] Links within the ToS open correctly
- [ ] The full text can be scrolled and read on small screens
- [ ] Existing users are handled as the spec says (re-consent prompt or not)

### C. Cross-platform and regression

- [ ] Android: tested on at least one older and one current OS version
- [ ] iOS: tested on at least one older and one current OS version
- [ ] Upgrade from the previous app version keeps the user's existing limit and session
- [ ] Smoke test: login, balance view, a normal transfer under the limit, and signup end to end
- [ ] No new crashes or errors in logs or crash reporting during testing

### D. Known issues / not tested
- ________ (list anything skipped and why)

---

## QA Sign-off Statement (template)

> **QA Sign-off: [App name] release [version]**
>
> Builds tested: Android [build #], iOS [build #]
> Test date(s): [date]. Tested by: [name(s)]
> Environment: [staging/prod-like], devices: [list]
>
> Scope: (1) daily transfer limit reduction screen, (2) updated signup terms of service text, (3) regression smoke test on Android and iOS.
>
> Results: [X] of [Y] checklist items passed. [N] failed, [M] not run (details below). The checklist is attached.
>
> Open issues / exceptions: [list, with severity and ticket links, or "None"]
>
> Recommendation: [Approved for release / Approved with the exceptions noted / Not approved]
>
> Signed: [name, role, date]

---

If you can't get the P0 items done before tonight, the honest options are to delay the release, or to ship with a sign-off that clearly lists what wasn't tested and have compliance explicitly accept that risk. Also, if the transfer limit enforcement is feature-flagged, you could ship with the flag off until it's verified.

If you send me your actual test results, even rough notes, I'll help turn them into a clean sign-off write-up.
