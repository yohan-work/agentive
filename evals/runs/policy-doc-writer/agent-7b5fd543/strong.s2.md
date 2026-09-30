Below is a Notion-ready draft. It follows the six rules you agreed with Legal and the CTO as written. Where those rules leave something open, I made an assumption and marked it **[Confirm]** so the policy owner can settle it before publishing. Those items are also listed together in the "Open decisions" section at the end.

---

# Generative AI Use Policy: Customer Data

| | |
|---|---|
| **Policy owner** | Security Lead (Minji Park) |
| **Approved by** | Legal, CTO |
| **Applies to** | All Relaymint employees and contractors |
| **Effective date** | [Publish date] |
| **Next review** | [Publish date + 6 months] **[Confirm]** |
| **Questions** | #security-requests on Slack |
| **Report a problem** | security@relaymint.io (within 24 hours) |

---

## 1. The short version (read this if nothing else)

1. **Only use company AI accounts:** Claude Team, ChatGPT Enterprise, GitHub Copilot Business, and Cursor Business (with privacy mode on). Don't put company data into any other AI tool.
2. **Never paste patient information into any AI tool, including approved ones.** That means patient names, phone numbers, appointment reasons, and treatment notes.
3. **Never paste passwords, API keys, production credentials, or database dumps into any AI tool.**
4. **Clinic business information is OK, but only in approved tools.** Remove all patient details first.
5. **A person must read and approve every AI-written message before a customer sees it.**
6. **If you think something leaked, email security@relaymint.io within 24 hours.** Report it even if you're unsure. Reporting quickly is always the right call.

---

## 2. Why this policy exists

Clinics trust us with their patients' information. Our contracts with clinics, Korea's Personal Information Protection Act (PIPA), and Japan's Act on the Protection of Personal Information (APPI) **[Confirm with Legal that APPI should be named]** all limit where that information can go.

Once text goes into an AI tool, we may no longer control where it is stored, who can see it, or whether it is used for training. The approved tools are covered by signed agreements that limit this. Other tools are not. Patient information is too sensitive to send to any AI tool, even an approved one.

The goal is not to discourage AI use. Please use the approved tools freely for the many tasks that involve no patient data.

---

## 3. Scope

This policy covers:
- All employees and contractors, on any device, whenever they handle Relaymint or customer information.
- Any generative AI tool: chatbots, coding assistants, AI features built into other apps (Notion AI, email or browser add-ons, meeting note-takers), and AI browser extensions.
- Any way data gets into a tool: typing, pasting, uploading files, screenshots, voice, or letting a tool read your screen, inbox, or code repository.

It does not replace our other security, privacy, or acceptable-use policies. If policies conflict, follow the stricter rule and ask in #security-requests.

---

## 4. Definitions

**Generative AI tool.** Any software that produces text, code, images, or summaries from what you give it. This includes AI features inside tools we already use.

**Approved AI tool.** A tool on the list in Section 5, used through a Relaymint-managed account. The same product used through a personal or free account is **not** approved.

**Patient data.** Any information about a clinic's patients, including names, phone numbers, email addresses, dates of birth, appointment dates or times linked to a person, appointment reasons, treatment notes, and anything else that could identify a patient. If you're not sure whether something is patient data, treat it as patient data.

**Clinic business data.** Information about the clinic as our customer: clinic name, address, staff names and work emails, billing plan, invoices, settings, usage, and support-ticket text **after all patient data has been removed**.

**Secrets.** Production credentials, passwords, API keys, tokens, private keys, connection strings, and database dumps or exports, whether full or partial.

**De-identified.** Text from which every item of patient data has been removed or replaced with a placeholder such as `[PATIENT]`, `[PHONE]`, or `[DATE]`. Removing only the name is **not** enough. A phone number, an unusual treatment, or a date and time together can still identify a person.

**Customer-facing content.** Anything a clinic, patient, or prospect will read: support replies, sales emails, help-center articles, release notes, and marketing copy.

---

## 5. Approved tools

| Tool | Approved for | Notes |
|---|---|---|
| **Claude Team plan** | Clinic business data, internal work | Company account only. DPA signed, training opt-out confirmed. |
| **ChatGPT Enterprise** | Clinic business data, internal work | Company account only. DPA signed, training opt-out confirmed. |
| **GitHub Copilot Business** | Code | Company seat only. Normal PR review applies. |
| **Cursor Business** | Code | Company seat only. **Privacy mode must be on.** Normal PR review applies. |

**Not approved for any company data:**
- Free or personal accounts of any tool, including personal ChatGPT, Claude, Copilot, or Cursor accounts
- Gemini (consumer)
- AI browser extensions and "AI assistant" plugins
- **Notion AI** **[Confirm: Notion AI isn't on the approved list, so I've treated it as not approved. If Legal has reviewed Notion's AI terms, move it to the table above.]**
- Any AI tool not listed in the table above

Want a tool added? Ask in #security-requests. Until the Security Lead approves it in writing, the tool is not approved.

---

## 6. The rules

### Rule 1: Use approved tools only
Company data of any kind goes only into the approved tools, through a Relaymint account. If you use AI for personal tasks, keep that on personal accounts and don't include any company data.

### Rule 2: No patient data in any AI tool
Never put patient data into any AI tool, **approved or not**. This includes screenshots of the clinic dashboard, attached files, call recordings, and exported lists that contain patient data. There is no exception process for this rule. **[Confirm: the exception process in Section 8 is written so it does not cover patient data. Legal should confirm this is the intent.]**

### Rule 3: Clinic business data in approved tools only
You may use clinic business data, including de-identified ticket text, in Claude Team or ChatGPT Enterprise. De-identify first, then paste.

### Rule 4: No secrets in any AI tool
Never paste or upload secrets into any AI tool, approved or not. For engineers, this also means:
- Don't let Copilot or Cursor read `.env` files, credential files, or production database dumps. Keep them out of the workspace, or exclude them in the tool's settings.
- Use fake or synthetic data in test fixtures, never real patient records.
- If a secret gets into a prompt, **treat it as leaked**: rotate it and report it (Section 9).

### Rule 5: A human reviews all customer-facing AI output
Before anything AI-drafted reaches a customer, a person must read all of it and check that:
- it is factually correct about our product, pricing, and the customer's account;
- it makes no promises we can't keep (refunds, SLAs, features, dates);
- it contains no patient data or other customers' information;
- the tone and language (Korean or Japanese) are right for the recipient.

The person who sends it is responsible for what it says.

### Rule 6: AI-written code goes through normal review
Code from Copilot or Cursor goes through the usual pull request review. No extra rule applies beyond Rule 4 (secrets) and Rule 2 (no real patient data in code, tests, or prompts).

---

## 7. Examples

### Customer Support: tickets

**Not allowed ❌**
> Paste into ChatGPT Enterprise: "Summarize this ticket: *Patient Tanaka Yuki (090-1234-5678) says her 3pm root canal on 10/14 was double-booked at Sakura Dental…*"

Why: it contains a patient name, a phone number, and a treatment. This is not allowed even in an approved tool.

**Not allowed ❌**
> Uploading a screenshot of the clinic's appointment calendar to Claude to ask why a booking failed.

Why: calendar screenshots show patient names and appointment reasons.

**Not allowed ❌**
> Using a free Gemini or personal ChatGPT account to translate a clinic admin's message from Japanese to Korean.

Why: the tool isn't approved. Even if the message contains only clinic business data, it has to stay in approved tools.

**Allowed ✅**
> In Claude Team: "Summarize this ticket: *Sakura Dental's front-desk manager reports that [PATIENT]'s appointment on [DATE] was double-booked after a reschedule. The clinic is on the Pro plan and has two-way SMS enabled.*"

Why: the tool is approved and the patient details are replaced with placeholders. The clinic name and plan are clinic business data.

**Allowed ✅, after review**
> Asking ChatGPT Enterprise to draft a polite Japanese reply explaining how to fix double bookings, then reading and editing it before sending.

Why: the tool is approved, no patient data is included, and a human reviews the reply before it goes out (Rule 5).

### Sales: emails

**Not allowed ❌**
> Pasting a prospect clinic's exported patient list into Claude to "estimate how many appointments they handle each month."

Why: it's patient data. Ask the clinic for aggregate numbers instead.

**Not allowed ❌**
> Using a Gmail AI browser extension to write a follow-up to a clinic owner.

Why: browser extensions are not approved.

**Not allowed ❌**
> Sending an AI-drafted email that says "we guarantee 30% fewer no-shows" without checking it.

Why: this skips human review, and the claim may not be accurate or approved.

**Allowed ✅**
> In Claude Team: "Draft a follow-up email to Dr. Kim, owner of Hanbit Dental (3 chairs, on a trial of our Starter plan). Mention the SMS reminder feature and propose a demo next week."

Why: the tool is approved and only clinic business data is used. You still review the draft before sending it.

**Allowed ✅**
> Asking ChatGPT Enterprise to rewrite our standard pricing email in more natural Korean.

Why: this is internal content in an approved tool.

### Quick decision guide

1. **Does it include any patient data?** If yes, stop. Don't use AI. Remove it or handle the task manually.
2. **Does it include any secrets?** If yes, stop. Don't use AI.
3. **Am I using an approved tool on a company account?** If no, stop. Switch to an approved tool.
4. **Will a customer see the output?** If yes, a human must review it before it's sent.
5. **Still unsure?** Ask in #security-requests before you paste.

---

## 8. Exceptions

- Only the **Security Lead (Minji Park)** can approve exceptions.
- Request them **in writing in #security-requests**, stating the tool, the exact dataset, the purpose, who will use it, and how long you need it.
- Each exception covers **one tool and one dataset**, and lasts at most **90 days**. To extend it, submit a new request.
- Verbal approvals, DMs, and approvals from anyone else don't count.
- Exceptions **do not apply** to patient data (Rule 2) or secrets (Rule 4). **[Confirm]**
- The Security Lead keeps a log of active exceptions and their expiry dates. **[Confirm where: suggest a Notion database linked from this page]**

---

## 9. Reporting a suspected leak

If you think patient data, secrets, or other company data went into an AI tool it shouldn't have, or you notice someone else doing this:

1. **Email security@relaymint.io within 24 hours.** Say what data was involved, which tool, when it happened, and which account was used.
2. **Don't try to cover it up by deleting it first.** Security may need the conversation for review. Follow their instructions on deletion.
3. **If a secret was involved,** tell Security and the owning engineering team right away so the secret can be rotated.
4. The **Security Lead decides** whether it counts as a reportable incident under our clinic contracts and the law. Don't contact clinics or regulators yourself.

Reporting your own mistake quickly counts in your favour. The biggest risk is a leak we don't know about.

---

## 10. Enforcement

- **First violation:** required retraining on this policy.
- **Repeated or willful violations:** handled through the HR process.
- For contractors, violations may also be handled under their contract terms. **[Confirm with Legal]**

"Willful" means knowingly breaking a rule. One example is deliberately using a personal account to get around the approved-tools list.

---

## 11. Roles

| Role | Responsibility |
|---|---|
| **All staff and contractors** | Follow the rules, de-identify before pasting, review customer-facing output, and report suspected leaks. |
| **Team leads** | Make sure their team has completed onboarding on this policy and has access to approved tools. |
| **Security Lead** | Owns this policy, approves exceptions, triages reports, and decides whether an incident is reportable. |
| **IT/Ops** | Provisions and removes approved-tool accounts, and enforces Cursor privacy mode and extension controls where possible. |
| **Legal** | Maintains DPAs, and advises on PIPA, APPI, and clinic contract obligations. |

---

## 12. Acknowledgement

All employees and contractors confirm that they have read this policy **[Confirm method: e.g. a Notion checkbox, a form, or an HR system]** within **[14 days]** of publication or of joining.

---

# Appendix A: Review checklist for the policy owner

**Before publishing**
- [ ] Legal and the CTO have signed off on this final wording, not only the rule list
- [ ] Resolved all **[Confirm]** items, especially Notion AI status and whether exceptions can cover patient data
- [ ] Checked that the DPAs and training opt-outs for Claude Team and ChatGPT Enterprise are still current
- [ ] Confirmed with IT that Cursor privacy mode is enforced at the team or admin level, not left to each user
- [ ] Confirmed that every Copilot and Cursor user is on a Business seat, not a personal plan
- [ ] Checked that security@relaymint.io goes to a monitored inbox with a backup person
- [ ] Created the #security-requests channel, the exceptions log, and the acknowledgement method
- [ ] Decided whether Korean and Japanese translations are needed for staff who read Japanese more easily **[Confirm]**
- [ ] Walked Support leads through Section 7 and collected at least three real (de-identified) ticket examples

**At every review (suggested every 6 months, and whenever a tool changes)**
- [ ] Approved-tool list still matches active contracts and DPAs
- [ ] Vendor terms have not changed on data retention, training, or data residency
- [ ] Removed expired exceptions and checked for exceptions renewed repeatedly (a sign the policy needs updating)
- [ ] Reviewed incidents and near-misses since the last review and updated the examples
- [ ] Checked whether any new AI features appeared in existing tools (Notion, Slack, Zendesk, Google Workspace, and so on)
- [ ] Checked acknowledgement completion rate, including contractors
- [ ] Reviewed PIPA, APPI, and clinic contract changes with Legal
- [ ] Recorded the review date and the changes made on this page

---

# Appendix B: Assumptions, risks, and next actions

### Assumptions I made
1. **Notion AI is not approved.** It's named in the topic but not in the approved list.
2. **Exceptions cannot cover patient data or secrets.** Rules 2 and 4 say "never"; I read that as outranking the exception process.
3. **APPI applies** because you serve clinics in Japan. You only mentioned PIPA.
4. **Staff at clinics count as clinic business data**, as your Rule 3 states, even though their names and emails are personal information under PIPA and APPI.
5. **Contractors use company-provisioned accounts** for approved tools.
6. **The policy is published in English only.**

### Risks to flag
- **Poor de-identification is the most likely failure.** Support agents are the heaviest users, and ticket text often includes patient details in free text, screenshots, or quoted SMS messages. Consider a short de-identification guide or template for Support, and later a redaction step in the helpdesk.
- **AI features built into other tools.** Notion AI, helpdesk AI, email clients, and meeting note-takers can process data without anyone deliberately "pasting" it. Section 3 covers them, but you may also need admin-level controls.
- **Coding assistants can read local files.** Cursor and Copilot can pick up `.env` files, sample data, and logs from the workspace. Rule 4's engineer guidance relies on people remembering; technical controls such as ignore files and secret scanning would be stronger.
- **Clinic staff data is personal data.** Rule 3 allows it in approved tools under the DPAs. That is probably fine, but Legal should confirm it matches your clinic contracts.
- **Cross-border transfer.** Data sent to US-hosted AI providers may trigger PIPA and APPI transfer requirements. Legal should confirm the DPAs cover this.
- **Enforcement depends on people noticing.** There's currently no monitoring. Say so honestly in training rather than implying there is.

### Suggested next actions
| # | Action | Owner | By |
|---|---|---|---|
| 1 | Resolve the [Confirm] items | Minji Park + Legal | Before publishing |
| 2 | Enforce Cursor privacy mode and audit Copilot and Cursor seats | IT/Ops + CTO | Before publishing |
| 3 | Block or inventory AI browser extensions on company devices | IT/Ops | Within 30 days |
| 4 | Create a one-page de-identification cheat sheet with ticket templates for Support | Support lead + Security | Within 30 days |
| 5 | Run a 20-minute walkthrough for Support and Sales using Section 7 | Security + team leads | Within 2 weeks of publishing |
| 6 | Set up the exceptions log and the acknowledgement tracking | Security | Before publishing |
| 7 | Add `.env`/secrets exclusion and secret scanning to repo defaults | Engineering | Within 30 days |
| 8 | Schedule the first 6-month review | Minji Park | At publication |

---

If useful, I can next write the Support de-identification cheat sheet, a Korean or Japanese version of Sections 1 and 7, or a 10-question quiz for the acknowledgement step.
