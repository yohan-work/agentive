With a release tomorrow morning, trying to test everything won't work. There isn't time. What you can do tonight is cover everything at the right depth: run deep checks where a failure would hurt most and quick smoke checks everywhere else. The checklist below does that. I've filled the gaps with assumptions, so correct any that are wrong and I'll tighten it.

## Assumptions (please correct)
- Consumer-facing app with user accounts. Could be web, mobile, or both.
- There's a staging environment that matches production, and a release candidate build already exists.
- You have a small team and roughly one working session (4–8 hours) before release.
- "Tomorrow morning" means a go/no-go decision tonight or first thing tomorrow.

## Quick questions (answering any of these makes the list sharper)
1. Web, iOS/Android, or both? For mobile, does it go through app store review, or is it an OTA or phased rollout?
2. What changed in this version? The top 3–5 features or fixes.
3. Does it include database migrations, payment or billing changes, or auth changes?
4. Can you roll back quickly, and do you have feature flags?

---

## 1. Release readiness (do first, ~30 min)
- [ ] Freeze the code: the exact build or commit being shipped is tagged and is the one under test.
- [ ] Release notes and changelog list every change in this version. Use it as your test scope.
- [ ] No open P0/P1 bugs, or each open one has an explicit, documented accept decision.
- [ ] CI is green on the release build: unit, integration, and lint.
- [ ] Config, environment variables, and secrets for production are set and reviewed. Staging values must not leak into production.
- [ ] Feature flags are in their intended launch state, and you know how to flip each one.

## 2. New and changed features (deepest testing, ~40% of your time)
For each item in the release notes:
- [ ] Happy path works end to end.
- [ ] Key edge cases: empty states, max lengths, invalid input, slow or no network.
- [ ] Error messages are clear, and nothing crashes or shows raw errors.
- [ ] Behaviour matches the spec or ticket acceptance criteria.
- [ ] The feature works for new users and for existing users with old data.

## 3. Critical-path regression (smoke test, ~25%)
These are the flows that would make the release a failure if they broke, even if nobody touched them:
- [ ] Sign up, log in, log out, and password reset.
- [ ] Core action of the app: the one thing users come for.
- [ ] Payments or checkout, if any: complete a real or sandbox transaction, including a refund or cancel.
- [ ] Notifications (email and push) arrive and their links work.
- [ ] Settings and profile save and persist.
- [ ] Search, navigation, and deep links open the right screens.

## 4. Data and backend
- [ ] Database migrations run cleanly on a copy of production-like data, and the rollback or down migration is tested or its risk accepted.
- [ ] Existing user data displays correctly after the upgrade: no missing or corrupted records.
- [ ] Clients one version behind still work with the new API. This is critical for mobile users who don't update.
- [ ] Background jobs and cron tasks run as expected.
- [ ] Third-party integrations (payments, analytics, auth providers) work in the production config.

## 5. Platform and compatibility (sample, don't exhaust)
- [ ] Web: latest Chrome, Safari, and Firefox, plus one mobile browser. Check responsive layout at phone and desktop widths.
- [ ] Mobile: one recent and one older supported OS version on each of iOS and Android, plus one small-screen device.
- [ ] Upgrade path: install the previous version, then upgrade to the new one. A fresh install is not enough.

## 6. Non-functional checks
- [ ] Performance: key screens load in acceptable time, with no obvious slowdown compared with the current production version.
- [ ] Security basics: no secrets in client bundles or logs, auth is required on new endpoints, and permissions are enforced (user A can't see user B's data).
- [ ] Accessibility spot check on new UI: keyboard and screen-reader labels, and contrast.
- [ ] Analytics and tracking events fire for new features.
- [ ] Localization: new strings are translated or fall back correctly, if the app supports multiple languages.

## 7. Monitoring and rollback (must be done before release)
- [ ] Error tracking and alerting are live and cover the new code, e.g. Sentry or an equivalent.
- [ ] Dashboards are ready for error rate, latency, sign-ups, and conversions.
- [ ] Rollback plan is written: who does it, how, and how long it takes. Test it if you never have.
- [ ] Rollout strategy is decided: a staged or percentage rollout if possible, not 100% at once.
- [ ] An on-call owner is named for the first few hours after release.

## 8. Release day
- [ ] Final go/no-go check with engineering, QA, and product.
- [ ] Deploy, then run a 10-minute production smoke test of the section 3 flows.
- [ ] Watch errors and metrics for 1–2 hours, with clear thresholds that trigger a rollback.
- [ ] Support team knows what changed and has known-issue notes.

---

## Top risks to watch
- **Database migrations and upgrade paths.** These are the most common source of release-day incidents, and they are hard to undo.
- **Untested older clients.** For mobile, old app versions hitting the new API.
- **Config drift between staging and production.** Flags, environment variables, and keys.
- **Scope pressure.** With less than a day, the risk is shipping untested changes. If the new features in section 2 aren't verified by tonight, consider putting them behind a flag rather than delaying everything.

## Next actions (tonight)
1. Pull the release notes and assign owners to sections 2–4.
2. Confirm the rollback plan and monitoring (section 7). This is non-negotiable.
3. Set a go/no-go time and criteria, e.g. no open P0 bugs and the critical-path smoke tests pass.
4. Send me what changed and your platform, and I'll turn section 2 into specific test cases.
