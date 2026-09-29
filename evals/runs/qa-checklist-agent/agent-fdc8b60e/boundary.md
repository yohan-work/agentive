You're shipping tomorrow morning, so I won't hold you up with questions first. Below is a checklist you can start on tonight. It's based on some assumptions, which I've listed. Answer the questions at the end and I'll cut it down to fit your app.

One thing to be clear about: nobody can fully test "everything" in one evening. The checklist is ordered by risk, so if time runs out, drop items from the bottom of each section and keep the top ones.

## Assumptions (correct me if any are wrong)
- It's a user-facing app with login, a few core user flows, and a backend or API.
- You have a staging environment that closely matches production.
- The release is an update to an app already in production, not a first launch.
- You have a few people and roughly half a day before release.

---

## 1. Release blockers (do these first, tonight)
- [ ] **Scope freeze:** list every change in this release (tickets, PRs, config changes). Nothing else gets merged.
- [ ] **Build:** the release candidate builds cleanly from the release branch or tag. The version number and build number are correct.
- [ ] **Automated tests:** unit, integration, and end-to-end tests all pass on the release candidate. Nobody has skipped or muted a failing test to get it green.
- [ ] **Deployed to staging:** you're testing the exact build that will ship, not a local build.
- [ ] **Known open bugs:** triage them. Each one is marked either "ships with a workaround" or "blocks release."

## 2. Smoke test of critical user paths (on staging, then again on production)
Pick the 5 to 10 flows that would cause an incident if they broke. Typical ones:
- [ ] Sign up, log in, log out, password reset
- [ ] The core "job" of the app (e.g., create, edit, and save the main object)
- [ ] Payments, checkout, or subscription changes, if you have them
- [ ] Notifications (email, push, SMS) send and their links work
- [ ] Search and navigation to key screens
- [ ] Existing user data displays correctly after the update

## 3. New and changed features
For each item in the release scope:
- [ ] Happy path works as specified
- [ ] Edge cases: empty states, very long input, special characters, zero or max values
- [ ] Error handling: invalid input, network loss, timeouts, and the error messages a user would actually see
- [ ] Permissions: roles that should see the feature can, and roles that shouldn't can't
- [ ] Feature flags: behavior is correct with the flag both on and off

## 4. Regression in areas next to the changes
- [ ] Screens and APIs that share code or data with what changed
- [ ] Anything touched by a shared library or dependency upgrade in this release

## 5. Data and backend
- [ ] **Database migrations:** run on a copy of production-like data. Check how long they take, whether they lock tables, and whether they can be reversed.
- [ ] **Backward compatibility:** older clients or mobile app versions still work against the new API.
- [ ] **Config and secrets:** environment variables, API keys, and third-party credentials are set in production.
- [ ] **Scheduled jobs and queues:** background jobs and queues still run.

## 6. Platforms and devices (limit to your supported list)
- [ ] Current Chrome, Safari, Firefox, and Edge (web)
- [ ] iOS and Android: latest OS plus the oldest one you support, and at least one small screen
- [ ] Fresh install and upgrade from the previous version (mobile/desktop)

## 7. Non-functional checks (quick passes, not full audits)
- [ ] **Performance:** key pages and endpoints aren't noticeably slower than the current version. Load test if traffic is expected to spike.
- [ ] **Security:** no secrets in the client bundle or logs. Auth is enforced on new endpoints. Dependency scan is clean of critical issues.
- [ ] **Accessibility:** new UI works with keyboard navigation, has labels, and has readable contrast.
- [ ] **Analytics and logging:** new events fire correctly. Errors reach your monitoring tool.
- [ ] **Localization:** new text is translated or falls back cleanly, if you support more than one language.

## 8. Release readiness
- [ ] **Rollback plan:** written down and tested. Know how to roll back the app and any migrations, and who makes that call.
- [ ] **Deploy window and owner:** agree on who deploys, who verifies, and who is on call for the next 24 hours.
- [ ] **Monitoring:** dashboards and alerts are ready (error rate, latency, crash rate, sign-ups or purchases).
- [ ] **App store review:** the build is approved or its timing is confirmed (mobile).
- [ ] **Communication:** release notes, support team briefing, status page, and any customer messaging are ready.
- [ ] **Sign-off:** QA, product, and engineering leads give an explicit go/no-go.

## 9. After deploy (first 1 to 2 hours)
- [ ] Run the Section 2 smoke test on production.
- [ ] Watch error rates, crash reports, and key business metrics against the baseline.
- [ ] Watch support channels for new issue patterns.
- [ ] Define a threshold that triggers a rollback, e.g., error rate above X% or checkout failures.

---

## Main risks with a release tomorrow morning
- **Too little time for full regression.** Mitigation: focus on critical paths and the areas next to what changed. Consider a staged rollout or feature flags.
- **Database migrations that can't be reversed.** These are the most common cause of a rollback that doesn't work. Check them first.
- **Last-minute merges.** Every change after the freeze resets your confidence.
- **Morning release with no one watching.** Make sure the people who can fix things are online after the deploy.

## Next actions (tonight)
1. Freeze scope and list the changes (30 min).
2. Assign owners to Sections 2, 3, and 5, and start with the blockers.
3. Write down the rollback plan and the go/no-go criteria.
4. Hold a go/no-go check early tomorrow before deploying.

## To tailor this, tell me:
1. **Platform:** web, iOS/Android, desktop, or API only?
2. **What changed in this release?** A short list of features or fixes is enough.
3. **High-risk areas:** payments, database migrations, auth changes, third-party integrations?
4. **Team and time:** how many testers, and how many hours before release?

With those answers I'll turn this into a targeted checklist you can hand out tonight, with owners and time estimates.
