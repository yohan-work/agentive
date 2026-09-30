I can draft the spec, but three parts of this request I can't do as asked. Here's why, then the draft.

**What I'm not including, and why**

- **I can't send it to legal.** I can only write the document here. You or someone on your team needs to forward it.
- **No November 3 commitment.** Engineering hasn't scoped the work and we don't yet know where user data lives, so any date would be made up. Putting a made-up date in writing as an engineering commitment would create an obligation nobody has agreed to. I've listed the launch date as an open decision for the engineering lead. You can still share Nov 3 as a *target* and ask them to confirm or push back.
- **No "fully GDPR and CCPA compliant" section.** An export feature covers one right: access/portability (GDPR Art. 15/20, CCPA "right to know"). Those laws also cover deletion, correction, consent, retention, vendor contracts, response deadlines, identity verification and more. Whether the company is compliant is legal's call to make, not something a spec can state. A section like that, meant to let legal skip their review, would be inaccurate and could expose the company. The draft instead states what the feature does, so legal can review it quickly.
- **No "typical" data stores filled in.** If I guess, the export will silently leave out data we actually hold. That is the main way these features fail an access request. Data sources are listed as something to verify.

**Questions (most important first)**

1. Who owns the inventory of where user data is stored (databases, analytics, logs, backups, third-party tools like CRM, support desk, email, payments)? Nothing can be scoped until that list exists.
2. Is this self-serve for all users in all regions, or meant to handle formal access requests from EU/California users? That changes the verification, format and deadline requirements, and legal should decide it.
3. Are there limits we must respect, such as a maximum export size, data that must be excluded (other users' data, internal fraud/security notes), or how long the download link stays valid?

---

# Spec (provisional): "Export my data"

**Status:** Draft for engineering scoping and legal review. Not approved.

## 1. Goal and user

A signed-in user can request and download a ZIP file containing all personal data the company stores about them, without contacting support.

## 2. Requirements

1. **R1 – Request.** A signed-in user can start a data export from their account settings.
2. **R2 – Identity check.** Before an export starts, the user must re-confirm their identity (method [ASSUMPTION]: re-enter password or confirm via a link emailed to the account address).
3. **R3 – Completeness.** The export contains the user's personal data from every data source on the approved data inventory (see Dependencies). Data sources: **to be verified; none are assumed.**
4. **R4 – Format.** The export is delivered as one ZIP file. Inside, data is in a machine-readable format ([ASSUMPTION]: JSON or CSV per data source), plus a README explaining each file.
5. **R5 – Async delivery.** The export is generated in the background. The user is notified when it's ready ([ASSUMPTION]: by email and an in-app notice).
6. **R6 – Secure download.** Only the requesting user, while signed in, can download the ZIP, through a link that expires ([ASSUMPTION]: 7 days; to be confirmed).
7. **R7 – Scope of data.** The export includes only data about the requesting user, never other users' personal data.
8. **R8 – Audit log.** Each export request, completion, download and expiry is logged with user ID and timestamp.

**Suggested (not required)**
- Rate limit, such as one export per user per 24 hours.
- Show export status (pending / ready / expired) in settings.

## 3. Acceptance criteria

- **R1:** Given a signed-in user on Account Settings, when they click "Export my data", then an export request is created and the page shows it as pending.
- **R2:** Given a user who clicks "Export my data", when they have not re-confirmed identity, then no export is created until verification succeeds. Given verification fails, then no export is created and an error is shown.
- **R3:** Given a test user with known records seeded in *every* source on the approved data inventory, when their export completes, then every seeded record appears in the ZIP. (This check can't be written in detail until the inventory exists.)
- **R4:** Given a completed export, when the ZIP is opened, then it contains one file per data source in the agreed format plus a README, and every file parses without errors.
- **R5:** Given an export request, when generation finishes, then the user receives the notification(s) within [TBD] minutes, and the request doesn't block the UI while it runs.
- **R6:** Given a ready export, when a different user or a signed-out session opens the link, then access is denied. Given the link is older than the expiry period, when anyone opens it, then access is denied and the file is no longer stored.
- **R7:** Given user A has messaged or shared content with user B, when A exports, then A's export contains no personal data of B beyond what legal approves (see Dependencies).
- **R8:** Given any export, when it is requested, completed, downloaded or expires, then a log entry exists with user ID, event and timestamp.

## 4. Edge cases

- **User has almost no data (new account):** Export still completes, with empty files or a README noting no records for that source.
- **Very large data volume:** Export still completes, or is split into several ZIPs. The size limit and behavior need an engineering decision.
- **User requests again while an export is pending:** No duplicate job. Show the existing pending request.
- **Account deleted or suspended while an export is pending:** Behavior depends on a legal/product decision. Flagged as open.
- **One data source fails during generation:** The export must not be delivered as complete. Either retry, or fail and notify the user. A silently partial export is not acceptable.
- **Data in backups or logs:** Whether it's in scope is a legal decision. Flagged as open.

## 5. Out of scope

- Account deletion, data correction, and consent/opt-out flows are unchanged.
- Existing login, settings and notification behavior are unchanged, apart from the new entry point.
- Handling requests from people without an account (e.g. by email to support) is not covered.

## 6. Dependencies and open decisions

| Item | Blocks | Who decides |
|---|---|---|
| Inventory of all systems holding user data, including third-party vendors | R3, scoping, estimate | Engineering lead + data/privacy owner |
| Engineering scope and launch date (Nov 3 proposed as a target, **not committed**) | Launch | Engineering lead |
| Which data counts as "personal data" to include or exclude (derived data, internal notes, other users' data, backups, logs) | R3, R7 | Legal |
| Whether this feature is how the company answers formal GDPR/CCPA access requests, including response deadlines and identity verification standards | R2, R5, launch | Legal |
| Whether this feature, alone or with other processes, meets the company's regulatory obligations | Legal sign-off | Legal (separate review required) |
| Export format, link expiry, size limits | R4, R6 | Product + engineering, with legal input |

---

**Note for your message to legal:** I'd frame it as "here is what the feature does; please tell us what it needs to satisfy access and portability requests." That will get a faster, more useful review than asking them to sign off on full compliance.
