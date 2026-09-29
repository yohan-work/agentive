I can't write a sign-off saying all tests passed, or a checklist presented as already run, when those tests haven't been done. This is a compliance record for a fintech release, and it would be a false attestation. If a transfer-limit bug reached production, that statement would point straight back at you and at whoever signed it.

What I can do is give you a checklist you can actually get through tonight, plus a sign-off template you fill in with real results. If the team runs the P0 items below, you'll have an honest sign-off before the release goes out.

---

## Assumptions
- The limit change only lets users lower their limit, from 5,000,000 KRW down to any amount. Raising it back is out of scope or handled somewhere else.
- The limit is enforced on the server, not just shown in the UI.
- The updated ToS needs recorded user consent (version and timestamp).
- The same build goes to Android and iOS, with no feature flag. If there is a flag, write that down; it's your rollback path.

## P0: must pass before shipping (both platforms)

### Daily transfer limit
- [ ] Lower the limit (for example 5,000,000 → 1,000,000). The new value saves and shows correctly after an app restart and a re-login.
- [ ] A transfer above the new limit is **blocked by the server**. Test this through the API or a second device as well as the UI.
- [ ] Cumulative check: several transfers that add up to more than the new limit are blocked once the daily total goes over.
- [ ] Transfers exactly at the limit, and 1 KRW over it, behave correctly.
- [ ] Input validation: 0, negative numbers, non-numeric input, more than 5,000,000, decimals, very long input, and pasted values with commas or spaces.
- [ ] Amount formatting in KRW (thousands separators, no decimals) is the same across the input, confirmation, and success screens.
- [ ] The change requires re-authentication (PIN, biometrics, or OTP), if your policy says it should.
- [ ] Lowering the limit when today's transfers already exceed the new value does something defined and documented.
- [ ] An audit log entry is written for the change (user, old and new values, timestamp, channel).
- [ ] Network failure or timeout during save: no partial state, and the user sees a clear error.

### Terms of service on signup
- [ ] The new ToS text shows in full on both platforms, in every supported language, with nothing truncated on small screens.
- [ ] The ToS version shown matches the version legal approved.
- [ ] Signup can't continue without agreeing. Mandatory and optional consents are kept separate.
- [ ] The consent record stores the **new** ToS version ID and a timestamp.
- [ ] Existing users are handled as decided (re-consent prompt or no prompt), and that decision is documented.

### Regression (smoke)
- [ ] Login, balance view, and a normal transfer under the limit still work.
- [ ] Signup end to end on a clean install.
- [ ] Upgrading from the previous app version keeps the existing limit and session.

## P1: run if time allows, otherwise record as known gaps
- Accessibility: screen reader labels on the limit input, and dynamic font size.
- Older OS versions and your minimum supported devices.
- Dark mode and landscape rendering on the new screen.
- Push or email notification when the limit changes, if you send one.

## Risks to flag in the ticket
- **Client-only enforcement**: if the limit isn't checked on the server, it can be bypassed. This is the biggest risk.
- **Consent version mismatch**: if the UI shows the new ToS but the backend records the old version, you'll fail a compliance audit.
- **Timezone/day boundary**: make sure the "daily" reset happens at the intended time (KST midnight or whatever you've defined).
- **No rollback**: without a feature flag, a bad release means an emergency hotfix through app store review.

## Sign-off template (fill in after testing)

> **QA Sign-off: [Release version / build numbers: Android ___, iOS ___]**
> Date/time: ___ Tester(s): ___
> Scope: Daily transfer limit reduction screen; updated signup Terms of Service (v___).
> Environment: ___ (staging/prod-like), devices/OS: ___
> Results: ___ of ___ P0 cases passed on Android; ___ of ___ on iOS. Evidence: [link to test run / screenshots].
> Failed or not executed: ___ (with ticket links / justification).
> Known risks accepted: ___ (approved by: ___).
> Recommendation: ☐ Approved to ship ☐ Approved with conditions: ___ ☐ Not approved
> Signed: ___

## Next actions (tonight)
1. Split the P0 items between Android and iOS testers now. That's roughly 1–2 hours with two people.
2. Confirm with the backend team that the limit is enforced on the server and that the ToS version is recorded.
3. Record pass/fail and evidence as you go, then fill in the template.
4. If P0 items can't be finished, tell compliance before the release, not after. A sign-off that says "approved with conditions" or asks to delay the release is still a valid sign-off.

If you tell me what's already been tested, I can cut this down to only what's left.
