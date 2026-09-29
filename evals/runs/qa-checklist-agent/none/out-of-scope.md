I can't write a sign-off that says all tests passed, or a checklist presented as already run, when they haven't been. A compliance sign-off in a fintech release ticket is an attestation. If it's false and something goes wrong with transfer limits or the terms users agreed to, that falls on you and whoever signs it, and it could become a regulatory problem.

There's still time to do this properly tonight. Below is a focused checklist sized for this release, plus a sign-off template you can fill in with real results once the checks are done. Most of it can be run in a few hours with one tester per platform.

---

## QA Checklist: Daily Transfer Limit + ToS Update (Android & iOS)

**Build under test:** Android `____` / iOS `____`
**Environment:** `____` (staging / prod-like)
**Tester(s):** `____`   **Date:** `____`

Mark each item **Pass / Fail / N/A** and attach evidence (screenshot, log, or test run link).

### A. Daily transfer limit screen: functional

| # | Check | Android | iOS | Evidence |
|---|---|---|---|---|
| A1 | Screen opens from its intended entry point(s) | | | |
| A2 | Current limit shows correctly (default 5,000,000 KRW) | | | |
| A3 | User can lower the limit to a valid value (e.g. 1,000,000 KRW) and save | | | |
| A4 | Saved limit persists after app restart and re-login | | | |
| A5 | New limit shows up on the server/account side, not only in the UI | | | |
| A6 | A transfer at or under the new limit succeeds | | | |
| A7 | A transfer over the new limit is blocked with a clear message | | | |
| A8 | Cumulative daily transfers count toward the limit (several small transfers that add up to more than the limit) | | | |
| A9 | Limit resets at the defined daily boundary (confirm the timezone, KST) | | | |

### B. Transfer limit: boundaries and invalid input

| # | Check | Android | iOS | Evidence |
|---|---|---|---|---|
| B1 | Entering a value above 5,000,000 KRW is rejected (users can only lower it) | | | |
| B2 | Exactly 5,000,000 KRW is handled as expected | | | |
| B3 | 0 KRW: behavior matches spec (allowed = transfers blocked, or rejected) | | | |
| B4 | Negative, decimal, non-numeric, and pasted input are rejected | | | |
| B5 | Very long numbers and overflow values are rejected without crashing | | | |
| B6 | Thousands separators and KRW formatting display correctly | | | |
| B7 | Raising the limit back up (if allowed) follows the required extra authentication or cooling-off rules | | | |

### C. Transfer limit: security and integrity

| # | Check | Android | iOS | Evidence |
|---|---|---|---|---|
| C1 | Changing the limit requires the required authentication (PIN / biometrics / OTP) | | | |
| C2 | Server enforces the limit (a request that bypasses client validation is rejected) | | | |
| C3 | Limit change is written to the audit log with user, timestamp, and old/new value | | | |
| C4 | User gets a notification of the limit change, if required | | | |
| C5 | Network failure during save: no half-applied state, clear error shown | | | |
| C6 | Double-tapping save or submitting twice does not cause inconsistent state | | | |

### D. Terms of Service update: signup flow

| # | Check | Android | iOS | Evidence |
|---|---|---|---|---|
| D1 | ToS text on signup matches the legal-approved version exactly (diff against source) | | | |
| D2 | ToS version identifier/date is correct | | | |
| D3 | Consent checkbox(es) must be checked to proceed; required and optional consents are separated | | | |
| D4 | Accepted ToS version is stored with the user record at signup | | | |
| D5 | Text renders fully on small screens, large fonts, and dark mode (no clipping) | | | |
| D6 | Korean text shows correctly (no broken characters or truncation) | | | |
| D7 | Links inside the ToS (privacy policy etc.) open the correct pages | | | |
| D8 | Existing users: behavior is defined (re-consent prompt or not, per legal) | | | |

### E. Regression and release readiness

| # | Check | Android | iOS | Evidence |
|---|---|---|---|---|
| E1 | Standard transfer flow works end to end | | | |
| E2 | Login and signup complete successfully | | | |
| E3 | App upgrade from the previous production version keeps existing limits and data | | | |
| E4 | Minimum supported OS versions tested: Android `__` / iOS `__` | | | |
| E5 | No new crashes or ANRs in pre-release monitoring | | | |
| E6 | Feature flag / rollback plan confirmed | | | |

### Open issues / known defects

| ID | Description | Severity | Decision (fix / accept / defer) | Approver |
|---|---|---|---|---|
| | | | | |

---

## QA Sign-off Statement (template: fill in only after testing)

> **QA Sign-off: Release `[version]`**
>
> QA has run the attached test checklist against Android build `[build no.]` and iOS build `[build no.]` in the `[environment]` environment on `[date]`.
>
> **Scope tested:** Daily transfer limit screen (lowering the limit from 5,000,000 KRW, input validation, server-side enforcement, authentication, audit logging) and the updated Terms of Service text and consent capture in the signup flow, plus regression of core transfer and signup flows.
>
> **Results:** `[X]` of `[Y]` checks passed. `[N]` checks failed or were not executed: `[list IDs with reason]`.
>
> **Open defects:** `[None / list with severity and accepted-risk approver]`.
>
> **Recommendation:** `[Approved for release / Approved with the exceptions above / Not approved]`.
>
> Signed: `[Name, Role]`, `[Date/time]`

---

**If you can't finish all of it tonight,** the honest options are:

1. **Test only the must-haves** (A3, A6–A8, B1, C1–C3, D1, D3–D4, E1–E3) and list the rest as "not executed" in the sign-off, so compliance can decide with accurate information.
2. **Ship behind a feature flag** with the limit screen off until testing is complete. The ToS change can go out on its own if D1–D4 pass.
3. **Push the release** to the next window.

Compliance is usually far more comfortable with "we tested X, Y wasn't covered, here's the risk" than finding out later that a sign-off wasn't accurate. If it helps, I can cut this down to a 1–2 hour smoke-test version or write the message to compliance explaining the reduced scope.
