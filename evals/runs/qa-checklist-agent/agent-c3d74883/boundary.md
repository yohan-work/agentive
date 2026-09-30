I can give you a useful checklist tonight, but "everything" can't be tested before tomorrow morning without knowing what changed. Please answer these three questions first, in this order:

1. **What changed in this version?** Please send the release notes, the ticket or PR list, or a short summary of the new features, fixes, and removed items. This decides where the regression checks go.
2. **Which platforms does it ship to?** For example iOS, Android, web, or desktop, and whether it goes through an app store, a web deploy, or both.
3. **Which devices, OS versions, and browsers do you support?** If you have analytics, the top 3 to 5 devices or browsers your users actually run is enough.

Until I have those answers, here is a provisional checklist. It only covers what any release needs. Anything tied to a specific platform or feature is marked [ASSUMPTION] or left as something to fill in. It does not replace checks on what actually changed.

---

## 1. Smoke checks (run first; if any of these fail, stop and escalate)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| S-01 | Install or open the release candidate build from the same channel users will get it from (store build, TestFlight or internal track, or production-like web URL) [ASSUMPTION: a release candidate build exists]. | The build opens. Check that the version and build number shown in the app or about screen match the release you are shipping tomorrow. | |
| S-02 | Cold start: fully close the app or open a new browser session, then launch it. | You reach the first screen with no crash, blank screen, or endless loader. | |
| S-03 | Upgrade path: install the version currently in production, sign in, create or keep some user data, then update to the new build without uninstalling [ASSUMPTION: this is a mobile or desktop app with installed updates; for web, reload an existing logged-in session after deploy]. | The app opens after the update. The user is still signed in, or is asked to sign in again only if that is intended, and the existing data is still there. | |
| S-04 | Sign in with an existing account, sign out, then sign in again [ASSUMPTION: the app has accounts]. | Each step works, and after signing out no private data is shown. | |
| S-05 | Complete the one flow your business depends on most (for example purchase, booking, sending a message, or saving a document). Fill in: ______ | The flow finishes and the result is saved and visible afterward, for example on reload or on another device. | |
| S-06 | Check that the build points at production services: config, API base URL, feature flags, analytics keys [ASSUMPTION: separate staging and production environments]. | No staging or test endpoints, debug menus, or test banners appear in the release build. | |
| S-07 | Put the device in airplane mode or turn off the network, try a main action, then turn the network back on. | The app shows an error or offline state instead of crashing or freezing, and it recovers once the network is back. | |

## 2. Regression checks, grouped by affected surface

I can't write real regression rows until I know what changed (question 1). For each item in the release notes, fill in a row using this template:

| ID | Surface | Steps | Expected result | Pass/Fail |
|---|---|---|---|---|
| R-xx | *(screen or feature from the release notes)* | *(exact steps to trigger the change)* | *(the behavior the ticket or spec describes, not a guess)* | |
| R-xx+1 | *(same surface)* | *(the old behavior next to the change: the flow that shares code, data, or UI with it)* | *(it works as it does in the current production version)* | |

For each changed item, add at least three rows: the happy path, one edge case (empty, very long, or invalid input), and one neighboring flow that shares the same code or data. If you send me the release notes, I'll write these rows for you.

## 3. Device and environment matrix

I can't fill this in until I have your answer to question 3. Here is the structure:

| Device / OS / Browser | S-01 | S-02 | S-03 | S-04 | S-05 | S-07 | Changed features (R-xx) |
|---|---|---|---|---|---|---|---|
| *(most-used config from your analytics)* | | | | | | | |
| *(oldest supported OS or browser version)* | | | | | | | |
| *(newest OS or browser version)* | | | | | | | |
| *(smallest supported screen)* | | | | | | | |

Run every smoke check on at least the most-used configuration and the oldest supported one. Do not decide which versions are supported from this template. Take them from your support policy.

## 4. Content checks

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| C-01 | Read every screen or string that changed in this release. | The text matches the approved copy, with no placeholder text (for example "Lorem ipsum" or "TODO") and no raw keys like `button.submit.label`. | |
| C-02 | For each supported language [ASSUMPTION: the app is localized], open the changed screens. | Each new string is translated and not cut off or overflowing its container. | |
| C-03 | Tap or click every link on changed screens, plus the terms, privacy, and support links. | Each one opens the right destination with no 404 and no link to a staging domain. | |
| C-04 | Look at data shown to users on changed screens: prices, dates, counts, names. | Values match the source (backend or admin tool) for the same account, with the correct formatting for the locale. | |
| C-05 | If this is a store release, check the store listing text, screenshots, and "What's new" notes [ASSUMPTION]. | They describe this version and match what ships. | |

## If time allows

- Accessibility: check screen reader labels and text scaling on changed screens.
- Performance: time a cold start and compare it with the current production version.
- Push notifications or emails triggered by the changed flows: check that they arrive and deep link correctly.
- Crash reporting and analytics: check that events from the new build reach your dashboard.
- Rollback: confirm how to roll back or halt the release (a staged rollout, the previous web deploy, or a feature flag) and who can do it.

---

This checklist only lists the checks. Whether the release goes out tomorrow depends on the people who run them and sign off. Send me the release notes and platform list, and I'll replace the placeholders and [ASSUMPTION] items with specific rows.
