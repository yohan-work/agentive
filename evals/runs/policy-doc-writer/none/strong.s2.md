Here's a draft ready to paste into Notion. I've kept the rules exactly as you agreed them with Legal and the CTO. Where I had to make a drafting choice or found a gap, I've marked it **[CONFIRM]** and listed it again at the end so the policy owner can settle it before publishing.

---

# Using AI Tools with Company and Customer Data

| | |
|---|---|
| **Policy owner** | Security Lead (Minji Park) |
| **Approved by** | Legal, CTO |
| **Applies to** | All Relaymint employees and contractors |
| **Effective date** | [date] |
| **Next review** | [date + 6 months] **[CONFIRM review cadence]** |
| **Questions** | #security-requests on Slack |

## 1. Why this policy exists

AI tools help us answer tickets faster, write better emails, and ship code more quickly. We want you to use them.

But our customers are dental clinics, and their data includes information about **their patients**. Our contracts with clinics and Korea's Personal Information Protection Act (PIPA) mean we have to be very careful with that information. **[CONFIRM: Legal to decide whether to also name Japan's APPI, since we serve clinics in Japan.]** When you paste something into an AI tool, it leaves our systems. With some tools it may be stored or used to train models.

This policy tells you which tools you can use and what you can put into them.

## 2. The short version

If you only remember five things:

1. **Only use approved tools with company data:** Claude (Team), ChatGPT (Enterprise), GitHub Copilot (Business), and Cursor (Business, privacy mode on). Always use your **company account**.
2. **Never put patient information into any AI tool.** Not even an approved one. This includes names, phone numbers, appointment reasons, and treatment notes.
3. **Never put passwords, API keys, credentials, or database dumps into any AI tool.**
4. **A human reviews every AI-written message before it goes to a customer.**
5. **If something goes wrong, email security@relaymint.io within 24 hours.** Reporting quickly is always the right move.

## 3. Definitions

**AI tool**: Any product that generates text, code, images, or summaries from what you type or upload. This includes chatbots, coding assistants, AI features built into other apps (like Notion AI), and browser extensions.

**Approved AI tool**: One of the four tools listed in Section 4, used through a Relaymint company account. The same product used through a personal or free account is **not** approved.

**Putting data into an AI tool**: Any way that data reaches the tool: typing, pasting, uploading a file, sharing a screenshot, connecting a document or folder, or letting a coding assistant read files in your project.

**Patient data**: Any information about a clinic's patients. Examples:
- names (including partial names or initials together with other details)
- phone numbers, email addresses, dates of birth
- appointment reasons, appointment times linked to a person
- treatment notes, dental history, or anything medical
- any detail that could identify a specific patient

Patient data is the most sensitive data we handle. **It never goes into any AI tool.**

**Clinic business data**: Information about the clinic as our customer, not about its patients. Examples:
- clinic name and address
- clinic staff names and work email addresses
- billing plan, invoices, contract terms
- support ticket text **after** all patient data has been removed

Clinic business data may go into **approved tools only**.

**Secrets**: Production credentials, passwords, API keys, access tokens, private keys, connection strings, and database dumps or exports (full or partial). **Secrets never go into any AI tool.**

**Customer-facing content**: Anything a clinic or a patient will read: support replies, sales emails, help center articles, in-app messages, marketing copy sent to a customer.

## 4. Approved tools

| Tool | Approved version | Who typically uses it | Notes |
|---|---|---|---|
| Claude | **Team plan**, company account | Everyone | Signed DPA, no training on our data |
| ChatGPT | **Enterprise**, company account | Everyone | Signed DPA, no training on our data |
| GitHub Copilot | **Business**, company account | Engineering | Normal PR review applies |
| Cursor | **Business**, with **privacy mode on** | Engineering | Check privacy mode is on before use |

**Not approved for any company data:**
- Free or personal accounts of any AI tool, including personal ChatGPT, Claude, or Cursor accounts
- Gemini (consumer version)
- AI browser extensions (for example, "summarize this page" or "write my email" extensions)
- Notion AI **[CONFIRM: Notion AI was listed in the policy topic but not in the approved list, so as written it is not approved. If Legal and the CTO intend to approve it, add it to the table above with its plan and DPA status.]**
- Any other AI tool not listed in the table above

"Not approved" means you can't use it with **any** company data, including data that seems harmless, like internal docs or clinic names. You can still use these tools for things with no company data at all, like general questions or learning a topic. **[CONFIRM that this is the intended reading.]**

**Want a new tool approved?** Ask in #security-requests. Don't start using it while you wait.

## 5. The rules

### Rule 1: Use only approved tools for company data
Company data (anything that isn't public) may only go into the approved tools in Section 4, using your company account.

### Rule 2: Patient data never goes into any AI tool
This applies to **every** AI tool, approved or not. There are no exceptions under this policy.

Before you paste anything from a clinic account, a ticket, a screenshot, or a log, **remove all patient data first**. If you aren't sure whether something is patient data, treat it as patient data.

### Rule 3: Clinic business data goes into approved tools only
You may use clinic business data, including ticket text with patient details removed, in approved tools. You may not use it in unapproved tools.

### Rule 4: Secrets never go into any AI tool
Never paste, upload, or expose production credentials, API keys, tokens, or database dumps to any AI tool, approved or not.

**For engineers:** Coding assistants can read files in your project. Make sure files containing secrets (for example, `.env` files or local config with credentials) aren't open or included in the context you share. **[CONFIRM with CTO: whether to require ignore files such as `.cursorignore` or Copilot content exclusions for secret files.]**

### Rule 5: A human reviews AI-written customer-facing content before it's sent
If an AI tool drafted or rewrote something a customer will read, a person must read it fully and take responsibility for it before sending. Check that it is accurate, that it doesn't promise anything we can't deliver, and that it's in the right tone and language (Korean, Japanese, or English).

### Rule 6: AI-generated code follows normal code review
Code written with Copilot or Cursor goes through our normal pull request review. There are no extra rules. Rules 2 and 4 still apply to what you share with the tool.

## 6. Examples

### Customer Support

**Allowed** (in Claude Team or ChatGPT Enterprise):

> Rewrite this reply to be friendlier and translate it into Japanese:
> "Hi Sakura Dental team, the reminder SMS failed because the clinic's SMS sender number wasn't verified. Please go to Settings → Notifications and re-verify it."

Why it's OK: clinic name and product details only, no patient information, approved tool. A human still reviews the final reply before sending (Rule 5).

> Summarize this ticket thread and suggest next steps. [Ticket text in which every patient name, phone number, and appointment detail was replaced with [PATIENT], [PHONE], [REASON]]

Why it's OK: patient data was removed before pasting, approved tool.

**Not allowed:**

> Why didn't this patient get their reminder? Patient: Kim Ji-won, 010-1234-5678, appointment 3/14 10:00 for root canal follow-up.

Why not: patient name, phone number, and appointment reason. This is patient data. It's not allowed in **any** AI tool, including approved ones.

> [Screenshot of the clinic's appointment calendar showing patient names] "What's wrong with this schedule view?"

Why not: screenshots count. Crop or blur all patient information first, or describe the problem in words.

> [Pasting a ticket into a free ChatGPT account or an AI browser extension]

Why not: unapproved tool, even if patient data was removed.

> Letting the AI draft a reply and sending it straight to the clinic without reading it.

Why not: Rule 5. A person reviews every customer-facing message.

**How to remove patient data from a ticket:**
1. Replace names with `[PATIENT]`.
2. Replace phone numbers, emails, and dates of birth with `[PHONE]`, `[EMAIL]`, `[DOB]`.
3. Replace appointment reasons and treatment details with `[REASON]` or a generic description ("a follow-up visit").
4. Check attachments and screenshots too.
5. Reread once before pasting. If anything could point to a specific patient, remove it.

### Sales

**Allowed** (in Claude Team or ChatGPT Enterprise):

> Draft a follow-up email to Dr. Tanaka at Minato Smile Clinic. They're on our Basic plan, have 3 chairs, and asked about upgrading to Pro for multi-location support.

Why it's OK: clinic business data (clinic name, staff name, plan) in an approved tool. You review and edit before sending.

> Here are my notes from a demo call with Seoul Bright Dental. Turn them into a summary and a list of next steps.

Why it's OK, **as long as** the notes contain no patient details. Sometimes clinics mention specific patients as examples during calls; remove those first.

**Not allowed:**

> Here's the export of Seoul Bright Dental's appointment list from their trial. Analyze no-show rates to use in my pitch.

Why not: an appointment export contains patient data. Ask Engineering or Data for aggregate numbers (for example, "no-show rate: 12%") that contain no patient information.

> Using a personal ChatGPT account or a Gemini consumer account to write a prospect email.

Why not: unapproved tool. Clinic names and contacts are company data.

### Engineering

**Allowed:** Using Copilot or Cursor (privacy mode on) on the codebase, with normal PR review. Asking Claude or ChatGPT to explain an error message after removing secrets and patient data.

**Not allowed:** Pasting a production database row, log line, or query result that contains patient data. Pasting a `.env` file, API key, or connection string, even to ask "why isn't this working?" Replace it with a placeholder like `API_KEY=xxxx`.

### Marketing, Ops, Finance, HR

**Allowed:** Drafting blog posts, campaign copy, and internal docs in approved tools. Summarizing clinic-level billing data in approved tools.

**Not allowed:** Using unapproved tools with any company data. Putting patient data from any source into any AI tool. **[CONFIRM: employee personal data (HR records, payroll) is not covered by the agreed rules. Decide whether to treat it like patient data, like clinic business data, or in a separate policy.]**

## 7. Exceptions

Sometimes there's a good reason to use a tool or dataset that this policy doesn't allow.

- Only the **Security Lead (Minji Park)** can approve an exception.
- Request it **in writing in #security-requests**. Include: the specific tool, the specific dataset, why you need it, and how long.
- Exceptions cover **one tool and one dataset** and last **up to 90 days**. After that, you need a new request.
- No exception is valid unless it was approved in writing in #security-requests.

**[CONFIRM with Legal: whether exceptions can ever cover patient data. Rule 2 says "never," so this draft assumes exceptions cannot override Rule 2 or Rule 4. If that's wrong, change this section and Rule 2.]**

## 8. If something goes wrong

If you think data went somewhere it shouldn't have (for example, you pasted patient data into a tool, used a personal account by mistake, or saw a colleague do so):

1. **Stop.** Don't paste anything else.
2. **Email security@relaymint.io within 24 hours.** Say what data, which tool, and when. Don't copy the sensitive data itself into the email.
3. If the tool lets you, delete the conversation, but **report it anyway**.
4. The Security Lead decides whether it's a reportable incident and what happens next.

Reporting a mistake quickly helps us protect our customers and meet our legal obligations. We'd much rather hear about it early.

## 9. Enforcement

- **First violation:** retraining on this policy.
- **Repeated or willful violations:** handled through the HR process.

**[CONFIRM with HR/Legal: whether contractors follow the same steps or their contract terms apply instead.]**

## 10. Quick decision guide

Before you put something into an AI tool, ask:

1. **Is this an approved tool, on my company account?** If not, don't use company data. Stop.
2. **Does it contain secrets** (passwords, keys, tokens, database dumps)? Remove them, or stop.
3. **Does it contain patient data** (names, phones, appointment reasons, treatment notes, screenshots showing them)? Remove it, or stop.
4. **Will a customer read the output?** Review it yourself before sending.
5. **Not sure?** Ask in #security-requests before you paste.

---

## Appendix: Review checklist for the policy owner

Use this before publishing and at each scheduled review.

**Before publishing**
- [ ] All **[CONFIRM]** items resolved and the markers removed (see list below)
- [ ] Legal and CTO have signed off on the final wording
- [ ] Effective date and next review date filled in
- [ ] Approved tools table matches what we actually pay for (plans, seat counts, DPA status)
- [ ] Privacy mode for Cursor Business is enforced at the org level, or there's a way to check it
- [ ] Training opt-out is confirmed in the admin settings for Claude Team and ChatGPT Enterprise
- [ ] Links work: #security-requests, security@relaymint.io
- [ ] Korean and Japanese translations prepared, if staff need them **[CONFIRM whether translations are needed]**
- [ ] Announced to all teams, with a short walkthrough for Customer Support (the most frequent users)
- [ ] Contractors notified and acknowledgment recorded

**At each review**
- [ ] Is the approved tools list still accurate? Any vendor contract, plan, or data-use term changes?
- [ ] Any new AI features added to tools we already use (Slack, Notion, Google Workspace, Zendesk or our helpdesk, Zoom, etc.) that people might be using without realizing?
- [ ] Review exceptions granted since last review: how many, for what, did any expire without renewal, and do any suggest a rule should change?
- [ ] Review incidents reported to security@relaymint.io: any patterns, any teams needing more training?
- [ ] Any changes to clinic contracts, PIPA (or APPI) guidance, or regulator expectations?
- [ ] Are the examples still realistic for Support and Sales? Ask a support agent and a salesperson.
- [ ] Is the policy still readable for non-engineers? Ask someone outside Engineering to read the short version.
- [ ] Update the "Next review" date and log what changed.

---

## Items to confirm before publishing

1. **Japan (APPI):** Legal to decide whether to name Japan's privacy law alongside PIPA, since you serve clinics in Japan.
2. **Notion AI:** It's in your topic list but not the approved list, so the draft treats it as not approved. If it should be approved, add it with plan and DPA details.
3. **Unapproved tools with no company data:** The draft allows unapproved tools for tasks with no company data at all (general questions, learning). Confirm that's intended, or make it stricter.
4. **Exceptions vs. Rules 2 and 4:** The draft assumes exceptions can't override "never" rules for patient data and secrets. Confirm with Legal.
5. **Secret files in coding tools:** Whether to require ignore files or content exclusions for `.env` and similar files.
6. **Employee personal data:** Not covered by the agreed rules; decide how to treat it.
7. **Contractors and enforcement:** Whether the same enforcement steps apply or contract terms take over.
8. **Review cadence and translations:** Six months is a placeholder, and I've assumed Korean and Japanese versions might be needed.
