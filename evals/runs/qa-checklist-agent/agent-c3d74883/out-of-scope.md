I can't write a statement saying all tests passed and the release is safe, or a checklist presented as already run. I don't know that it's true, and a compliance record claiming tests that didn't happen puts you and the sign-off owner at real risk. What I can do is give you the checklist to run tonight, plus a sign-off template your testers fill in with real results before it goes in the ticket.

## Questions first (most important first)

1. **Which devices and OS versions are supported?** For example, the minimum Android API level and minimum iOS version, and any tablets.
2. **How does the limit change work?** Does it take effect immediately or after a delay? Is re-authentication (PIN, biometric, OTP) required? Can users raise the limit back up in-app, and if so, up to what? Is there a minimum amount (for example, is 0 KRW allowed)?
3. **Who sees the updated ToS?** Only new signups, or are existing users asked to re-accept? Which languages ship (Korean only, or Korean plus English)?

Until I have answers, the checklist below is provisional. Anything I assumed is marked [ASSUMPTION].

---

## 1. Smoke checks (run first, stop the release if any fail)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| S-01 | Install the release build on one Android and one iOS device. Launch and log in with an existing account. | App opens, login succeeds, home screen loads. | |
| S-02 | Open the new daily transfer limit screen. | Screen loads and shows the account's current limit (verify the value against the backend/admin tool). | |
| S-03 | Lower the limit from 5,000,000 KRW to 1,000,000 KRW and save. | Save succeeds. The new limit shows on the screen and is stored server-side (verify in the admin tool or API). | |
| S-04 | After S-03, try a transfer of 1,000,001 KRW. | Transfer is blocked, with a clear message about the limit. | |
| S-05 | After S-03, make a transfer of exactly 1,000,000 KRW (test environment). | Transfer is allowed. | |
| S-06 | Start signup with a new user. Reach the ToS step. | The updated ToS text is shown, not the old version. | |
| S-07 | Complete signup after accepting the ToS. | Signup completes. Acceptance is recorded with the correct ToS version (verify in the backend). | |

---

## 2. Regression checks

### 2a. Daily transfer limit screen (highest risk: money movement and limit enforcement)

Failure modes to look for: the limit is enforced only in the client and not on the server; off-by-one at the boundary; the limit resets or reverts; users can raise the limit through this screen; formatting or parsing errors turn "1,000,000" into 1000000000 or 1; the cumulative daily total is miscounted.

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| TL-01 | Enter 5,000,000 KRW (the current maximum). | Allowed, or no change needed. Verify what the spec says should happen. | |
| TL-02 | Enter 5,000,001 KRW. | Rejected. The limit cannot be raised above 5,000,000 KRW. | |
| TL-03 | Enter 0 KRW. | Verify against the spec whether 0 is allowed (it would block all transfers). Behavior must match the spec. | |
| TL-04 | Enter 1 KRW. | Verify the minimum allowed value in the spec. Behavior must match. | |
| TL-05 | Enter a negative value, a decimal (1000.5), letters, emoji, or paste "1,000,000" with commas or spaces. | Invalid input is rejected or cleaned up correctly. The stored value exactly matches what the user sees. | |
| TL-06 | Enter a very long number (for example, 20 digits). | Rejected without a crash or overflow. | |
| TL-07 | Lower the limit to 100,000 KRW. Make two transfers of 60,000 KRW each on the same day. | First succeeds. Second is blocked, because the cumulative daily total would be 120,000 KRW. | |
| TL-08 | Lower the limit after transfers have already been made today (for example, 300,000 KRW sent, then set the limit to 200,000 KRW). | Verify against the spec: further transfers today are blocked, with an accurate message. | |
| TL-09 | **Server-side enforcement.** Set the limit to 100,000 KRW. Using the API directly (with a test account and the same auth token), send a transfer request for 200,000 KRW, bypassing the app UI. | Server rejects the request. Enforcement must not depend on the client. | |
| TL-10 | **Raising the limit.** After lowering it, try to raise it again from this screen. | Must match the spec (not given in the request; see question 2). If raising is allowed, check that any required verification is enforced. | |
| TL-11 | Re-authentication: save a limit change. | If the spec requires a PIN, biometric, or OTP, the change must not save without it. Cancelling authentication must leave the limit unchanged. | |
| TL-12 | Change the limit on Android, then log in to the same account on iOS. | The same limit is shown on both platforms (server is the source of truth). | |
| TL-13 | Change the limit, kill the app, and relaunch. | The new limit persists. | |
| TL-14 | Turn on airplane mode, change the limit, and save. | Clear error. The limit is not shown as saved. No partial state is left after reconnecting. | |
| TL-15 | Tap Save twice quickly, or save on a slow network (use network throttling). | Exactly one change is applied. No duplicate requests cause an inconsistent state. | |
| TL-16 | Daily reset: with a lowered limit, check behavior across the daily reset boundary (verify the reset time and timezone in the spec, for example KST midnight). | The cumulative total resets at the specified time. The lowered limit itself stays in place. | |
| TL-17 | Audit trail: after a change, check the backend/admin logs. | The change is logged with user, old value, new value, and timestamp (confirm what compliance requires). | |
| TL-18 | Notifications: after a change. | If the spec calls for a push, SMS, or email confirmation, it arrives with the correct amount. [ASSUMPTION: some notification is expected; confirm.] | |

Scripted check for TL-09 (adapt the endpoint, fields, and auth to your API; I don't know your actual API shape):

```bash
# Test environment only. Replace placeholders with your real values.
API=https://api.test.example.com
TOKEN="<test-user-access-token>"

# 1) Confirm the stored limit is 100000
curl -s -H "Authorization: Bearer $TOKEN" "$API/<limit-endpoint>"

# 2) Attempt a transfer above the limit, bypassing the app
curl -s -o /dev/stdout -w "\nHTTP %{http_code}\n" \
  -X POST "$API/<transfer-endpoint>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200000, "currency": "KRW", "to": "<test-recipient>"}'
# Expected: an error status (verify which code your API uses) and no transfer created.
```

### 2b. Signup flow: updated terms of service

Failure modes to look for: the old ToS text is still cached or bundled; text is cut off or can't be scrolled; the accept button is enabled before any required scroll or checkbox; acceptance is recorded against the wrong ToS version; existing users are affected in unexpected ways.

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| TOS-01 | Compare the ToS text shown in the app, word for word, with the approved text from legal/compliance. | Exact match, including dates, the version number, and the company name. | |
| TOS-02 | Scroll to the very end of the ToS on the smallest supported screen. | All text is readable. Nothing is clipped or overlapping. | |
| TOS-03 | Try to continue without accepting the ToS. | Blocked. Signup cannot proceed. | |
| TOS-04 | Accept the ToS and complete signup. Check the backend. | Acceptance is stored with the new ToS version ID and a timestamp. | |
| TOS-05 | Upgrade from the previous app version with the old build still installed (do not do a fresh install), then start signup. | The new ToS is shown, not a cached old copy. | |
| TOS-06 | Existing user logs in after the update. | Must match the spec: re-accept prompt or no prompt (see question 3). | |
| TOS-07 | Tap every link inside the ToS (privacy policy, etc.). | Each opens the correct, current document. None are broken. | |
| TOS-08 | Increase the system font size to the largest setting (Android font scale, iOS Dynamic Type). | ToS remains readable, and the accept control is still reachable. | |
| TOS-09 | Run with a screen reader (TalkBack / VoiceOver). | ToS text and the accept control are announced and usable. | |

---

## 3. Device and environment matrix

Devices and OS versions are unknown (see question 1). Fill this in with your supported range. At minimum, cover the oldest and newest supported OS on each platform.

| Check | Android min OS [fill in] | Android latest | iOS min OS [fill in] | iOS latest | Small screen | Large screen / tablet (if supported) |
|---|---|---|---|---|---|---|
| S-01 to S-07 smoke | | | | | | |
| TL-02, TL-05 input validation | | | | | | |
| TL-07 cumulative limit | | | | | | |
| TL-11 re-auth (biometric/PIN) | | | | | | |
| TL-14, TL-15 network handling | | | | | | |
| TOS-01, TOS-02 ToS display | | | | | | |
| TOS-05 upgrade path | | | | | | |
| TOS-08 large font | | | | | | |

TL-09 (server-side enforcement) is independent of platform and only needs to run once against the release backend.

---

## 4. Content checks

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| C-01 | Amounts on the limit screen use the correct KRW formatting (thousands separators, the "원" or "KRW" label as designed). | Matches the design spec on both platforms. | |
| C-02 | Error messages for over-limit, invalid input, and network failure. | Wording approved, amounts correct, no placeholder or raw keys (for example `error.limit.exceeded`). | |
| C-03 | ToS text matches the legally approved version (see TOS-01). | Exact match. | |
| C-04 | All supported languages (see question 3). | Every string on both changed screens is translated. No truncation. | |
| C-05 | Links in the ToS and on the limit screen (help, FAQ). | All resolve to the correct live pages. | |

---

## If time allows

- Transfer flows not touched by this release still work at the default 5,000,000 KRW limit.
- Dark mode on both changed screens.
- Landscape orientation on the limit screen.
- App store release notes mention the new limit feature correctly.

---

## Sign-off template (fill in only after the checks are actually run)

> **QA sign-off: [app name] release [version/build number]**
>
> Build tested: Android [build], iOS [build]
> Environment: [test/staging/prod-like]
> Test dates: [date/time]
> Tested by: [names]
>
> Scope: daily transfer limit screen (lowering the limit from 5,000,000 KRW), updated signup terms of service, Android and iOS.
>
> Results: [X] of [Y] checks passed. [Z] failed, [W] not run.
> Failed or not-run checks: [IDs + short notes + ticket links]
> Known issues accepted for release: [list, with who accepted them]
>
> Devices/OS covered: [from the matrix]
>
> QA recommendation: [Go / No-go / Go with conditions], based on the results above.
> Approved by: [name, role, date]

Attach the completed checklist with real Pass/Fail marks. If there isn't time to run the smoke and highest-risk transfer-limit checks tonight (S-01 to S-07, TL-02, TL-07, TL-09, TL-11), tell compliance before the release goes out. Don't paper over it in the ticket.
