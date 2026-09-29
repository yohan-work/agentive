I can't write a statement saying all tests passed or that the release is safe to ship. I haven't run anything, and a checklist marked as run when it wasn't would give compliance a false record. That's a serious problem in a fintech audit trail. What I can give you is the checklist itself and a sign-off template. Your tester fills in the results, and a named person signs it once the checks have actually been run.

If tonight's timeline is too tight to run these, tell compliance before the ticket closes, not after.

## Questions (most important first)

1. **Which Android and iOS versions and devices are supported?** I need these to build the matrix. Until I have them, it uses [ASSUMPTION] placeholders.
2. **What are the rules for the new limit?** Is there a minimum (can it be 0?), what input format is allowed (whole KRW only?), does lowering it need re-authentication (PIN/biometric/OTP), and when does it take effect (immediately, or next day)? Can users raise it again from this screen? The request only says users can lower it from 5,000,000 KRW to "any amount".
3. **What is the approved terms of service text, and which languages ship?** Does the new text require existing users to re-accept, or only new signups?

## QA sign-off template (fill in after testing; do not pre-fill)

> **Release:** [app name] [version/build] – Android [build no.] / iOS [build no.]
> **Scope:** Daily transfer limit screen (new); Terms of service text in signup flow (updated)
> **Tested by:** [name] **Date/time:** [ ]
> **Devices/OS tested:** [list from matrix]
> **Results:** [X] passed / [Y] failed / [Z] not run (see attached checklist)
> **Open defects:** [IDs and severity, or "none"]
> **Checks not run and why:** [ ]
> **QA recommendation:** [Ship / Ship with known issues / Do not ship]
> **Sign-off:** [name, role] **Compliance review:** [name, role]

---

## Provisional checklist

### 1. Smoke checks (run first, must pass)

| ID | Check | Pass/Fail |
|---|---|---|
| S1 | App installs/updates from the release build and launches on Android and iOS | |
| S2 | An existing user can log in after updating | |
| S3 | The daily transfer limit screen can be opened from its entry point | |
| S4 | The screen shows the user's current limit (verify it shows 5,000,000 KRW for a user who has never changed it) | |
| S5 | Lowering the limit to a valid lower amount saves and shows confirmation | |
| S6 | After lowering, a transfer above the new limit is blocked | |
| S7 | After lowering, a transfer at or below the new limit goes through | |
| S8 | A new user can complete signup, and the updated ToS text is shown | |
| S9 | The ToS text matches the approved version exactly | |
| S10 | No crash when the limit screen or signup is backgrounded and resumed | |

### 2. Regression checks

**A. Daily transfer limit screen (highest risk: money movement)**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L1 | Open limit screen as a user who has never changed their limit | Shows 5,000,000 KRW as current limit | |
| L2 | Enter an amount lower than current (e.g. 1,000,000), confirm | Saved; confirmation shown; screen shows new value | |
| L3 | Kill and relaunch the app, reopen screen | New limit persists | |
| L4 | Log in with the same account on the other platform (Android vs iOS) | Same new limit shown (verify that the limit is stored server-side, not just on the device) | |
| L5 | Make transfers totalling more than the new limit in one day | Transfer that exceeds the limit is blocked with a clear message; verify the exact message wording against spec | |
| L6 | Make a transfer exactly equal to remaining daily limit | Verify intended behavior (allowed/blocked) against spec and record the result | |
| L7 | Enter an amount above 5,000,000 KRW | Verify it is rejected. The request only covers lowering | |
| L8 | Enter 0, negative, decimal, non-numeric, empty, very long input | Verify each against the minimum/format rules (Q2); record actual behavior | |
| L9 | Lower limit when user has already transferred more today than the new amount | Verify intended behavior (e.g. further transfers blocked today) against spec | |
| L10 | Try to raise the limit back up after lowering | Verify against spec whether this is allowed and what verification it requires | |
| L11 | Change limit with authentication step (if any, Q2): cancel, fail, succeed | Limit only changes on successful authentication | |
| L12 | Submit change with network off / slow network | No false "saved" message; clear error; limit unchanged on server | |
| L13 | Tap confirm twice quickly | Only one change applied; no duplicate or inconsistent state | |
| L14 | Session expires while on the limit screen, then submit | User is asked to re-authenticate; limit unchanged until then | |

**B. Signup flow – terms of service**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| T1 | Start signup, reach ToS step | Updated ToS text displayed in full | |
| T2 | Compare displayed text word-for-word with approved copy | Exact match, including version/effective date if shown | |
| T3 | Try to continue without accepting | Signup does not proceed | |
| T4 | Accept and complete signup | Account created; verify acceptance is recorded with the new ToS version (backend/log check) | |
| T5 | Scroll through the full text on the smallest supported screen | All text readable; nothing cut off; accept control reachable | |
| T6 | Existing user logs in after update | Verify against Q3 whether a re-acceptance prompt should appear | |

**C. Adjacent areas (quick regression)**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R1 | Normal transfer below limit for a user who did not change limit | Works as before | |
| R2 | Login/logout | Works as before | |

### 3. Device and environment matrix

[ASSUMPTION] Pending Q1. Replace with your supported range.

| Check | Android oldest supported | Android latest | iOS oldest supported | iOS latest |
|---|---|---|---|---|
| S1–S10 smoke | | | | |
| L2–L5 limit change and enforcement | | | | |
| L12 network failure | | | | |
| T1–T5 ToS signup | | | | |
| Smallest supported screen size (T5) | | | | |

Also record the app build number and the backend environment tested against (staging/production).

### 4. Content checks

| ID | Check | Pass/Fail |
|---|---|---|
| C1 | ToS text matches approved copy in every shipped language (Q3) | |
| C2 | Any links in the ToS open the correct page on both platforms | |
| C3 | Amounts on the limit screen display in KRW with the correct thousands separators, consistent with the rest of the app | |
| C4 | Limit screen copy, error messages, and confirmation messages match the spec; Korean and English (if shipped) both present | |
| C5 | Transfer-blocked message clearly states the daily limit was reached | |

### If time allows

- Accessibility: screen reader reads the limit value and input labels; text scaling doesn't break the limit or ToS screens.
- Dark mode rendering of both screens.
- Limit reset behavior at the daily rollover (verify the reset time from spec).

---

Once the tester has run these and filled in the Pass/Fail columns, the sign-off template can be completed with the real results. Any failures or checks that weren't run should be listed there so compliance can make the call.
