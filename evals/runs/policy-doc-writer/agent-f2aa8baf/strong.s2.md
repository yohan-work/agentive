Before you publish, three questions. The draft below works without the answers, but each one changes what an employee is told to do.

1. **Can the Security lead approve an exception to the patient-data ban (Rule 2) or the credentials ban (Rule 4)?** Rule 2 says "never, approved or not", but the exception process covers "a specific tool + dataset". The two conflict. The draft assumes exceptions **cannot** cover patient data or credentials.
2. **Is Notion AI approved?** You list it as a tool in scope and you'll publish this in Notion, but it isn't on the approved list. Under Rule 1 as written, it is **not approved for any company data**, and that includes summarizing this Notion workspace. The draft says so. If that's not what you intend, add it to the approved list before publishing.
3. **Who owns this policy (name and role), and when is it next reviewed?** The draft uses [TBD] placeholders.

---

## 1. The policy (ready to paste)

# Using AI Tools with Customer Data

**Owner:** [TBD: policy owner name and role]
**Effective:** [TBD: date] · **Next review:** [TBD: date]
**Questions:** [TBD: where to ask, e.g. a Slack channel or the owner]

### Purpose

AI tools save us time. But our customers are dental clinics, and their data includes information about their patients. We have promised clinics, in our contracts, to protect that data, and Korea's PIPA covers it too. This policy tells you which AI tools you may use, and what data you may put into them.

### Who and what this covers

- **Who:** Every Relaymint employee and contractor, on every team.
- **What:** Any AI tool that generates text, code, images, or summaries. That includes chat tools (ChatGPT, Claude, Gemini), coding tools (GitHub Copilot, Cursor), AI features built into other apps (for example Notion AI), and browser extensions.
- **When:** Any time you use company data or customer data in an AI tool. This applies on a work laptop, a personal laptop, or your phone.

### Definitions

**Approved AI tools.** These four, used through the company account only:

| Tool | Approved version |
|---|---|
| Claude | Relaymint's **Claude Team** plan |
| ChatGPT | Relaymint's **ChatGPT Enterprise** workspace |
| GitHub Copilot | **Copilot Business**, under Relaymint's organization |
| Cursor | **Cursor Business**, with **privacy mode on** |

Everything else is **not approved**. That includes free or personal accounts of the tools above, browser extensions, Gemini (consumer), and Notion AI [ASSUMPTION: pending owner confirmation, see question 2].

**Patient data.** Any information about a clinic's patients. For example: patient names, phone numbers, appointment reasons, and treatment notes. [TBD: confirm whether other items also count, e.g. dates of birth, patient ID numbers, appointment dates/times tied to a person, photos, insurance details.] **If you are not sure whether something is patient data, treat it as patient data.**

**Clinic business data.** Information about the clinic as our customer, not about its patients. For example: the clinic's name, clinic staff email addresses, the clinic's billing plan, and support-ticket text **after all patient details have been removed**.

**Secrets.** Production credentials (passwords, tokens), API keys, and database dumps (full or partial exports of our databases).

**Customer-facing reply.** Any message that goes to someone outside Relaymint: support ticket replies, sales emails, chat messages, and similar.

### The rules

**Rule 1: Use only approved tools for company data.**
Only the four approved tools may be used with any company data. Log in with your company account, not a personal one. If a tool is not on the list, do not put company data into it, even a little.

- *Easy to get wrong:* The **free** version of ChatGPT or Claude is **not** approved. Only the company Enterprise/Team workspace is. Check which account you are logged into before you paste.
- *Easy to get wrong:* An AI feature inside another app (a browser extension, a writing helper, Notion AI) is a separate tool. It is not approved unless it is on the list.

**Rule 2: Never put patient data into any AI tool. Not even an approved one.**
Patient names, phone numbers, appointment reasons, and treatment notes must never go into an AI tool. This includes approved tools. There are no exceptions to this rule [ASSUMPTION: see question 1].

- *Easy to get wrong:* **Screenshots count.** A screenshot of a clinic's appointment calendar or a ticket that shows a patient's name is patient data.
- *Easy to get wrong:* **Attachments and forwarded threads count.** A ticket may quote the clinic's original email, which may include a patient's name further down. Check the whole text, not just the top.
- *Easy to get wrong:* **A first name alone still counts.** "Mrs. Tanaka's 3pm cleaning was double-booked" contains patient data (a name and an appointment reason).

**Rule 3: Clinic business data may go only into approved tools.**
You may use clinic names, clinic staff emails, billing plans, and ticket text with patient details removed, but only in an approved tool.

- *How to remove patient details:* Delete or replace every patient name, phone number, appointment reason, and treatment note before you paste. Replace them with neutral placeholders like "[patient]" or "[phone]". [TBD: confirm whether this is the required method, or whether there is a tool or template for it.]
- *Easy to get wrong:* A clinic **staff** member's name and email are clinic business data. A **patient's** name is patient data. If the person is being discussed as someone who books or receives treatment, treat them as a patient.

**Rule 4: Never put secrets into any AI tool.**
Production credentials, API keys, and database dumps must never go into any AI tool, approved or not. This includes the coding tools.

- *Easy to get wrong:* **Config files and logs.** An `.env` file, a config file, or a log excerpt may contain a key or token. Remove it before you paste or before you let a coding tool read the file.
- *Easy to get wrong:* **Small database samples count.** A few rows exported from production are a database dump, and they probably contain patient data too.

**Rule 5: A human reviews every AI-written reply before it goes to a customer.**
If an AI tool wrote or rewrote any part of a customer-facing reply, a person must read and approve it before it is sent.

- *What "review" means:* Read the full message. Check that the facts are correct (dates, prices, features, what we can and can't do), and that the tone fits. You are responsible for what you send, as if you wrote it yourself.
- *Easy to get wrong:* This applies to **every** reply, including short or routine ones, and including translations (for example, Korean to Japanese).
- [TBD: confirm whether the sender can be the reviewer, or whether a second person must review.]

**Rule 6: AI-generated code goes through normal PR review.**
Code written with Copilot or Cursor follows our normal pull request review. There is no extra rule. Rules 2 and 4 still apply: do not paste patient data or secrets into the tool while coding.

### Allowed / Not allowed at a glance

| Data | Approved tools | Any other tool |
|---|---|---|
| Patient data | ❌ Never | ❌ Never |
| Secrets (credentials, API keys, DB dumps) | ❌ Never | ❌ Never |
| Clinic business data | ✅ Yes | ❌ No |
| Other company data | ✅ Yes | ❌ No |

### Exceptions

- **Who approves:** Only the Security lead, **Minji Park**.
- **How to ask:** Post in the **#security-requests** Slack channel. Name the specific tool and the specific dataset, and say why you need it.
- **What counts as approval:** A written approval in #security-requests. A verbal "OK", a DM, or a thumbs-up emoji is not enough [ASSUMPTION: "in writing via #security-requests" means a written reply in that channel].
- **How long:** Up to **90 days**. The approval must say the end date. When it ends, stop. To continue, ask again.
- **What an exception covers:** Only the tool and dataset named. It does not cover other tools, other data, or other people [ASSUMPTION: confirm whether an exception covers only the requester or a whole team].
- **What an exception can't cover:** Patient data (Rule 2) and secrets (Rule 4) [ASSUMPTION: see question 1].
- [TBD: who approves when Minji Park is unavailable.]

### Reporting a problem

If you think data went somewhere it shouldn't (for example, you pasted patient data into an AI tool, or used a personal account by mistake):

1. **Stop.** Don't paste anything more.
2. **Email security@relaymint.io within 24 hours** of noticing. Say what data, which tool, which account, and when.
3. The Security lead decides whether it is a reportable incident. You don't need to decide that yourself.
4. [TBD: whether to delete the chat/conversation, or keep it so Security can review it.]

Report even if you are not sure it was a problem. Reporting quickly will not count against you [TBD: owner to confirm this statement].

### Enforcement

- **First violation:** Retraining. [TBD: what the retraining is and who runs it.]
- **Repeated or willful violations:** HR process.
- [TBD: how this applies to contractors, who are not in the employee HR process.]

---

## 2. Examples

### Customer Support

**Allowed:** A clinic emails: "Our staff can't see tomorrow's schedule after the update." No patient details. You paste it into **Claude Team** and ask for a draft reply in Japanese. You read the draft, fix a wrong menu name, and send it.
*Why:* Clinic business data, approved tool, human reviewed.

**Allowed:** A ticket says: "Patient Kim Soo-jin (010-1234-5678) was booked for a root canal twice." You rewrite it as "A [patient] was booked for [appointment] twice", then paste that into **ChatGPT Enterprise** to help figure out the cause.
*Why:* Patient details were removed before pasting.

**Not allowed:** Pasting that same ticket **as it was**, with the name, phone number, and "root canal", into ChatGPT Enterprise to summarize it.
*Why:* Patient data. Rule 2 applies even to approved tools.

**Not allowed:** Taking a screenshot of a clinic's booking screen, with patient names on it, and uploading it to Claude to ask "why is this showing twice?"
*Why:* A screenshot showing patient names is patient data.

**Not allowed:** Using a free ChatGPT account, or a grammar/translation browser extension, to polish a reply to a clinic, even with no patient details.
*Why:* Not an approved tool. Rule 1 covers all company data.

**Not allowed:** Letting Claude draft a reply and sending it without reading it because "it's just a standard answer."
*Why:* Rule 5: every customer-facing reply is reviewed by a human.

### Sales

**Allowed:** Using **Claude Team** to draft a follow-up email to a clinic's office manager. You include the clinic's name, the manager's email, and their current billing plan. You review and edit it before sending.
*Why:* Clinic business data, approved tool, human reviewed.

**Allowed:** Asking **ChatGPT Enterprise** to write a general outreach email about our Japan launch, with no customer data.
*Why:* Company data in an approved tool.

**Not allowed:** Pasting a clinic's email into Gemini (consumer) to write a reply.
*Why:* Gemini consumer is not approved for any company data.

**Not allowed:** Writing a case-study email that says "Dr. Lee's clinic cut no-shows for patients like Park Ji-hoon by 30%", with a real patient name, and asking an AI tool to polish it.
*Why:* A patient's name is patient data. It must not go into an AI tool, and shouldn't be in a sales email either.

### Engineering

**Allowed:** Using **Cursor Business (privacy mode on)** to write a function, then opening a normal PR.
*Why:* Approved tool, normal review (Rule 6).

**Not allowed:** Pasting a production error log that contains an API key or a patient's phone number into **Copilot Chat** to debug it.
*Why:* Secrets and patient data are never allowed. Remove them first.

**Not allowed:** Using Cursor with **privacy mode off**, or on a personal Cursor account.
*Why:* Only Cursor Business with privacy mode on is approved.

### Everyone (Marketing, Ops/Finance/HR)

**Not allowed:** Using **Notion AI** to summarize a Notion page with clinic billing details [ASSUMPTION: pending question 2].
*Why:* Notion AI is not on the approved list.

---

## 3. Owner notes (do not publish)

### Open questions
1. Can exceptions cover Rule 2 (patient data) or Rule 4 (secrets)? The rules and the exception process currently conflict. The draft says no.
2. Is Notion AI approved? If Relaymint uses Google Workspace, is Gemini inside Workspace treated differently from Gemini consumer? The draft treats both as not approved.
3. Policy owner, effective date, and review date.
4. Is the patient-data list (names, phone numbers, appointment reasons, treatment notes) complete, or only examples? Dates of birth, patient IDs, appointment times, and insurance details are not mentioned.
5. The request mentions Korea's PIPA. Clinics in Japan are also customers. Should Legal confirm whether anything needs to be said about Japan? The draft says nothing about Japanese law.
6. Does Rule 5 allow self-review, or does it need a second reviewer?
7. How do enforcement and retraining apply to contractors?
8. After an accidental paste, should the employee delete the conversation, or keep it for Security?
9. Who approves exceptions when Minji Park is unavailable?

### Assumptions in the draft
- Exceptions can't cover patient data or secrets.
- Notion AI and "AI features inside other apps" count as "everything else" under Rule 1, so they are not approved.
- Personal accounts of approved products (e.g. a personal Claude Pro account) are not approved; only the company plans are.
- "Within 24 hours" means within 24 hours of noticing.
- "In writing via #security-requests" means a written approval in that channel.
- An exception covers only the named tool and dataset.
- "If unsure, treat it as patient data" is a reading aid, not a new rule. Remove it if you don't want it.

### Review checklist before publishing
- [ ] Answer questions 1-3 above and remove the matching [ASSUMPTION] tags.
- [ ] Fill every [TBD] (owner, dates, question channel, retraining, contractors, backup approver, delete-or-keep).
- [ ] Confirm the approved tool list and versions with the CTO (plan names, Cursor privacy mode setting).
- [ ] Confirm the patient-data definition with Legal.
- [ ] Check that the examples match how Support and Sales actually work (ask one support agent and one sales rep to read it).
- [ ] Confirm the line "reporting quickly will not count against you" is something you want to promise.
- [ ] Decide whether you need a Korean and/or Japanese version for staff.
- [ ] Get Legal and CTO sign-off on the final text. (This draft has not been reviewed by Legal.)
- [ ] Plan how you'll announce it and whether employees need to acknowledge it.

### Optional additions
- Korean/Japanese translations of the policy for non-English readers.
- A one-page "before you paste" checklist pinned in Support's Slack channel.
- An employee acknowledgment step (read-and-confirm in Notion or HR system).
- A process for requesting a new tool to be added to the approved list.
- Onboarding: add this policy to new-hire and contractor onboarding.
