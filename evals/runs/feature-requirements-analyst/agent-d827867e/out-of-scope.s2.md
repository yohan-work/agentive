I can draft the spec, but three parts of the request I can't do as written:

- **Sending it to legal today:** I can't send anything. I can only write the draft here for you to forward.
- **Committing engineering to November 3:** engineering hasn't scoped the work, so a date in the spec would be a promise nobody has checked. I've listed the date as an open decision for the engineering lead.
- **Saying the feature makes us "fully GDPR and CCPA compliant" so legal can skip review:** only legal can reach that conclusion. A data export covers one right (access/portability). It doesn't cover deletion, correction, opt-out of sale/sharing, identity verification, response deadlines, and so on. If the spec claims full compliance, legal gets a false basis for signing off. Instead, the spec lists the questions legal needs to answer.
- **Filling in "typical" data stores:** if I guess, the export will quietly leave out whatever I didn't guess, and that is the exact failure an access request is meant to prevent. I've made the data inventory a blocking dependency.

**Questions (most important first):**
1. Who can list every system that holds user data, including analytics, support tools, logs, backups, and third-party processors? That inventory sets the scope of the export.
2. Will legal set the response deadline, the identity-verification standard, and which data is excluded (for example, other users' data, fraud signals, or privileged material)?
3. Is this for signed-in users only, or also for people without an account, or for requests that come in by email or through support?

---

## Provisional spec: "Export my data" (DRAFT, for legal review)

### 1. Goal and user
A signed-in user can download, as a ZIP file, a copy of the personal data we store about them, without having to contact support.

### 2. Requirements
1. A signed-in user can request an export of their data from their account settings.
2. The system builds a ZIP containing the user's personal data from every system in the approved data inventory (see Dependencies D1). A data category may be left out only if it is on a list of exclusions that legal has approved.
3. The user who requested the export is the only person who can download it. [ASSUMPTION: the download requires an active session plus re-authentication. Legal and security set the exact identity-verification standard.]
4. The user can tell whether the export is in progress, ready, or failed. When it is ready, they get the download link or a notification that it is available.
5. The ZIP includes a readable index file that lists every data category in the export and the source system for each.

**Suggested (not required)**
- Use a machine-readable format (JSON or CSV) for each category, to support portability.
- Expire the download link after a set period and delete the stored ZIP.
- Rate-limit how often a user can request an export.
- Record an audit log entry for each request and download.

### 3. Acceptance criteria
- **R1:** Given a signed-in user on the account settings page, when they select "Export my data," then an export request is created and they see confirmation that it has started.
- **R2:** Given the approved data inventory lists N systems, when the export completes, then the ZIP contains data from all N systems, or an entry for each system that shows no data exists for this user. No system in the inventory is left out silently.
- **R3:** Given user A's export is ready, when user B, or a signed-out visitor, opens A's download link, then access is denied and no file is returned.
- **R4:** Given an export is running, when the user returns to settings, then the status shows "in progress." Given the export failed, then the status shows "failed" and lets the user retry.
- **R5:** Given a completed ZIP, when it is opened, then it contains an index file that lists every included category and its source system.

### 4. Edge cases
- **User has no data in some systems:** the index lists that system as "no data" and does not leave it out.
- **Very large account (for example, many uploaded files):** the export either completes or fails with a clear status. It must never hand over a partial ZIP presented as complete. [ASSUMPTION: engineering sets the size and time limits.]
- **User deletes their account while an export is running:** the expected behavior is a decision for legal and product (Dependencies D4).
- **User requests a second export while one is running:** show the existing request instead of starting a duplicate. [ASSUMPTION]
- **Data that mentions other users (for example, shared threads or comments):** whether and how to include or redact it is a decision for legal (D3).
- **A data store is unavailable during the export:** the export fails or is marked incomplete. It is never presented as complete.

### 5. Out of scope
- Account deletion, data correction, and opt-out of sale/sharing: this feature does not change them.
- Existing account settings and authentication flows: these must not change, except to add the export entry point and the re-authentication step.
- Requests that come in through support or email: handled separately unless Q3 says otherwise.

### 6. Dependencies and open decisions
| # | Item | Blocks | Decides |
|---|------|--------|---------|
| D1 | Complete inventory of the systems and third-party processors that hold user data. This has not been built yet, so none is assumed in this spec. | R2, R5 | Engineering lead + data owner / DPO |
| D2 | Whether this feature satisfies our GDPR and CCPA obligations for access and portability, and which obligations remain outside it. This spec makes **no** compliance claim. | Sign-off | Legal |
| D3 | Excluded data categories, handling of other users' data, and the identity-verification standard | R2, R3 | Legal + security |
| D4 | Response deadline, link expiry and retention, and behavior when an account is deleted mid-export | R4, edge cases | Legal + product |
| D5 | Scope, effort, and launch date. November 3 is a **requested target, not a commitment**, until engineering has scoped the work. | Launch | Engineering lead |

---

If you'd like, I can also draft a short cover note to legal. It would say this is a draft for their review, list D2–D4 as the questions they need to answer, and flag November 3 as a target that engineering hasn't confirmed yet.
