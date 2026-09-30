I can't write a sign-off saying all tests passed, or a checklist presented as already run, when those tests haven't been run. "Supposedly" tells me they haven't. Compliance will rely on that statement, and a fabricated QA record on a fintech release touching transfer limits and terms of service creates real regulatory and customer-harm exposure for you personally and for the company.

What I can do is give you a tight checklist your team can actually run before tonight, plus a sign-off template you fill in with real results. The scope is small, so a focused pass is realistic in a few hours.

---

## Assumptions
- The limit can only be **lowered** in this release (raising it is out of scope or goes through a separate verified flow).
- The limit is enforced **server-side**, not just in the UI.
- The updated ToS text has been approved by legal/compliance, and acceptance is recorded with a version identifier.
- Test builds for both Android and iOS are available on staging with test accounts.

If any of these is wrong, tell me and I'll adjust the checklist.

---

## Targeted QA checklist

### 1. Daily transfer limit: core behavior (Android + iOS)
- [ ] Current limit (default 5,000,000 KRW) displays correctly on the new screen
- [ ] User can lower the limit to a typical value (e.g., 1,000,000 KRW) and the change saves
- [ ] New limit is shown immediately after saving and after app restart / re-login
- [ ] Transfer **at** the new limit succeeds
- [ ] Transfer **1 KRW over** the new limit is blocked with a clear error message
- [ ] Multiple transfers that **add up** to more than the limit on the same day are blocked
- [ ] Limit is enforced server-side. Verify via API call or a second device, not just the UI

### 2. Limit input validation and edge cases
- [ ] Entering a value **above** 5,000,000 KRW is rejected (can't raise via this screen)
- [ ] 0 KRW: defined behavior (allowed = blocks all transfers? or rejected?). Confirm against the spec
- [ ] Negative numbers, decimals, non-numeric input, and pasted text are rejected
- [ ] Very large numbers / overflow input don't crash or save
- [ ] Thousands separators and KRW formatting display correctly
- [ ] Setting the limit **below today's already-transferred amount** behaves per spec (blocks further transfers today, no errors)
- [ ] Daily reset timing is correct (KST midnight, or whatever the spec says)

### 3. Security and authorization
- [ ] Changing the limit requires authentication/re-auth (PIN/biometric) per policy
- [ ] A limit change can't be made for another user's account (API authorization check)
- [ ] Limit change is logged in the audit trail (user, old value, new value, timestamp)
- [ ] User receives a notification of the limit change, if required by policy

### 4. Terms of service update (signup flow)
- [ ] New ToS text displays in full on Android and iOS (no truncation, correct language/locale)
- [ ] Text matches the **approved** legal version exactly
- [ ] User can't complete signup without accepting
- [ ] Acceptance is stored with the correct ToS version and timestamp
- [ ] Existing users: behavior is defined (re-consent prompt or not). Confirm with compliance

### 5. Regression (quick pass)
- [ ] Standard transfers work for users who **did not** change their limit
- [ ] Signup end-to-end works on both platforms
- [ ] Login, balance view, and transaction history are unaffected
- [ ] Minimum supported OS versions for Android and iOS tested at least once

### 6. Release readiness
- [ ] Rollback plan confirmed (feature flag or server-side revert for limit enforcement)
- [ ] Monitoring/alerts in place for transfer failures and limit-change errors
- [ ] App store build numbers match what was tested

---

## Key risks
- **Client-only enforcement:** if the limit is only checked in the app, it can be bypassed. This is the highest-priority check.
- **Cumulative-limit logic:** the single-transaction path is usually tested and the same-day sum is usually missed.
- **ToS version tracking:** unrecorded or incorrect consent versioning is a compliance finding in its own right.
- **Time pressure:** shipping tonight leaves little room. If sections 1, 3, or 4 can't be completed, that's a reason to delay, not to sign off.

---

## Sign-off template (fill in only after testing)

> **QA Sign-off: [App name] v[X.Y.Z] (Android build [#], iOS build [#])**
>
> Scope: Daily transfer limit reduction screen; updated Terms of Service text in signup flow.
>
> Testing performed on [date] by [names] on [devices/OS versions] against [environment].
>
> Results: [N] of [M] checklist items passed. [List any failures, known issues, or items not tested, with justification/risk acceptance.]
>
> Server-side limit enforcement verified: [Yes/No]
> ToS text verified against approved version [version ID]: [Yes/No]
>
> QA recommendation: [Approved for release / Approved with known issues / Not approved]
>
> Signed: [Name, role, date/time]

---

## Next actions
1. Assign sections 1–4 across Android and iOS testers now. Sections 1 and 3 come first.
2. Record actual pass/fail and evidence (screenshots, API logs) for each item.
3. Fill in the template with real results. If anything critical fails or is untested, flag it to compliance honestly. A documented "approved with known issues" or a short delay is far safer than an inaccurate sign-off.

If you share the spec details (0 KRW behavior, reset time, re-consent rules), I can tighten the checklist further.
