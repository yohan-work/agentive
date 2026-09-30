I can't write a statement saying all tests passed or that the release is safe, and I can't write a checklist framed as one you ran. Nobody has run these checks yet, and a compliance sign-off that claims otherwise is a false record. That risk falls on the person who signs it, not on the release. Below is what I can give you:

- the checklist, so your testers can run it tonight, and
- a sign-off template your team fills in with real results, names, and timestamps after the run.

If tonight's timeline doesn't leave room to run the checks, the honest options are to ship with a documented risk acceptance from compliance or to move the release. Don't attach a sign-off for checks nobody ran.

---

## Questions (most important first)

1. **How is the limit enforced?** Does the server enforce the new lower limit, or only the app? Does it count per calendar day (and in which timezone, e.g. KST midnight), or on a rolling 24 hours? These decide the most important checks below.
2. **Which devices and OS versions are supported?** What is the minimum Android and iOS version, and are tablets in scope?
3. **Can a user raise the limit again after lowering it?** If so, through which flow, and is there a delay or re-verification? Also: do users who already signed up have to re-accept the updated terms, or does the change affect new signups only?

Until you answer these, the checklist below is provisional. I've marked assumptions **[ASSUMPTION]**.

---

## 1. Smoke checks (run first; stop the release if any fail)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| S-01 | Install the release build on one Android and one iOS device. Launch the app and log in with an existing test account. | App launches and login succeeds on both. | |
| S-02 | Open the daily transfer limit screen. | Screen opens and shows the current limit (5,000,000 KRW for a default account). | |
| S-03 | Lower the limit to 1,000,000 KRW and confirm. | A success confirmation appears. Reopen the screen: it shows 1,000,000 KRW. | |
| S-04 | With the limit at 1,000,000 KRW, try a transfer of 1,000,001 KRW. | The transfer is blocked with a clear message naming the limit. No money moves. | |
| S-05 | Start a new signup and reach the terms of service step. | The updated terms text is shown (compare against the approved compliance copy). | |

---

## 2. Regression checks

### A. Daily transfer limit screen (highest risk: money movement)

**Input validation**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L-01 | Enter 5,000,000 (the current maximum) and confirm. | Accepted, or the button is disabled because nothing changed. Record which, and confirm it matches the spec. No error or crash. | |
| L-02 | Enter 5,000,001. | Rejected. The request only allows lowering the limit, so the value can't go above 5,000,000. Limit stays unchanged. | |
| L-03 | Enter 0. | Verify against the spec: "any amount" may or may not include 0 (which would block all transfers). Record the actual behavior and get product/compliance to confirm it. | |
| L-04 | Enter 1 KRW. | Accepted (the lowest positive amount). A later transfer of 2 KRW is blocked. | |
| L-05 | Enter a negative number, decimals (e.g. 1000.5), letters, emoji, and paste text with commas ("1,000,000"). | Invalid input is rejected or stripped. Pasted formatted numbers are parsed correctly or rejected. Never stored as a wrong value. | |
| L-06 | Enter a very long number (e.g. 20 digits). | Rejected cleanly. No crash, no overflow to a negative or zero value. | |
| L-07 | Leave the field empty and tap confirm. | Confirm is disabled or shows a validation error. Limit unchanged. | |
| L-08 | Check how amounts are displayed: thousands separators, "KRW"/"원" unit, and no decimals. | Consistent with the rest of the app. | |

**Enforcement (the core compliance risk)**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L-10 | Set the limit to 100,000. Transfer 60,000, then 40,000. | Both succeed (total = 100,000, exactly at the limit). | |
| L-11 | Continue from L-10: transfer 1 KRW. | Blocked. The cumulative daily total counts, not just the single transfer. | |
| L-12 | Set the limit to 100,000 after already transferring 150,000 today. | Verify the spec: the new limit either applies immediately (further transfers blocked) or takes effect next day. The actual behavior must match the spec, and the screen must explain it to the user. | |
| L-13 | **Server enforcement:** with the limit at 100,000, send a 200,000 transfer request directly to the transfer API (e.g. replay the app's request with a proxy such as Charles/mitmproxy, or have backend QA call the endpoint). | Server rejects it. **If only the app blocks it, stop the release.** [ASSUMPTION] The server enforces the limit; confirm with backend (Question 1). | |
| L-14 | Lower the limit on device A. Without restarting, transfer above the new limit from device B (same account, or web if it exists). | Blocked on device B. The limit is per account, not per device. | |
| L-15 | Reset boundary: set the limit to 100,000 and use it all up just before the daily reset time. Transfer again just after the reset. | Verify the reset time and timezone against the spec (Question 1). The used amount resets exactly then, and not before. | |
| L-16 | Set a limit, kill the app, reinstall, and log in again. | The limit persists (stored server-side), not reset to 5,000,000. | |
| L-17 | Check the transfer channels in scope (e.g. account transfer, QR/pay, scheduled/recurring transfers if they exist). | Every channel that moves money counts toward and respects the new limit. Scheduled transfers that exceed it: verify the expected behavior with product and record the actual behavior. | |

**Security and state**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L-20 | Change the limit. | Verify whether re-authentication (PIN/biometric) is required. The actual behavior must match the spec. Lowering the limit is lower risk than raising it, but record the actual behavior. | |
| L-21 | Tap confirm twice quickly, and confirm while offline or on a slow network (use the OS network conditioner / airplane mode mid-request). | One change is saved. Offline shows an error and the limit stays unchanged. The UI never shows a new value the server didn't save. | |
| L-22 | Background the app on the limit screen for longer than the session timeout, then return and confirm. | Session-expired handling works. No change is saved without a valid session. | |
| L-23 | Check the audit trail: backend/admin logs and any user notification (push/SMS/email) after a limit change. | Verify with compliance which records are required. Each change is logged with user, old value, new value, and timestamp. | |
| L-24 | Raising the limit back up (if supported, Question 3). | Follows the specified flow and verification. The limit can't be raised through the "lower" screen. | |

### B. Signup: updated terms of service

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| T-01 | Start a fresh signup on each platform and reach the terms step. | The text matches the approved final copy word for word. Do a diff against the compliance-approved document, not a visual skim. | |
| T-02 | Try to proceed without accepting the required terms. | Blocked. The required checkboxes can't be skipped. | |
| T-03 | Accept and finish signup. | Signup completes. Verify with backend that the acceptance record stores the **new** terms version and a timestamp. | |
| T-04 | Scroll through the full terms on the smallest supported screen and with the largest system font size. | All text is readable, nothing is cut off, and the accept button is reachable. | |
| T-05 | Existing users: log in with an account created before this release. | Verify against the spec (Question 3): either a re-consent prompt appears, or nothing changes. The actual behavior must match the spec. | |
| T-06 | Interrupt the signup at the terms step (kill the app, switch networks), then resume. | No account is created without a recorded acceptance. | |

---

## 3. Device and environment matrix

[ASSUMPTION] Until you answer Question 2, use at least: the oldest supported and latest OS version on each platform, one small-screen phone, and one large phone.

| Check | Android (min OS) | Android (latest) | iOS (min OS) | iOS (latest) |
|---|---|---|---|---|
| S-01 to S-05 smoke | | | | |
| L-01 to L-08 input | | | | |
| L-10 to L-17 enforcement | | | | |
| L-20 to L-23 security/state | | | | |
| T-01 to T-06 terms | | | | |
| Fresh install | | | | |
| Upgrade from current store version | | | | |

Run the upgrade row carefully: install the version currently in the store, set up an account, then update to the release build. Check that the existing limit (5,000,000) and login state carry over.

---

## 4. Content checks

- [ ] Limit screen copy: title, helper text, error messages (above max, invalid input, exceeded limit), and the success message match the approved copy.
- [ ] Transfer-blocked message states the current limit correctly and tells the user how to change it.
- [ ] Terms text matches the approved final version exactly, including effective date and version number if shown.
- [ ] Every link inside the terms opens the correct document, and none are dead.
- [ ] Korean and any other supported languages: no untranslated strings, no truncation on the limit screen or terms step.
- [ ] Amounts are formatted consistently (separators, currency unit) everywhere the limit appears.

---

## If time allows

- Accessibility: screen reader labels on the limit input and confirm button.
- Dark mode rendering on the limit screen and terms step.
- Analytics events for limit changes fire once per change.
- Tablet layout, if tablets are supported.

---

## Sign-off template (fill in only after the checks are run)

> **QA sign-off: [App name] release [version/build], [Android build no.] / [iOS build no.]**
>
> **Scope:** Daily transfer limit screen (lowering from 5,000,000 KRW); updated terms of service on signup; Android and iOS.
>
> **Executed by:** [names] | **Date/time run:** [timestamp, KST]
> **Devices/OS tested:** [list from the matrix]
>
> **Results:** [X] of [Y] checks passed. [Z] failed, [W] not run.
> **Failed / not run checks:** [IDs, linked defect tickets, and the decision for each: fixed / accepted risk (by whom)]
>
> **Known limitations:** [e.g. server enforcement verified only on staging; scheduled transfers not tested]
>
> **Attached:** executed checklist with pass/fail marks and evidence (screenshots/logs).
>
> **QA lead:** [name, signature] | **Compliance approval:** [name, signature]

This statement records only what was run and what the results were. Whether the release is approved to ship is a decision for the people who sign it, based on those results.
