Before you publish, three questions. The draft below works either way, but these answers change what people are allowed to do:

1. **Can the 90-day exception cover Rules 2 and 4?** Your rules say patient data and credentials must "never" go into any AI tool. But the exception process covers "a specific tool + dataset". Can Minji approve an exception for patient data or credentials, or can exceptions only cover tools and clinic business data? The draft assumes exceptions **cannot** override Rules 2 and 4. This is marked [ASSUMPTION].
2. **What is the status of Notion AI (and Gemini inside Google Workspace, if you use it)?** Notion AI is named in the topic but is not on the approved list. So under Rule 1, it is not approved for company data. You are also publishing this policy in Notion, where Notion AI may be one click away. Is Notion AI turned off in your workspace, or should it be added to the approved list?
3. **Who does the "human review" in Rule 5?** Can the agent who sends the reply review it themselves, or does it need a second person? The draft assumes the sender's own careful review counts. This is marked [ASSUMPTION].

---

# 1. The policy (ready to paste)

## Using AI Tools with Customer Data

**Owner:** [TBD: policy owner name and role]
**Effective date:** [TBD: date]
**Last reviewed:** [TBD: date]
**Applies to:** All Relaymint employees and contractors

### Purpose

AI tools help us work faster. But our customers are dental clinics, and their data includes information about their patients. We have promised those clinics that we will protect it.

This policy tells you which AI tools you can use, what data you can put into them, and what to do if something goes wrong.

The rules in this policy were agreed with Legal and the CTO.

### Scope

This policy covers:

- **Who:** Everyone who works for Relaymint. This includes full-time staff, part-time staff, and contractors, in every team (Engineering, Customer Support, Sales, Marketing, Ops/Finance/HR).
- **What tools:** Any generative AI tool. This means any tool that writes, summarizes, translates, or generates text, code, or images for you. Examples: ChatGPT, Claude, Gemini, GitHub Copilot, Cursor, Notion AI, AI browser extensions, and AI features built into other apps.
- **What data:** Any Relaymint company data, and especially any data that comes from our clinic customers.

If you are not sure whether something counts as an AI tool, treat it as one and ask [TBD: contact or channel for questions].

### Definitions

**Approved AI tool**
An AI tool that Relaymint has signed a contract for and set up for company use. There are only four:

| Tool | What it's for | Condition |
|---|---|---|
| Claude (Team plan) | Writing, summarizing, translating | Only through your Relaymint company account |
| ChatGPT Enterprise | Writing, summarizing, translating | Only through your Relaymint company account |
| GitHub Copilot Business | Writing code | Only through the Relaymint organization license |
| Cursor Business | Writing code | Only through the Relaymint license, with **privacy mode on** |

Claude Team and ChatGPT Enterprise are covered by signed data processing agreements, and we have confirmed that our data is not used to train their models.

**Not approved AI tool**
Everything else. This includes:
- Free or personal accounts of any tool, even an approved one (for example, your personal ChatGPT Plus account or a free Claude account).
- AI browser extensions (for example, "summarize this page" or "write my email" extensions).
- Gemini consumer (the free or personal Gemini app).
- Notion AI [TBD: confirm status. See owner notes.]
- Any AI tool not in the table above.

**Patient data**
Any information about a clinic's patients. This includes:
- Patient names (full name, first name only, or initials that identify someone)
- Patient phone numbers
- Appointment reasons (for example, "root canal", "implant consultation")
- Treatment notes

If a piece of information is about a specific patient, treat it as patient data.

**Clinic business data**
Information about the clinic as a business, not about its patients. This includes:
- Clinic name
- Clinic staff email addresses
- The clinic's billing plan
- Support ticket text **after all patient data has been removed**

**Secrets**
- Production credentials (passwords, login details for production systems)
- API keys and tokens
- Database dumps or exports

**Paste into an AI tool**
Any way of giving data to an AI tool. This includes typing, copy-pasting, uploading a file or screenshot, sharing a document or link the tool can read, or letting a coding tool read a file from your computer. [ASSUMPTION: uploads, screenshots, and files read by coding tools count the same as pasting.]

### What is allowed

- Using an **approved tool** through your **company account** for your work.
- Putting **clinic business data** into an **approved tool**. For example: clinic name, clinic staff emails, billing plan, and ticket text with all patient data removed.
- Using an approved tool to draft a customer reply, **as long as a human reviews it before it is sent** (see Rule 5).
- Using GitHub Copilot Business or Cursor Business (privacy mode on) to write code. That code goes through normal pull request review, the same as any other code.
- Putting general, non-company information into any tool. For example: "How do I write a polite follow-up email in Japanese?"

### What is not allowed

**Rule 1: Only approved tools for company data.**
Do not put any company data into a tool that is not approved. This includes clinic business data, internal documents, and code.

**Rule 2: Never put patient data into any AI tool.**
This applies to **every** AI tool, including approved ones. There are no exceptions. [ASSUMPTION: see owner notes.]
Patient data is covered by our contracts with clinics and by Korea's Personal Information Protection Act (PIPA).

**Rule 3: Clinic business data only goes into approved tools.**
Before you paste a support ticket, remove **all** patient data from it first. If you cannot remove it all, do not paste the ticket.

**Rule 4: Never put secrets into any AI tool.**
This applies to every AI tool, including approved ones. No production credentials, API keys, or database dumps. There are no exceptions. [ASSUMPTION: see owner notes.]

**Rule 5: A human reviews every AI-written customer reply before it is sent.**
If an AI tool wrote or rewrote any part of a message to a customer, a human must read the whole message before it is sent. Check that it is correct, that it makes no promises we can't keep, and that it contains no patient data.
[ASSUMPTION: the person sending the reply can be the reviewer. TBD: confirm.]

**Rule 6: AI-written code follows normal PR review.**
There is no extra rule for code from Copilot or Cursor. It goes through the same pull request review as any other code.

### How to remove patient data from a ticket

Before you paste ticket text into an approved tool:

1. Delete every patient name, phone number, appointment reason, and treatment note.
2. Replace them with neutral placeholders, like `[PATIENT]`, `[PHONE]`, `[REASON]`.
3. Check attachments and screenshots. Do not upload them if they show patient data.
4. Check quoted email history at the bottom of the ticket. It often contains patient details.
5. If you are not sure whether something is patient data, remove it.

### Exceptions

If you need to use a tool or dataset in a way this policy does not allow:

- **Who approves:** Minji Park, Security Lead.
- **How to ask:** Post your request in the **#security-requests** Slack channel. Say which tool, which data, why you need it, and for how long.
- **What counts as approval:** Only a written approval from Minji in #security-requests. A verbal "yes", a DM, or a manager's approval is not enough.
- **How long:** Each exception is for one specific tool and one specific dataset. It lasts for a set time, up to **90 days** at most. After it ends, you must ask again.
- **What cannot be approved:** [ASSUMPTION] Exceptions cannot allow patient data (Rule 2) or secrets (Rule 4) in any AI tool.

Until you have written approval, the normal rules apply.

### How to report a problem

If you think data went somewhere it should not have (for example, you pasted patient data into ChatGPT, or used a personal account with clinic data):

1. **Stop.** Do not paste anything more.
2. **Email security@relaymint.io within 24 hours.** Say what data, which tool, which account, and when.
3. **Do not try to fix it quietly.** Do not just delete the chat and move on. Deleting the chat may be the right step later, but report first. [TBD: whether to delete the conversation before or after reporting]
4. The Security Lead decides whether it is a reportable incident. That is not your decision.

Report even if you are not sure it was a problem. Reporting quickly will not count against you. [TBD: confirm that the company wants to say this]

If you see a colleague do something that may break this policy, you can also email security@relaymint.io.

### Enforcement

- **First violation:** Retraining. [TBD: what retraining consists of and who runs it]
- **Repeated or willful violations:** HR process.

"Willful" means you knew the rule and broke it anyway. [ASSUMPTION: definition of "willful". Confirm with HR.]

### Common edge cases

| Situation | What to do |
|---|---|
| A ticket mentions a patient only by first name. | That is still patient data. Remove it before pasting. |
| A ticket says "the 3pm implant appointment didn't sync" with no name. | The appointment reason ("implant") is patient data. Remove it: "the 3pm `[REASON]` appointment didn't sync." |
| You want to paste a screenshot of the clinic's calendar. | Don't, if any patient names, phone numbers, or reasons are visible. Describe the issue in text instead. |
| You have a personal ChatGPT Plus account that's "better". | Not approved. Use your company ChatGPT Enterprise or Claude Team account. |
| An approved tool is open in a browser tab, but you're not sure if it's your company or personal login. | Check the account before pasting anything. If in doubt, log out and log in with your company account. |
| A browser extension offers to "summarize this ticket". | Not approved. Don't use it on any company page. |
| You're an engineer and a repo contains a `.env` file or a test database export. | Don't let Copilot or Cursor read those files into chat or context. [ASSUMPTION: see definition of "paste"] |
| You need to debug with real production data. | Don't use AI for it. Use it only with fake or fully cleaned data. |
| A clinic asks you to use AI on their patient data "because they don't mind". | Still not allowed. Rule 2 has no exceptions. |
| Your manager says "it's fine, just use it". | Only Minji Park's written approval in #security-requests counts as an exception. |

---

# 2. Examples: allowed vs. not allowed

### Support tickets

**Allowed (approved tool, patient data removed)**

> Pasted into Claude Team:
> "Clinic: Sakura Dental Shibuya. Staff contact: reception@sakura-dental.jp. Plan: Pro. Ticket: 'Reminder SMS for `[PATIENT]` didn't send for the `[REASON]` appointment on the 14th. Other reminders worked.' Draft a polite reply in Japanese explaining we're investigating."

Why it's allowed: approved tool, only clinic business data, and patient details replaced with placeholders. The agent then reads and edits the draft before sending it (Rule 5).

**Not allowed (patient data, even in an approved tool)**

> Pasted into ChatGPT Enterprise:
> "Reminder SMS for Kim Soo-jin (010-1234-5678) didn't send for her root canal follow-up on the 14th."

Why not: patient name, phone number, and appointment reason. Rule 2 applies to every tool, approved or not.

**Not allowed (approved-looking tool, wrong account)**

> Pasted into a personal free Claude account:
> "Clinic: Hanbit Dental Gangnam, plan: Basic. Ticket: 'Calendar export fails for `[PATIENT]`.'"

Why not: the data is fine, but the account is personal and not approved (Rule 1).

**Not allowed (reply sent without review)**

> An agent pastes an AI-drafted reply straight into the ticket and clicks Send without reading it.

Why not: every AI-written customer reply must be reviewed by a human before sending (Rule 5).

**Not allowed (screenshot)**

> Uploading a screenshot of a clinic's daily schedule to ChatGPT Enterprise to ask "why is this slot double-booked?"

Why not: the screenshot shows patient names and appointment reasons. Describe the problem in text with placeholders instead.

### Sales emails

**Allowed**

> Pasted into ChatGPT Enterprise:
> "Write a follow-up email to Dr. Tanaka's office manager (office@tanaka-shika.jp) at Tanaka Dental. They're on a trial and asked about upgrading to the Pro plan. Keep it short and in Japanese."

Why it's allowed: approved tool, clinic business data only (clinic name, staff email, billing plan). A human reviews the email before sending it (Rule 5).
[ASSUMPTION: prospects and trial clinics count as "clinic business data" the same way as paying clinics.]

**Not allowed**

> Pasted into Gemini (personal account):
> "Write a follow-up email to Tanaka Dental about upgrading to Pro."

Why not: even though the data is clinic business data, Gemini consumer is not approved (Rule 1).

**Not allowed**

> Pasted into Claude Team:
> "Tanaka Dental said their no-show rate is high. Their patient Sato Kenji missed three implant appointments. Use that as an example in the pitch."

Why not: patient name and appointment reason (Rule 2).

**Allowed (general, no company data)**

> Any tool: "What's a polite way to say 'following up on my last email' in Korean business writing?"

Why it's allowed: no company data at all.

### Engineering

**Allowed**

> Using Cursor Business (privacy mode on) to refactor the reminder-scheduling service, then opening a normal PR.

**Not allowed**

> Pasting a production API key into Copilot Chat to ask why an API call fails.

Why not: secrets never go into any AI tool (Rule 4). Replace the key with `[API_KEY]`.

**Not allowed**

> Pasting rows from a production database dump into Claude Team to debug a query.

Why not: database dumps are secrets (Rule 4), and they likely contain patient data (Rule 2).

---

# 3. Owner notes (do not publish)

### Open questions

1. **Can exceptions override Rules 2 and 4?** The draft says no. If Minji can approve exceptions for patient data or secrets, the "no exceptions" wording in Rules 2 and 4 and the edge case table must change.
2. **Notion AI.** It's in the topic list but not approved. Is it disabled in the workspace? If not, people will likely use it on Notion pages that contain clinic data. Decide: approve it (with a contract check), or turn it off.
3. **Gemini in Google Workspace.** Only "Gemini consumer" is named as not approved. If you use Google Workspace with Gemini, say explicitly whether it is approved. The draft treats it as not approved because it is not on the approved list.
4. **Who reviews AI-written customer replies?** The sender, or a second person?
5. **What is retraining?** Who runs it, what format, and how is it recorded?
6. **"Willful" definition.** Confirm with HR.
7. **Should the chat be deleted after a suspected leak?** Before or after reporting?
8. **"Reporting won't count against you."** Confirm the company wants to promise this. Remove it if not.
9. **Question channel.** Where do people ask "is this allowed?" (for example, #security-requests or a different channel)?
10. **Prospect data.** Confirm that data from prospect and trial clinics is treated as clinic business data.

### Assumptions in the draft (marked [ASSUMPTION])

- Exceptions cannot allow patient data or secrets.
- "Paste" includes uploads, screenshots, and files read by coding tools.
- The sender can be the Rule 5 reviewer.
- Prospect and trial clinics count as clinic business data.
- Definition of "willful".

### Conflicts to resolve

- **Rule 2 "never" vs. exception process "specific tool + dataset".** These overlap unless you decide exceptions cannot cover patient data (question 1).
- **Notion AI named in scope vs. not approved vs. policy hosted in Notion** (question 2).

### What the owner must confirm before publishing

- [ ] Policy owner name and role are filled in.
- [ ] Effective date and review date are set.
- [ ] Questions 1 to 10 above are answered, and every [TBD] and [ASSUMPTION] is resolved or removed.
- [ ] The approved tools table matches what is actually licensed (plan names, company accounts, Cursor privacy mode enforced at org level).
- [ ] Minji Park has confirmed she is the exception approver and #security-requests is the right channel.
- [ ] security@relaymint.io is monitored and someone receives it within 24 hours, including weekends.
- [ ] HR has confirmed the enforcement wording.
- [ ] Legal has reviewed the final text. This draft states that the rules were agreed with Legal and the CTO, because you said so. It does not state that the policy complies with PIPA or any other law. That judgment stays with Legal.
- [ ] Japan: your clinics are in Korea and Japan, but only PIPA is named. Ask Legal whether Japan's rules need to be mentioned. The draft does not add anything for Japan.
- [ ] A Japanese and/or Korean version is needed if some staff or contractors don't read English well. [TBD: languages to publish in]
- [ ] Support team leads have read the ticket examples and confirmed they match real tickets.

### Optional additions

- A one-page "cheat sheet" for support agents to pin in Slack.
- A short quiz as part of onboarding and retraining.
- A `.cursorignore` / Copilot content exclusion standard for repos with secrets or fixtures.
- A log of active exceptions with their end dates.
