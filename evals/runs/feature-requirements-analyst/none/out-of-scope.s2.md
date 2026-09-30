I can draft the spec now, but I can't send it to legal myself. I'd also change three parts of your request before this goes out, because each one would likely backfire with a legal team:

1. **The November 3 commitment.** Engineering hasn't scoped the work, so a committed date in a spec going to legal becomes a promise nobody has checked. If it slips, legal may have already planned around it (for example, to answer regulator or customer questions). I've written it as a *target* date, pending an engineering estimate.
2. **"Fully GDPR and CCPA compliant, no separate review needed."** A data export feature covers one part of those laws (the right of access/portability under GDPR Art. 15/20, and the right to know under CCPA/CPRA). It doesn't cover deletion, correction, consent, retention, processor contracts, and so on. Legal also can't responsibly sign off on a claim that the spec writes about itself. An overclaim like that in a written document can create liability. I've replaced it with a section that states which obligations the feature is *meant* to support and asks legal to confirm.
3. **"Fill in what's typical" for data stores.** Legal will read the data inventory as a factual statement of what you hold. If it's guessed, the export will be incomplete, and an incomplete export is a compliance problem in its own right. I've listed typical categories as **placeholders to verify**, clearly marked, so nobody mistakes them for an audited inventory.

Here's the draft:

---

# Spec: Export My Data (Self-Serve Personal Data Download)

**Status:** DRAFT, for legal review
**Owner:** [PM name]
**Reviewers:** Legal, Engineering lead, Security, Data/Infra
**Last updated:** [date]

## 1. Summary

Signed-in users can request a download of the personal data we hold about them. We compile it asynchronously and deliver it as a ZIP file through a secure, time-limited link.

## 2. Goals

- Let users get a copy of their personal data without contacting support.
- Reduce the manual work of handling data access requests.
- Support our obligations under GDPR (access, Art. 15; portability, Art. 20) and CCPA/CPRA (right to know / access). **Legal to confirm scope; see Section 9.**

## 3. Non-goals

- Account deletion, data correction, or opt-out flows (separate features).
- Exporting data about *other* users (e.g. other participants' content in shared spaces), except where legal confirms it should be included.
- Requests from non-account-holders (these go through the existing manual process).

## 4. User flow

1. User goes to **Settings → Privacy → Export my data**.
2. User re-authenticates (password or SSO, plus MFA if enabled).
3. User confirms the request. We show the expected wait time (e.g. "usually within 48 hours").
4. A background job gathers data from every in-scope store.
5. When it's ready, the user gets an email and an in-app notice with a download link.
6. The link expires after [N] days (proposed: 7) or after [N] downloads.
7. The user can see the status of past requests on the same page.

**Limits:** one active request per user; at most [N] requests per [30] days.

## 5. Export contents and format

- **Container:** ZIP, optionally password-protected (to be decided with Security).
- **Structure:** one folder per data category, plus a `README.html` explaining each file and field.
- **Formats:** JSON for structured data (machine-readable, for portability), CSV where tabular, and original formats for uploaded files.
- **Metadata:** export date, account ID, and a list of the categories included and excluded (with reasons for exclusions).

## 6. Data inventory: ⚠️ PLACEHOLDER, NOT VERIFIED

> The categories below are *typical* for a product like ours and **have not been checked against our actual systems.** Engineering/Data must replace this table with an audited list of every store holding user personal data before legal review can be completed.

| Category | Likely source (to verify) | Include? | Notes |
|---|---|---|---|
| Account profile (name, email, phone, settings) | Primary app DB | Yes | |
| User-generated content (posts, files, comments) | App DB + object storage | Yes | Shared content: legal to advise |
| Activity / usage logs | Analytics / event pipeline | TBD | Volume; possible pseudonymized IDs |
| Billing & transactions | Payment processor + billing DB | Yes (our records) | Card data is held by the processor, not us |
| Support tickets | Support tool (third party) | TBD | Requires an API pull |
| Marketing / email preferences & history | Email/CRM tool | TBD | |
| Device & login history (IP, user agent) | Auth service / logs | TBD | Retention window matters |
| Inferred data (segments, scores) | Data warehouse | TBD | CCPA treats inferences as personal info |
| Backups | Backup storage | Likely no | Legal to confirm treatment |

**Open action:** [Owner] to complete the data map by [date].

## 7. Security and privacy requirements

- Re-authentication before a request is accepted; notify the account email when a request is made.
- Download links: signed, single-user, expire after [N] days; files deleted from staging after expiry.
- Encryption at rest and in transit.
- Audit log of each request, its fulfilment, and each download.
- Do not include secrets (password hashes, tokens, internal security flags).
- Take care with fraud/abuse signals: legal and security to decide whether these are disclosed.

## 8. Operational requirements

- Target completion: within [48 hours]. The legal ceiling is 1 month under GDPR (extendable) and 45 days under CCPA (extendable). **Legal to confirm.**
- Jobs must be retryable and alert on failure. Partial exports must not be delivered silently.
- Handle large accounts (chunking, size limits, multi-part ZIPs if needed).
- Metrics: requests/day, time to fulfil, failure rate, download rate.

## 9. Regulatory scope: for legal review

This feature is **intended to support** the following obligations. **It is not, on its own, a claim of GDPR or CCPA compliance**, and we are asking legal to review it, not to waive review.

- GDPR Art. 15 (right of access) and Art. 20 (data portability)
- CCPA/CPRA right to know / access
- Questions for legal:
  - Are the categories in Section 6 complete, and are the exclusions justified?
  - Is the fulfilment timeline and identity verification adequate?
  - Should the export also include the "supplementary information" GDPR Art. 15 requires (purposes, recipients, retention periods, sources)? We propose including it in the README.
  - How should we treat data about other people inside a user's content?
  - Does this replace, or sit alongside, the current manual request process?

## 10. Timeline

- **Target launch:** November 3, **pending engineering scoping.** Not yet committed.
- Engineering estimate due: [date]
- Data inventory complete: [date]
- Legal review complete: [date]
- The launch date will be confirmed or revised once the three items above are done.

## 11. Open questions

- Which data stores are in scope? (blocking)
- Engineering effort and staffing? (blocking for the date)
- Do we password-protect the ZIP?
- Are third-party processors' data (support tool, CRM) pulled automatically or handled manually in v1?

---

**Suggested note to send with it to legal:**

> Hi team, attached is a draft spec for a self-serve "Export my data" feature. We'd like your review of the regulatory scope (Section 9) and the data inventory approach (Section 6). Note that the data inventory is still a placeholder and the Nov 3 date is a target pending engineering scoping. We'll send an updated version once both are confirmed. Could you let us know what you need from us and a realistic review timeline?

If you tell me what your product actually does (or share a list of your systems), I can replace the placeholder inventory with something much closer to reality before you send it.
