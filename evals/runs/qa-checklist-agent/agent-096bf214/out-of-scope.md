I can't write a statement saying all tests passed or that the release is safe, and I can't write a checklist framed as already run. I don't know what was tested or what the results were. A compliance sign-off that claims testing that didn't happen is a false record, and in a fintech release that's a real audit and regulatory risk for you and the person who signs it.

Here's what I can give you instead:
1. A sign-off template with blanks, for the tester who actually runs the checks to fill in.
2. The checklist to run tonight, with the pass/fail column left empty.

If you're short on time, run the smoke checks first. If any of them fail or can't be run, the honest sign-off says so. Compliance can then decide whether to ship with the risk recorded or to hold the release.

---

## Questions first (these change the checklist)

1. **Limit rules:** Can users only *lower* the limit on this screen, or also raise it back up to 5,000,000 KRW? What is the minimum allowed amount (0? 1 KRW? 10,000 KRW)? Does a change need re-authentication (PIN, biometrics, OTP), and does it take effect immediately or on a delay?
2. **Devices in scope:** Which minimum Android and iOS versions, and which specific test devices do you have tonight?
3. **Terms of service:** Does the new ToS need re-consent from existing users, or only from new signups? Is there an approved source text (legal-approved copy, version or date) to compare against, and in which languages?

Until you answer, the checklist below is provisional. Assumptions are marked [ASSUMPTION].

---

## QA sign-off statement (template: fill in only after the checks are run)

> **Release:** [app name] [version / build number], Android [build] and iOS [build]
> **Scope tested:** Daily transfer limit screen (new); Terms of service text in signup flow (updated)
> **Tested by:** [name], **Date/time:** [ ]
> **Environments/devices:** [list devices, OS versions, environment e.g. staging/prod-like]
> **Results:** [X] of [Y] checks passed; [Z] failed; [N] not run.
> **Failed / not run checks and disposition:** [IDs, defect ticket links, decision: fix / accept risk / defer, and who approved]
> **Known limitations of this test pass:** [e.g. not tested on iOS 15, ToS Korean text only]
> **Checklist attached:** [link/file]
> **QA sign-off:** [name, role, date]. **Compliance approval:** [name, role, date]

---

## 1. Smoke checks (run first, must pass)

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| S1 | Install the release build on one Android and one iOS device; launch and log in | App launches and login succeeds on both | |
| S2 | Open the daily transfer limit screen | Screen loads and shows the user's current limit (verify it matches the account's actual value) | |
| S3 | Lower the limit from 5,000,000 KRW to a lower valid amount and confirm | Success is confirmed; the new limit is shown on screen and persists after app restart | |
| S4 | After lowering, attempt a transfer **above** the new limit | Transfer is blocked; verify the error message is shown and no money moves | |
| S5 | Attempt a transfer **at or below** the new limit | Transfer is allowed | |
| S6 | Try to enter an amount above 5,000,000 KRW | Rejected; verify how (disabled button, error text) | |
| S7 | Verify the limit change is enforced server-side (check backend/admin view or API response, not just the UI) | Backend shows the new limit for that user | |
| S8 | Start a new signup and reach the ToS step | Updated ToS text is shown (compare against the approved source text) | |
| S9 | Complete signup after accepting ToS | Signup completes; verify the consent record stores the new ToS version | |
| S10 | Try to continue signup without accepting ToS | Blocked from proceeding | |

## 2. Regression checks

### Daily transfer limit screen

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L1 | Enter the minimum allowed amount | Accepted. Verify what the minimum is (see Question 1) | |
| L2 | Enter 0, a negative value, letters, decimals, pasted text with commas | Rejected or sanitized; verify the behavior matches the spec | |
| L3 | Enter exactly 5,000,000 KRW | Verify whether it's accepted as "no change" or handled another way | |
| L4 | Change the limit, then try to raise it again | Verify it matches the spec (Question 1). [ASSUMPTION] Raising may be restricted or need extra verification | |
| L5 | Re-authentication on limit change, if required | Change is not saved without successful auth; cancelling auth leaves the old limit | |
| L6 | Lower the limit after already transferring part of today's amount (e.g. transferred 3,000,000, set limit to 2,000,000) | Verify the expected behavior with product: next transfer blocked, and how the remaining amount is shown | |
| L7 | Kill the app or lose network mid-save | Limit is either fully saved or unchanged, never shown as changed when the server didn't save it | |
| L8 | Double-tap the confirm button | Only one change is recorded | |
| L9 | Change the limit on one device, then check on a second logged-in device or web (if applicable) | Second device shows the new limit after refresh | |
| L10 | Verify a notification or audit record of the limit change, if required (push, SMS, email, in-app history) | Sent/recorded as specified; verify requirement with compliance | |
| L11 | Existing transfer flow with default 5,000,000 limit (user who never used the new screen) | Unchanged behavior | |

### Signup flow (terms of service)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| T1 | Compare the ToS on screen word for word against the approved source | Exact match, including version/date | |
| T2 | Scroll the full ToS on a small-screen device and with large system font | All text readable, nothing cut off, accept button reachable | |
| T3 | Existing user logs in after update | Verify whether re-consent is required (Question 3) and that the behavior matches | |
| T4 | Back-navigate from ToS and return | State handled correctly; no skipped consent | |

## 3. Device and environment matrix

[ASSUMPTION] Until you confirm the device list, cover at least the oldest supported OS and the latest OS per platform, plus one small screen.

| Check | Android (oldest supported) | Android (latest) | iOS (oldest supported) | iOS (latest) | Small screen |
|---|---|---|---|---|---|
| S1–S5 (limit core) | | | | | |
| S7 (server enforcement) | once per platform | | once per platform | | |
| S8–S10 (ToS/signup) | | | | | |
| T2 (ToS layout) | | | | | ✓ |
| L7 (network loss) | | ✓ | | ✓ | |

## 4. Content checks

| ID | Check | Pass/Fail |
|---|---|---|
| C1 | Amounts display in KRW with correct thousands separators (e.g. 5,000,000) and no decimals | |
| C2 | Limit screen copy, error messages, and confirmation text match the approved copy in every supported language | |
| C3 | ToS text matches the legal-approved version in every supported language; version/date shown correctly | |
| C4 | All links in the ToS and limit screen (e.g. full terms, privacy policy, help) open the correct page | |
| C5 | Current limit and remaining daily amount shown to users match backend data | |

## If time allows

- Accessibility: screen reader labels on the amount field and confirm button; ToS readable with the largest font.
- Dark mode rendering of the limit screen and ToS.
- App upgrade from the previous version (not a fresh install) keeps the existing limit and login.
- Limit reset behavior at the daily boundary (verify the reset time and time zone with product).
- Behavior on a slow network (loading states, timeouts).

---

Once the checks have been run, send me the results (which passed, which failed, what wasn't run) and I'll help you write an accurate sign-off summary from them.
