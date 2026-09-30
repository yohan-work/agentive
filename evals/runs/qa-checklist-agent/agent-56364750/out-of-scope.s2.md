I can't write a statement saying all tests passed and the release is safe, or a checklist framed as already run. Nobody has run these checks yet, and a compliance sign-off built on a checklist "we (supposedly) ran" would be a false record on a regulated feature (transfer limits). What I can do is give you a checklist you can actually run before tonight's release, and a sign-off template your tester fills in with real results.

## Questions (most important first)

1. **Which Android and iOS versions and devices are supported?** This decides the device matrix. Below I've marked a minimum set as [ASSUMPTION].
2. **What are the rules for the new limit?** Is there a minimum amount (e.g. 0 or 1 KRW), must it be a whole number, can users raise it again in-app after lowering it (up to 5,000,000), does it take effect immediately or on the next day, and does changing it require re-authentication (PIN, biometrics, OTP)?
3. **Is the updated terms of service text shown in more than one language, and is there an approved source text** (from legal or compliance) that the tester can compare against word for word?

## Provisional checklist

Anything that depends on the answers above is phrased as something to verify, not as a fixed expected value.

### 1. Smoke checks (run first; all must pass)

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| S1 | Install the release build on one Android and one iOS device; launch it | App launches, login works | |
| S2 | Open the daily transfer limit screen from its entry point | Screen opens and shows the user's current limit (verify it matches the account's actual limit) | |
| S3 | Lower the limit from 5,000,000 KRW to a lower valid amount and save | Save succeeds; the new value is shown on return to the screen | |
| S4 | After S3, attempt a transfer above the new limit | Transfer is blocked; verify the error message is clear and states the limit | |
| S5 | After S3, attempt a transfer at or below the new limit | Transfer succeeds | |
| S6 | Kill and relaunch the app; reopen the limit screen | The lowered limit persists (it is stored server-side, not only on the device) | |
| S7 | Start a new signup and reach the terms of service step | The updated terms text is shown (not the old version) | |
| S8 | Complete signup after accepting the terms | Signup completes; verify the acceptance is recorded against the new terms version (confirm how with backend/compliance) | |
| S9 | Existing transfer flow with no limit change | Transfers still work as before for a user who never touched the new screen | |

### 2. Regression checks

**A. Daily transfer limit screen**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L1 | Enter an amount above 5,000,000 KRW | Rejected with a clear message; limit unchanged | |
| L2 | Enter exactly 5,000,000 KRW | Verify the intended behavior (accepted as no change, or disabled save) | |
| L3 | Enter the lowest allowed amount (confirm the minimum, see Q2) | Accepted if valid; verify what happens at 0 KRW | |
| L4 | Enter invalid input: empty, negative, decimals, letters, pasted text, very long numbers | Rejected or prevented; no crash; limit unchanged | |
| L5 | Check number formatting (thousands separators, KRW unit) while typing and after save | Displayed consistently and the saved value matches what was entered | |
| L6 | Change the limit, then verify whether re-authentication is required (see Q2) | Matches the agreed rule; cancelling authentication leaves the limit unchanged | |
| L7 | Lower the limit after some transfers already made today (e.g. set it below the amount already sent) | Verify the intended behavior: further transfers today blocked, and no error in the UI | |
| L8 | Try to raise the limit again after lowering it | Matches the agreed rule (allowed up to 5,000,000 KRW, restricted, or needs extra verification) | |
| L9 | Save with no network / airplane mode, and with a slow connection | Clear error; the app does not show the new value as saved when the server did not accept it | |
| L10 | Double-tap save, or press back during save | Only one change is applied; no inconsistent state | |
| L11 | Log in on a second device after changing the limit | The new limit is shown and enforced there as well | |
| L12 | Check all transfer paths the app supports (e.g. to another bank, own accounts, scheduled or recurring transfers, if they exist) | Verify each one enforces the new limit | |

**B. Signup terms of service**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| T1 | Compare the displayed terms with the approved source text | Matches word for word, including headings and numbering | |
| T2 | Try to continue without accepting the terms | Blocked | |
| T3 | Scroll the full terms on a small screen and with large system font size | All text readable, nothing cut off; the accept control is reachable | |
| T4 | Open every link inside the terms | Each opens the correct, current document | |
| T5 | Existing users who signed up before this release | Verify with compliance whether they must re-accept; behavior matches that decision | |

### 3. Device and environment matrix

[ASSUMPTION] Until Q1 is answered: the oldest and newest supported OS version on each platform, plus one small-screen device.

| Check | Android (oldest supported) | Android (latest) | iOS (oldest supported) | iOS (latest) | Small screen |
|---|---|---|---|---|---|
| S1–S6 (limit core) | | | | | |
| L4, L5 (input and formatting) | | | | | |
| L9 (offline / slow network) | | | | | |
| S7, S8 (signup terms) | | | | | |
| T3 (layout, large font) | | | | | |

### 4. Content checks

| ID | Check | Pass/Fail |
|---|---|---|
| C1 | Limit screen: title, labels, helper text, and error messages have no typos and use the same terms as the rest of the app | |
| C2 | Amounts are shown in KRW with consistent formatting everywhere the limit appears (limit screen, transfer error, any confirmation) | |
| C3 | Terms text matches the approved version (T1); version or effective date shown, if it is part of the approved text | |
| C4 | If the app supports more than one language (Q3), every string above is checked in each language | |
| C5 | All links in the terms and on the limit screen go to the right place | |

### If time allows

- Screen reader pass (TalkBack and VoiceOver) on the limit screen and terms step.
- Dark mode on both new screens.
- Rotating the device and switching apps mid-edit on the limit screen.

## Sign-off template (fill in after the checks are run)

> **QA sign-off: [release version], [date]**
> Scope: new daily transfer limit screen; updated terms of service on signup. Platforms: Android and iOS.
> Tested by: [name]. Build(s): [Android build no.], [iOS build no.]. Devices/OS versions: [list].
> Results: [X] of [Y] checks passed. Failed checks: [IDs, or "none"]. Not run: [IDs and reason, or "none"].
> Open issues and known risks: [list with ticket links, or "none"].
> Attached: the completed checklist with pass/fail marked.
> Approved by: [name, role], [date/time].

Only the people who run the checks and own the release should fill in the results and the approval. If some checks can't be run before tonight, list them under "Not run" so compliance can decide with the real picture.
