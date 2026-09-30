Here's a draft ready to paste into Notion. I've kept to the rules you agreed with Legal and the CTO. Where the brief left something open, I added a short **[Decision needed]** note instead of making up a rule. Those notes are listed together at the end so the policy owner can resolve them before publishing.

---

# Generative AI Use Policy: Customer Data

| | |
|---|---|
| **Policy owner** | Security Lead (Minji Park) |
| **Approved by** | Legal, CTO |
| **Applies to** | All Relaymint employees and contractors |
| **Effective date** | [YYYY-MM-DD] |
| **Next review** | [Effective date + 6 months] |
| **Questions** | #security-requests on Slack |

## TL;DR (read this if nothing else)

1. **Only use approved AI tools for work:** Claude (Team plan), ChatGPT Enterprise, GitHub Copilot Business, and Cursor Business with privacy mode on. Nothing else, including personal accounts and browser extensions.
2. **Never paste patient data into any AI tool, approved or not.** That means patient names, phone numbers, appointment reasons, and treatment notes.
3. **Never paste passwords, API keys, production credentials, or database dumps into any AI tool.**
4. **A human must review every AI-drafted reply before it goes to a customer.**
5. **If you think something leaked, email security@relaymint.io within 24 hours.** Reporting quickly will not get you in trouble. Hiding a leak will.

---

## 1. Why this policy exists

Dental clinics trust us with their patients' information. Our contracts with clinics and Korea's Personal Information Protection Act (PIPA) limit what we can do with it. AI tools are useful and we want you to use them, but anything you paste into an AI tool leaves Relaymint's systems. This policy explains which tools are safe, what data can go into them, and what to do when you aren't sure.

## 2. Scope

This policy covers:
- **All people:** full-time and part-time employees, contractors, and interns in every team.
- **All generative AI tools:** chatbots (ChatGPT, Claude, Gemini, etc.), coding assistants (Copilot, Cursor), AI features built into other apps (for example Notion AI or AI features in email or browser extensions), and any similar tool you might start using.
- **All ways of sharing data:** typing, pasting, uploading files, screenshots, connecting the tool to a company system, or letting an extension read your screen or browser tabs.

## 3. Definitions

| Term | Meaning | Examples |
|---|---|---|
| **AI tool** | Any software that generates text, code, images, or summaries from your input. | ChatGPT, Claude, Gemini, Copilot, Cursor, Notion AI, AI browser extensions |
| **Approved AI tool** | An AI tool Relaymint has contracted for, with a data processing agreement (DPA) and settings that stop our data being used for training. Only company-provided accounts count. | See Section 4 |
| **Patient data** | Any information about a clinic's patients. This is the most sensitive data we handle. | Patient names, phone numbers, appointment reasons, treatment notes, and anything else that could identify a patient or reveal their health or treatment |
| **Clinic business data** | Information about our customers (the clinics) as businesses, with no patient information in it. | Clinic name, clinic staff names and emails, billing plan, contract details, support ticket text **after** patient details are removed |
| **Secrets** | Anything that grants access to our systems or bulk data. | Production passwords, API keys, tokens, `.env` files, private keys, database dumps or exports |
| **Remove patient details (redact)** | Deleting or replacing every piece of patient data before the text goes into an approved tool. | "Kim Soo-jin (010-1234-5678) wants to move her root canal" becomes "[Patient] wants to move [treatment] appointment" |
| **Customer-facing content** | Anything sent to or seen by a clinic or its patients. | Support replies, sales emails, in-app messages, help-center articles, SMS/notification templates |

> **Rule of thumb:** If it's about a *patient*, it never goes into AI. If it's about a *clinic*, it can go into an **approved** tool only. If it's a *secret*, it never goes into AI.

## 4. Approved tools

| Tool | Approved version | Use for | Notes |
|---|---|---|---|
| **Claude** | Claude Team plan (company account) | Writing, summarizing, analysis | DPA signed; training opt-out confirmed |
| **ChatGPT** | ChatGPT Enterprise (company account) | Writing, summarizing, analysis | DPA signed; training opt-out confirmed |
| **GitHub Copilot** | Copilot Business (company org) | Coding | Engineering |
| **Cursor** | Cursor Business with **privacy mode on** | Coding | Check privacy mode before every session in a new workspace |

**Not approved for any company data:**
- Free or personal accounts of any tool, **including personal ChatGPT, Claude, Copilot, or Cursor accounts**
- Gemini (consumer version)
- AI browser extensions (writing assistants, summarizers, meeting note-takers that run in the browser, etc.)
- Notion AI *[Decision needed, see end]*
- Any other AI tool not listed above

"Not approved" means **no** company data of any kind: no clinic data, no internal documents, no code, no Slack messages. If you'd like a tool added, ask in #security-requests.

## 5. The rules

### Rule 1: Use approved tools only
Company data may only go into the approved tools in Section 4, used through your company account.

### Rule 2: Never put patient data into any AI tool
This applies even to approved tools. There are no exceptions to this rule without written approval from the Security Lead (see Section 7). Patient data is covered by our clinic contracts and by PIPA.

If a ticket, screenshot, file, or email contains patient data, **remove all patient details first**, or don't use AI for that task.

### Rule 3: Clinic business data goes into approved tools only
Clinic names, clinic staff emails, billing plans, and ticket text with patient details removed are fine to use **in approved tools**.

### Rule 4: Never put secrets into any AI tool
No production credentials, API keys, tokens, or database dumps, in any tool, approved or not. This includes pasting error logs or config files that contain them. Remove secrets first.

### Rule 5: A human reviews every AI-drafted customer message
Before anything AI-drafted reaches a clinic or patient, the person sending it must:
- read the whole message;
- check facts, prices, dates, and feature claims against our real systems and docs;
- make sure it contains no patient data that wasn't already in the conversation, and nothing from another customer;
- take responsibility for it as if they'd written it themselves.

### Rule 6: AI-generated code follows normal PR review
Code written with Copilot or Cursor goes through the same pull request review as any other code. There are no extra rules, but Rules 2 and 4 still apply to what you paste into the prompt or let the tool read (for example, don't open a database dump or `.env` file in a Cursor session).

## 6. Examples: allowed vs. not allowed

### Customer Support

| ✅ Allowed | ❌ Not allowed |
|---|---|
| In **Claude Team**: "Summarize this ticket and suggest a reply: *Clinic 'Smile Dental Gangnam' reports that [patient] appointments booked via LINE aren't syncing to their calendar since yesterday.*" | Pasting the original ticket: "*Patient Tanaka Yuki (090-xxxx-xxxx) booked a cleaning at 3pm but it's not showing…*" into **any** AI tool, even Claude Team or ChatGPT Enterprise |
| In **ChatGPT Enterprise**: "Translate this reply into polite Japanese for a clinic manager," where the reply contains no patient details | Uploading a screenshot of the clinic's appointment calendar with patient names visible |
| Using AI to draft a reply, then reading, correcting, and sending it yourself | Sending an AI-drafted reply without reading it, or using an auto-send feature |
| Asking Claude Team to "explain how to reset a clinic user's password in plain Korean" | Pasting a clinic's CSV export of appointments to "find the duplicate bookings" |
| Asking about a billing issue: "Clinic X is on the Pro plan and was charged twice in August. Draft an apology and refund explanation." | Using a free Grammarly-style browser extension while typing in the support tool (it reads everything on the page, including patient details) |

**Support quick check before you paste:** Search the text for names, phone numbers, dates of birth, appointment reasons, and treatment words (cleaning, implant, root canal, orthodontics…) tied to a person. If you find any, remove them or replace them with `[Patient]`, `[phone]`, `[treatment]`.

### Sales

| ✅ Allowed | ❌ Not allowed |
|---|---|
| In **Claude Team**: "Draft a follow-up email to Dr. Sato at Sato Dental Osaka about our Pro plan, referencing our demo last Tuesday." | Using personal ChatGPT or Gemini to draft the same email (clinic name + contact = company data) |
| In **ChatGPT Enterprise**: "Summarize my call notes with Hana Clinic: 3 chairs, currently on paper booking, budget concern about the annual plan." | Pasting call notes that include "*their patient Mr. Lee complained about double-booking his implant surgery*" |
| Asking AI to write a comparison of our plans for a prospect, then checking every price and feature against the current price sheet | Sending AI-written claims ("integrates with all Japanese dental EMRs") without checking they're true |
| Asking an approved tool to rewrite an email in a more formal tone | Pasting a CRM export of all clinic contacts into a non-approved tool to "clean up the list" |

### Engineering

| ✅ Allowed | ❌ Not allowed |
|---|---|
| Using Copilot Business or Cursor Business (privacy mode on) on the Relaymint codebase | Using a personal Cursor or Copilot account on company code |
| Pasting a stack trace into Claude Team after removing tokens, emails, and patient fields | Pasting a production log line containing a patient's phone number or appointment note |
| Using synthetic or fake test data ("Test Patient 1, 010-0000-0000") | Pasting a real database dump or query results from production to "debug this" |
| | Pasting `.env` contents, API keys, or connection strings, even "just to fix the syntax" |

### Everyone (Marketing, Ops, Finance, HR)

| ✅ Allowed | ❌ Not allowed |
|---|---|
| Drafting a blog post or newsletter in an approved tool | Pasting a clinic customer list into a free AI tool to segment it |
| Summarizing an internal meeting in an approved tool | Using AI features in a non-approved app to process invoices that name clinics |

> **Not sure?** Don't paste it. Ask in #security-requests first. A delay is always better than a leak.

## 7. Exceptions

Sometimes there's a legitimate need outside these rules, for example a pilot of a new tool.

- **Who approves:** only the Security Lead (Minji Park).
- **How:** post a request in **#security-requests** on Slack. Name the specific tool, the specific dataset, the purpose, who will use it, and how long you need it.
- **Must be in writing:** approval counts only when it's written in #security-requests. Verbal or DM approvals don't count.
- **Time limit:** at most 90 days. After that you need a new request.
- **Scope:** an exception covers only the named tool and dataset. It doesn't extend to other tools, data, or people.

## 8. If something goes wrong

If you think data went somewhere it shouldn't (for example, you pasted patient details into ChatGPT, used a personal account with clinic data, or an extension may have captured a screen):

1. **Stop.** Don't paste anything more. If the tool lets you, delete the conversation, but **still report it**.
2. **Email security@relaymint.io within 24 hours** of noticing. Include what data, which tool, when, and which account.
3. **Don't try to fix it quietly** and don't contact the clinic yourself.
4. The **Security Lead** decides whether it's a reportable incident and handles any notification to clinics or regulators.

Reporting a mistake promptly is always treated better than a mistake that's found later.

## 9. Enforcement

- **First violation:** retraining on this policy.
- **Repeated or willful violations:** handled through the HR process.

For contractors, violations are also handled under their contract terms. *[Decision needed, see end]*

## 10. Related documents
- [Data classification / information security policy: link]
- [Clinic data processing agreement template: link]
- [PR review guidelines: link]
- [Incident response process: link]

## 11. Change log

| Date | Version | Change | Approved by |
|---|---|---|---|
| [YYYY-MM-DD] | 1.0 | First published | Legal, CTO |

---

## Appendix A: One-page cheat sheet (pin in #support and #sales)

| Data type | Approved tools | Everything else |
|---|---|---|
| Patient data (names, phones, appointment reasons, treatment notes) | ❌ Never | ❌ Never |
| Secrets (credentials, API keys, DB dumps) | ❌ Never | ❌ Never |
| Clinic business data (clinic name, staff emails, billing plan, redacted tickets) | ✅ Yes | ❌ No |
| Internal non-customer content (drafts, docs, meeting notes, code) | ✅ Yes | ❌ No |
| Public information (our website, public docs) | ✅ Yes | ✅ Yes |

**Before sending an AI draft to a customer:** Read all of it → Check the facts → No patient data you shouldn't include → You own it.

---

## Appendix B: Review checklist for the policy owner

Use this before publishing and at every scheduled review (suggested: every 6 months, plus whenever a tool, contract, or law changes).

**Tools and contracts**
- [ ] Approved tool list matches what we actually pay for (Claude Team, ChatGPT Enterprise, Copilot Business, Cursor Business).
- [ ] DPAs for each approved tool are signed, current, and stored in [location].
- [ ] Training opt-out is still confirmed in each tool's admin settings (vendors change defaults).
- [ ] Cursor privacy mode is enforced at the org level, not left to individuals, or there's a way to check it.
- [ ] Copilot Business settings (e.g. code-snippet retention, public code matching) have been reviewed with the CTO.
- [ ] Any new AI features added to tools we already use (Notion, Slack, Google Workspace, Zendesk/support tool, CRM) have been assessed and added to Section 4 as approved or not approved.
- [ ] Contractors have access to approved-tool accounts, or the policy says what they should do instead.

**Data rules**
- [ ] Definitions of patient data, clinic business data, and secrets still match our data classification and clinic contracts.
- [ ] Legal has confirmed the policy matches current clinic contracts and Korea PIPA, and has considered Japan's APPI for Japanese clinics.
- [ ] Redaction guidance is realistic for support agents (check a sample of real redacted tickets).

**Process**
- [ ] #security-requests is monitored and exception requests get answered within [X] business days.
- [ ] Log of active exceptions reviewed: none past 90 days, each has tool + dataset + owner + end date.
- [ ] security@relaymint.io is monitored, and the 24-hour reporting path has been tested.
- [ ] Incidents and near-misses since the last review have been examined for needed policy changes.
- [ ] Enforcement has been applied consistently (retraining records kept; HR involved where needed).

**Communication**
- [ ] Policy published in Notion and linked from onboarding.
- [ ] All current employees and contractors have acknowledged it (e.g. Notion checkbox or form).
- [ ] Support and Sales have had a 15-minute walkthrough with the examples in Section 6.
- [ ] Korean and Japanese translations, if published, match the English version.
- [ ] Examples in Section 6 still reflect how teams actually use AI (ask Support and Sales leads).
- [ ] Change log updated and "Next review" date set.

---

## Decisions needed before publishing

The brief didn't cover these points. I didn't want to invent rules, so please confirm each one with Legal or the CTO:

1. **Notion AI.** You listed it as a tool in scope, but it's not in the approved list, so this draft treats it as **not approved**. Since the policy lives in Notion, people will see the AI button right next to it. Should it be disabled at the workspace level, or approved (is it covered by a DPA)?
2. **Gemini in Google Workspace.** The brief bans "Gemini consumer." If you use Google Workspace, is Gemini for Workspace approved, banned, or turned off?
3. **Japan (APPI).** The brief cites Korea's PIPA, but you also serve clinics in Japan. Legal should confirm whether APPI changes anything (probably not the rules, but possibly the wording and incident handling).
4. **Contractors.** Do contractors get seats on the approved tools? If not, they effectively can't use AI with any company data. Also, how does "HR process" apply to them?
5. **Exceptions to the patient-data rule.** As written, the Security Lead's exception power could technically cover patient data in an approved tool. Should Rule 2 be absolute (no exceptions), or exception-eligible with extra sign-off from Legal?
6. **Built-in AI in the support tool / CRM.** If your helpdesk or CRM has AI features (auto-summaries, suggested replies), those see raw tickets *with* patient data. Decide whether they're allowed and under what settings.
7. **Translation tools.** Support works in Korean and Japanese. Machine translation tools (Papago, DeepL, Google Translate) may be AI tools under this definition. Should they be named explicitly as approved or not approved?
