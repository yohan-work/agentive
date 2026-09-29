Here's a pre-release QA checklist you can work through today. I don't know what kind of app this is (web, mobile, desktop, API) or what changed in this version, so it's written to be broad. Skip what doesn't apply, and put your effort into the areas this release actually touched.

A quick note on "everything": you can't fully test an app in one day. So work in this order: **critical paths first, then what changed in this release, then everything else.** If you run out of time, the untested items should be low-risk ones, and you should choose them on purpose.

---

## 0. Before you start (30 min)
- [ ] Freeze the release candidate build/commit and write down its version number.
- [ ] List every change in this release (tickets, PRs, changelog).
- [ ] Mark each change by risk: payments, auth, data migrations, and anything user-facing on the main flow count as high risk.
- [ ] Confirm the test environment matches production (config, feature flags, third-party keys, data volume if you can).
- [ ] Assign an owner to each section below and set a go/no-go time for tonight.

## 1. Critical user paths (must pass, no exceptions)
- [ ] Sign up / create an account
- [ ] Log in / log out / session expiry / "remember me"
- [ ] Password reset and email verification (check that the emails actually arrive and their links work)
- [ ] The core action your app exists for (checkout, posting, booking, sending, etc.), end to end
- [ ] Payments: successful charge, declined card, refund, and receipt/invoice (if applicable)
- [ ] Onboarding / first-run experience for a brand-new user
- [ ] Existing user upgrading from the previous version: data is still there and settings are kept

## 2. New and changed features
- [ ] Each ticket in this release meets its acceptance criteria.
- [ ] Happy path, plus at least one edge case and one error case per feature.
- [ ] Feature flags: behavior with the flag on AND off.
- [ ] Removed or deprecated features: they're actually gone, and nothing links to them.
- [ ] Copy/text: no placeholder text, typos, or untranslated strings.

## 3. Regression
- [ ] Run the automated test suite (unit, integration, e2e) and confirm it's green.
- [ ] Manual smoke test of the main areas that did *not* change (navigation, search, profile, settings, notifications).
- [ ] Re-test bugs fixed in recent releases (these tend to come back).

## 4. Data and backend
- [ ] Database migrations run cleanly on a copy of production data.
- [ ] Migrations are reversible, or you have a documented rollback plan.
- [ ] No data loss or corruption for existing records.
- [ ] API backward compatibility: older clients (especially older mobile app versions) still work.
- [ ] Background jobs, queues, cron tasks, and webhooks run correctly.
- [ ] Third-party integrations (payments, email/SMS, analytics, auth providers, maps, etc.) work with production credentials.

## 5. Platforms and devices
**Web**
- [ ] Latest Chrome, Safari, Firefox, and Edge
- [ ] Mobile browsers (iOS Safari, Android Chrome)
- [ ] Responsive layouts at mobile, tablet, and desktop widths

**Mobile apps**
- [ ] Minimum supported OS version and the latest OS version
- [ ] Small and large screens, notched devices, tablets if supported
- [ ] Fresh install AND upgrade over the previous version
- [ ] Permissions (camera, location, notifications): grant, deny, and revoke later
- [ ] Backgrounding/foregrounding, rotation, interruptions (calls, low battery)
- [ ] Push notifications, deep links, universal links
- [ ] App store build: signed correctly, right version/build number, store listing and screenshots updated, review approved (with time for rollout)

## 6. Error handling and edge cases
- [ ] Slow or no network: offline behavior, timeouts, retries
- [ ] Invalid input: empty fields, very long strings, special characters, emoji, other languages
- [ ] Double-clicks / double-submits (especially on payment and create actions)
- [ ] Empty states (new user, no data) and large data sets (pagination, long lists)
- [ ] Error messages are clear and don't expose stack traces or internal details
- [ ] Time zones, date formats, daylight saving boundaries

## 7. Security
- [ ] Authorization: users can't see or edit other users' data (try changing IDs in URLs/requests)
- [ ] Role/permission checks for admin and restricted features
- [ ] No secrets, API keys, or debug flags in the client build or logs
- [ ] HTTPS everywhere; secure cookies/tokens
- [ ] Input validation against injection (SQL, XSS) on new forms and endpoints
- [ ] Dependency vulnerability scan has no critical issues

## 8. Performance
- [ ] Key pages/screens load in an acceptable time (compare with the previous version)
- [ ] No obvious memory leaks or crashes during a long session
- [ ] Load test for expected traffic, especially if you expect a spike at launch
- [ ] App/bundle size hasn't grown unexpectedly

## 9. Accessibility and localization
- [ ] Keyboard navigation and visible focus states (web)
- [ ] Screen reader labels on new UI (VoiceOver / TalkBack)
- [ ] Color contrast and text scaling / dynamic type
- [ ] All supported languages render correctly (no overflow or truncation; right-to-left if supported)

## 10. Analytics, monitoring, and legal
- [ ] Analytics events fire for new features and still fire for existing key events
- [ ] Error tracking/crash reporting is connected to the new version
- [ ] Dashboards and alerts are ready for launch morning
- [ ] Privacy policy, terms, cookie consent, and app store privacy labels updated if data collection changed

## 11. Release readiness (tonight)
- [ ] Deployment steps are written down, and it's clear who runs them and when
- [ ] **Rollback plan tested**: you know exactly how to revert the build, the config, and the database if needed
- [ ] Use a staged rollout or feature flags for risky changes, if you can
- [ ] Release notes and changelog are ready; support and customer-facing teams are briefed
- [ ] On-call person(s) confirmed for launch morning
- [ ] Known issues list: each one is either accepted with a reason or blocks the release
- [ ] Final go/no-go decision recorded

## 12. After deploy (launch morning)
- [ ] Smoke test the critical paths (section 1) **in production**
- [ ] Watch error rates, crash rates, latency, and key business metrics for the first few hours
- [ ] Check support channels and app store reviews for early reports
- [ ] Agree ahead of time on the threshold that triggers a rollback

---

**Suggested go/no-go rule:** ship only if every item in section 1 passes, there are no open critical or high-severity bugs, migrations and rollback have been verified, and monitoring is in place. Anything else can go on a known-issues list for a fast follow-up.

If you tell me what kind of app it is, which platforms it runs on, and what's in this release, I can cut this down to a focused, prioritized list your team can realistically finish before tomorrow morning.
