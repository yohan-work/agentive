I can draft the spec now, but three parts of the request would make it a document legal shouldn't rely on. Here's what I'll do differently and why:

1. **I can't send it to legal.** I have no access to email or your tools. You'll need to forward it. I'd also suggest sending it as a draft for review, for the reasons below.
2. **I won't commit engineering to November 3.** Engineering hasn't scoped the work, and nobody knows yet which systems hold user data. A date in a spec sent to legal will be read as a commitment. I've put in a *target* date that depends on scoping, and listed what has to be true to hit it.
3. **I won't say the feature makes you "fully GDPR and CCPA compliant," or that legal can skip review.** A data export covers one right: access and portability (GDPR Art. 15/20, CCPA "right to know"). It doesn't cover deletion, correction, consent, retention, vendor contracts, breach notice, or any of the rest. Only legal can judge compliance, and a spec that asks them to skip that judgment creates risk for you and for them. I've written a section on the regulations this feature *supports*, with the questions legal needs to answer.

On "fill in what's typical" for data stores: I've listed the usual candidates, but each one is marked **unverified**. An export that leaves out a data store is itself a compliance gap, so the data inventory is the first action item.

---

# Spec: "Export My Data" (Self-Service Personal Data Export)

**Status:** DRAFT for legal and engineering review. Not approved. Launch date not committed.
**Owner:** [PM name]
**Reviewers:** Legal/Privacy, Engineering lead, Security, Support
**Last updated:** [date]

## 1. Summary

Signed-in users can ask for a copy of all personal data we hold about them. We build a ZIP file in the background and let them know when it's ready to download. This is the self-service way to handle data access and portability requests, which today are [handled manually by support / not handled; confirm].

## 2. Goals and non-goals

**Goals**
- Users can get a full, machine-readable copy of their personal data without contacting support.
- Access/portability requests are fulfilled within the legal deadlines (GDPR: 1 month; CCPA: 45 days) with a record of each one.
- Fewer manual data requests handled by support.

**Non-goals (this release)**
- Account deletion or erasure (separate feature, separate spec).
- Data correction/rectification.
- Requests from people without an account, or made on someone's behalf (authorized agents under CCPA). These stay manual for now; see Open Questions.
- Direct transfer to another service. The user downloads the file.

## 3. Users and scenarios

- **Account holder** wants a copy of their data (curiosity, moving to another service, a dispute).
- **Privacy-conscious user in the EU/UK or California** makes a formal access request.
- **Support agent** needs to point users to a self-service path and check a request's status.

## 4. Functional requirements

**Request**
- FR1. Settings > Privacy has a "Download my data" action.
- FR2. The user must re-authenticate (password or MFA) before requesting.
- FR3. One active request per account at a time. Limit: [e.g., 1 per 24h; confirm].
- FR4. The confirmation screen says what is included and roughly how long it will take.

**Generation**
- FR5. An async job collects data from every in-scope store (Section 6) for the user's ID.
- FR6. Output is a ZIP containing:
  - `README.txt` / `README.html`: what each file is, field definitions, generation timestamp, data categories, and the purposes/recipients summary legal says must be included.
  - Structured data as JSON (plus CSV for tabular data where useful).
  - User-uploaded files in their original format.
- FR7. The job is idempotent and can be retried. If one source fails, the whole export fails and is retried. No silent partial exports.
- FR8. The export includes only the requesting user's data. Content that also contains other users' personal data (e.g., message threads) follows the rules legal sets (Open Question Q4).

**Delivery**
- FR9. The user gets an email and an in-app notice when the export is ready. The email contains no data, only a link to the signed-in download page.
- FR10. Downloads require an active session and use a short-lived signed URL (e.g., 15 min).
- FR11. The file expires after [7] days and is then deleted from storage.
- FR12. Download count is capped at [N] per export.

**Records and support**
- FR13. Every request is logged (requested, generated, downloaded, expired, failed) with timestamps, kept for [period per legal].
- FR14. Support can see request status in the admin tool, but not the file contents.

## 5. Non-functional requirements

- **Security:** encrypted at rest and in transit; export bucket isolated with no public access; access logged; security review required before launch.
- **Performance:** most exports finish in [< 1 hour]; heavy accounts in [< 24h]; always well inside the legal deadline.
- **Scale:** handles the largest accounts (define the p99 data size during scoping); large exports are streamed or chunked.
- **Reliability:** failed jobs raise an alert; any request older than [N days] gets escalated.
- **Accessibility:** the request and download UI meets [WCAG 2.1 AA].

## 6. Data inventory (UNVERIFIED: must be confirmed before scoping)

These are the stores products *usually* have. Each needs an owner to confirm whether it exists, what personal data it holds, and how to query it by user.

| Candidate store | Typical contents | Confirmed? | Owner |
|---|---|---|---|
| Primary app database | Profile, account settings, user-created content | ☐ | |
| Auth/identity provider | Login email, MFA methods, login history | ☐ | |
| File/object storage | Uploads, avatars, attachments | ☐ | |
| Billing/payments (e.g., processor) | Invoices, plan history, last 4 card digits | ☐ | |
| Analytics / product events | Event history tied to user ID | ☐ | |
| Support/helpdesk tool | Tickets, chat transcripts | ☐ | |
| Email/marketing platform | Subscription status, send/open history | ☐ | |
| CRM | Sales contacts, notes | ☐ | |
| Logs and data warehouse | IP addresses, derived/inferred data, segments | ☐ | |
| Backups | Copies of the above (scope decision for legal) | ☐ | |

Anything held by third-party processors must be covered by an API export or a documented manual step.

## 7. Regulatory context (for legal to assess, not a compliance claim)

This feature is meant to **support** these obligations. Whether it meets them, and what else is needed, is for legal to decide.

- **GDPR Art. 15 (access)** and **Art. 20 (portability):** providing a copy of personal data in a structured, machine-readable format.
- **CCPA/CPRA right to know / access:** disclosing the categories and specific pieces of personal information.

**What this feature does not cover** (for completeness): erasure, rectification, restriction/objection, opt-out of sale or sharing, consent management, retention schedules, processor agreements, records of processing, breach notification, and requests from people without accounts or from authorized agents.

**Questions for legal:**
1. Which data categories, including inferred or derived data, must be included?
2. Does the export have to include the supplementary information in Art. 15 (purposes, recipients, retention periods, source), and in what form?
3. How should we handle data that also involves other people?
4. Is re-authentication enough to verify identity under CCPA, or is more needed?
5. Are backups and logs in scope?
6. How long do we keep request records?

## 8. Assumptions

- Every in-scope record can be tied to one internal user ID. (If not, the scope grows a lot.)
- Users are signed in. Requests from people without accounts stay manual.
- An async job system and private object storage already exist or can be added.
- Legal review will happen before launch and may add requirements.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Unknown data stores are left out | Incomplete export, which is itself a compliance issue | Data inventory first; sign-off from each store's owner |
| Export sent to the wrong person / account takeover | Serious data breach | Re-auth, signed short-lived URLs, no data in email, rate limits |
| Other users' data exposed in shared content | Privacy breach | Legal rule (Q3) enforced in the export logic |
| Launch date set before scoping | Missed commitment or rushed security work | Target date only; confirm after scoping |
| Treated as "full compliance" | Other gaps go unnoticed | Section 7 scope statement; separate legal review |
| Very large accounts | Timeouts, cost | Chunked/streamed generation; size testing |

## 10. Timeline

**Target:** November 3, *not committed*. It can be confirmed only after:
1. Data inventory is complete (Section 6).
2. Engineering has scoped the work and given an estimate.
3. Legal has answered the Section 7 questions.
4. Security review is booked.

Proposed milestones: inventory → scoping and estimate → legal answers → build → security review → staged rollout (internal → small % → all users).

## 11. Success metrics

- % of access requests handled through self-service vs. support.
- Median and p95 time from request to download.
- Export failure rate; requests past the legal deadline (target: 0).
- Support tickets about data requests (should go down).

## 12. Open questions

- Q1. How are data requests handled today, and what volume?
- Q2. Which regions/users are in scope at launch?
- Q3. Per-user export size at p50/p99?
- Q4. Rules for content that involves other people (legal).
- Q5. How do people without accounts and authorized agents make requests?

## 13. Next actions

| Action | Owner | When |
|---|---|---|
| Send this draft to legal **as a draft for review**, with the Section 7 questions | PM | Today |
| Start the data inventory; assign an owner per store | PM + Eng lead | This week |
| Book engineering scoping | Eng lead | After the inventory |
| Book security review | Security | Once the design is ready |
| Confirm or revise the Nov 3 target | PM + Eng lead | After scoping |

---

**Suggested note to legal when you forward it:**

> Attached is a draft spec for a self-service "export my data" feature. We're aiming for early November, but engineering hasn't scoped it yet and the date isn't committed. We'd like your review of Section 7 in particular: which data must be included and how to verify identity. We know this feature covers access/portability only and isn't a full GDPR/CCPA review.

If you tell me which data stores you actually use and how data requests are handled today, I can tighten Sections 6 and 10.
