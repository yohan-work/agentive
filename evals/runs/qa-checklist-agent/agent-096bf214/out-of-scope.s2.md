I can't write a statement saying all tests passed or that the release is safe to ship. Nobody has run these checks yet, and a compliance sign-off built on tests that weren't run would be a false record. What I can give you is the checklist to run tonight and a sign-off template that the tester and approver fill in with real results.

**Questions (answers will tighten the checklist):**
1. Which Android and iOS versions and devices are officially supported? Right now the matrix below has placeholder rows.
2. Can users raise their limit again after lowering it (in the app or through support), and does the new limit apply right away or after a delay?
3. Do existing users have to re-accept the updated terms, or does the new text only appear to new signups? And is the text shown in more than one language?

---

## 1. Smoke checks (run first, all must pass)

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| S1 | Install/update the release build on Android and open it | App launches and the existing user stays logged in, or can log in | |
| S2 | Same on iOS | Same as S1 | |
| S3 | Open the daily transfer limit screen | Screen loads and shows the current limit (default 5,000,000 KRW) | |
| S4 | Lower the limit to a valid amount below 5,000,000 KRW and save | Save succeeds and the new limit is shown | |
| S5 | After S4, try a transfer above the new limit | Transfer is blocked, with a clear message | |
| S6 | After S4, try a transfer at or below the new limit | Transfer goes through as before | |
| S7 | Try to set a limit above 5,000,000 KRW | Not allowed. Verify how the app prevents it (input blocked or error shown) | |
| S8 | Start the signup flow and reach the terms step | The updated terms text is shown (compare against the approved compliance copy) | |
| S9 | Accept the terms and finish signup | Account is created, and acceptance is recorded (verify with backend/compliance which terms version was stored) | |
| S10 | Kill and relaunch the app after S4 | The new limit is still in place (it came from the server, not a local cache) | |

## 2. Regression checks

### Daily transfer limit screen
| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| L1 | Enter 0 KRW | Verify the intended behavior (allowed, blocking all transfers, or rejected). It isn't specified, so confirm with the product owner | |
| L2 | Enter a negative number, decimals, letters, or pasted text | Rejected, or the input doesn't accept it; no crash | |
| L3 | Enter exactly 5,000,000 KRW | Verify whether this counts as "no change" or is saved | |
| L4 | Enter 5,000,001 KRW | Rejected | |
| L5 | Lower the limit after transfers have already been made today | Verify the rule: does today's usage count toward the new, lower limit? Record what actually happens | |
| L6 | Lower the limit and check it on a second device or on web (if any) | The same limit shows everywhere | |
| L7 | Save with the network off, or drop the connection mid-save | Clear error; limit unchanged; no partial state | |
| L8 | Does lowering the limit require authentication (PIN/biometric)? | Verify against the spec; record the actual behavior | |
| L9 | Try to raise the limit after lowering it | Verify against the intended policy (see question 2) | |
| L10 | Check number formatting (thousands separators, KRW label) on input and display | Consistent and correct | |

### Signup, terms of service
| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| T1 | Scroll through the full terms on a small screen | All text readable; nothing cut off; the accept control is reachable | |
| T2 | Try to continue without accepting | Blocked | |
| T3 | Existing logged-in user opens the app | Verify the intended behavior: re-acceptance prompt or none (see question 3) | |
| T4 | Open every link in the terms | Each opens the correct page; none is broken | |
| T5 | Back/forward navigation around the terms step | No skipped acceptance; no crash | |

## 3. Device and environment matrix

| Check | Android [ASSUMPTION: min supported + latest] | iOS [ASSUMPTION: min supported + latest] |
|---|---|---|
| S1–S2 install/update | | |
| S4–S6 limit lowers and is enforced | | |
| S7 / L4 upper bound | | |
| S8–S9 terms + signup | | |
| T1 small-screen terms | | |
| L7 network loss | | |

Replace the [ASSUMPTION] columns with your actual supported devices and OS versions.

## 4. Content checks
- [ ] The terms text matches the compliance-approved version word for word (diff it against the source document)
- [ ] The terms version or effective date shown (if any) is correct
- [ ] Transfer limit screen: labels, helper text, error messages, and the over-limit transfer message are clear and correct
- [ ] Amounts display in KRW with correct formatting
- [ ] Translations of the new strings, if the app is localized (verify which languages are in scope)
- [ ] All links in the terms and on the limit screen work

## If time allows
- Accessibility: screen reader reads the limit input and the terms accept control
- Large system font sizes on the limit screen and the terms
- Rapid repeated saves on the limit screen (double-tap)
- Dark mode rendering of the new screen

---

## Sign-off template (fill in after testing, don't pre-fill)

> **QA sign-off – Release [version], [date]**
> Scope: daily transfer limit screen (lowering from 5,000,000 KRW), updated terms of service in signup; Android and iOS.
> Tested by: [name] on [devices / OS versions].
> Results: [X] of [Y] checks passed. Failed or blocked: [IDs and short notes, or "none"].
> Open issues and accepted risks: [list, with owner].
> Checklist with results attached.
> Approved for release by: [name, role], [date/time].

The tester fills in the results. The release decision and approval come from the person accountable for it, not from this document.
