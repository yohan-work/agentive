I can't write a checklist that covers "everything" without knowing what changed. What follows is a provisional checklist built from the little the request tells me. Please answer these first, most important first:

1. **What changed in this version?** Release notes, a ticket list, or the diff summary. Regression checks should go where the changes are. Without that list, the checklist below is generic.
2. **What platform is it?** iOS, Android, web, desktop, or a mix? Does it ship through an app store (with review and phased rollout) or as a direct deploy? Does the backend change too?
3. **Which devices, OS versions, and browsers do you support?** Also: is there a minimum version you force users to update from?

If you send those, I'll replace the generic rows with checks for your actual features and environments.

---

## Provisional checklist

Scope of what the request supports: a new version of "the app" ships tomorrow morning, and it's an upgrade from an existing version. Everything else is marked [ASSUMPTION] or "verify".

### 1. Smoke checks (run first; stop and escalate on any fail)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| S-01 | Install the release build (the exact artifact that will ship, not a debug or staging build) on a clean device/environment. | App installs and launches to its first screen without crashing. | |
| S-02 | Check the version number and build number shown in the app (About/Settings screen) or in the store/deploy metadata. | They match the version planned for tomorrow's release. Verify the expected values with the release owner. | |
| S-03 | **Upgrade path:** install the *current production* version, sign in, create or keep some user data, then upgrade to the new build without uninstalling. | App launches after upgrade. User stays signed in (or is asked to sign in again, if that is intended; verify which). Existing data is still present and correct. | |
| S-04 | Sign in with an existing account. Sign out. Sign in again. [ASSUMPTION: the app has accounts] | Each step succeeds. No error message. The right account's data shows. | |
| S-05 | Walk through the app's single most important user flow end to end (e.g. the flow that makes money or that most users do daily). Name it: __________ | Flow completes. Result is saved and visible afterward (after reload/restart too). | |
| S-06 | Confirm the release build points at the production backend/API, not staging. Verify how in your setup: config file, environment variable, or a network inspector/proxy on a test device. | All requests go to production endpoints. No staging/test URLs anywhere. | |
| S-07 | Kill the app and relaunch it. | App restarts to a sensible state; no crash; no data lost from S-05. | |
| S-08 | Turn off network (airplane mode or disconnect), use the app, then reconnect. | App shows an understandable offline/error state instead of crashing or hanging. After reconnecting it recovers without a restart. Verify the intended offline behavior with the team. | |

### 2. Regression checks by surface

I can't group these by your real surfaces until I know what changed (question 1). These are the surfaces almost every app has. Delete the rows that don't apply.

**2a. Changed features (highest risk; fill from release notes)**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-CH-01..n | One row per item in the release notes/ticket list: reproduce the change as the ticket describes it. | Behavior matches the acceptance criteria in the ticket. | |
| R-CH-bug | For each bug fixed in this release: run the original repro steps from the bug report. | The bug no longer reproduces. | |
| R-CH-adj | For each changed feature: use the screens directly before and after it in the flow. | Neighboring screens still work. Navigation in and out doesn't break. | |

**2b. Account and session** [ASSUMPTION: the app has accounts]

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-AU-01 | Sign in with wrong password. | Clear error message; no crash; account not signed in. | |
| R-AU-02 | Password reset / forgot password flow, through to receiving and using the email or code. | Reset email/code arrives, works once, and signs the user in (or back to sign-in) as designed. | |
| R-AU-03 | Sign up a new account (if sign-up exists). | Account created; user lands on the intended first screen. | |
| R-AU-04 | Leave the app idle/backgrounded long enough for a session to expire (verify the timeout with the team), then return. | User is either still signed in or asked to sign in again cleanly. No blank screens or silent failures. | |

**2c. Data and persistence**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-DA-01 | Create, edit, and delete one item of the app's main data type. | Each change is saved and shows after reload/restart. | |
| R-DA-02 | Same account on two devices/browsers: change data on one. | Change appears on the other (after refresh, or live, whichever is intended; verify). | |
| R-DA-03 | If the release changes a database schema or stored-data format: upgrade an account/device that has old data (see S-03) and open every screen that shows it. | Old data displays correctly. Nothing missing, duplicated, or garbled. | |

**2d. Payments / purchases** [ASSUMPTION: only if the app takes payments]

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-PA-01 | Complete a purchase with a test payment method in the environment you're allowed to test payments in (verify which one; don't run real charges unless that's your process). | Purchase succeeds; user gets what they paid for; receipt/confirmation shown. | |
| R-PA-02 | Cancel partway through checkout. | No charge; user returned to a sensible screen. | |
| R-PA-03 | Restore purchases / check an existing subscriber account after upgrade. | Existing entitlement is still recognized. | |

**2e. Notifications and deep links** [ASSUMPTION: only if used]

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-NO-01 | Trigger a push notification (or email) that the app sends. Tap it. | Notification arrives and opens the correct screen. | |
| R-NO-02 | Open each deep link / shared link the app supports, with the app closed and with it open. | Correct screen opens in both cases. | |

**2f. Release mechanics**

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R-RL-01 | Confirm feature flags/remote config for tomorrow: which features are on or off at launch. | Flag states match the release plan. Features meant to be off are not reachable. | |
| R-RL-02 | Confirm the rollback plan: how to revert or halt the rollout, and who does it. | A named person and a written procedure exist. (For store apps, verify whether you can pause a phased rollout; a shipped binary can't be recalled.) | |
| R-RL-03 | Confirm crash reporting and analytics are receiving events from the release build. | Test events from S-05 show up in your dashboard. | |
| R-RL-04 | If this is a store release: confirm the build is approved and set to release at the planned time (manual or scheduled). | Status in the store console matches the plan for tomorrow morning. | |

### 3. Device and environment matrix

I don't know your platforms or supported devices, so fill in the columns from your support list (question 3). A reasonable minimum: the newest and oldest supported OS version on each platform, plus the device/browser most of your users are on (check your analytics).

| Environment | S-01 install/launch | S-03 upgrade | S-04 sign-in | S-05 core flow | S-08 offline |
|---|---|---|---|---|---|
| [fill: platform / newest supported OS] | | | | | |
| [fill: platform / oldest supported OS] | | | | | |
| [fill: most-used device or browser] | | | | | |
| [fill: small screen / tablet, if supported] | | | | | |

### 4. Content checks

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| C-01 | Read every new or changed screen in the release. | No placeholder text (e.g. "lorem ipsum", "TODO", raw keys like `home.title`), no typos, text not cut off. | |
| C-02 | If the app is localized: switch to each supported language and open the changed screens. | All new strings are translated; nothing falls back to another language unexpectedly; longer translations don't overflow. | |
| C-03 | Tap every link on changed screens (help, terms, privacy, support). | Each opens the correct, live page. No 404s, no staging URLs. | |
| C-04 | Check user-facing data on changed screens: dates, times, currency, numbers. | Formats match the user's locale/time zone as designed; values match the source data. | |
| C-05 | If a store release: check the "What's new" text and screenshots. | Matches what actually ships in this version. | |

### If time allows

- Accessibility: screen reader reads the changed screens; text scales with system font size.
- Dark mode / theme: changed screens are readable.
- Performance: cold start and the core flow feel no slower than the current version.
- Poor network: core flow on a throttled connection.
- Permissions: deny camera/location/notifications etc. and confirm the app handles it.
- Rotation / window resizing on changed screens.

---

This checklist doesn't cover "everything," and it can't until I know what changed. With one day left, put your hours into smoke checks, the changed features (2a), and the upgrade path (S-03). Send me the release notes and platforms and I'll rewrite section 2 and the matrix around them. The release decision and sign-off belong to your team once these have been run.
