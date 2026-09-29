Here's a draft you can paste straight into Notion. I've built it on the six rules you agreed with Legal and the CTO. Where I had to assume something, it's marked **[Assumption]** and listed in Section 11, so Legal can confirm those points before you publish.

There's one gap to settle first: your topic list names **Notion AI** and **Gemini**, but the approved list doesn't include them. The draft treats both as **not approved**. That matters because the policy will live in Notion, where people will see the Notion AI button right next to it.

---

# Generative AI Use Policy (Customer Data)

| | |
|---|---|
| **Policy owner** | Minji Park, Security Lead **[Assumption]** |
| **Approved by** | Legal, CTO |
| **Applies to** | All Relaymint employees and contractors |
| **Effective date** | [YYYY-MM-DD] |
| **Next review** | [Effective date + 6 months] |
| **Version** | 1.0 |

---

## 1. Summary

- ✅ **Use only approved AI tools** for work: Claude (Team), ChatGPT (Enterprise), GitHub Copilot (Business), and Cursor (Business, privacy mode on).
- ❌ **Never put patient data into any AI tool.** That includes names, phone numbers, appointment reasons, and treatment notes. It applies even to approved tools.
- ❌ **Never paste passwords, API keys, production credentials, or database dumps** into any AI tool.
- ✅ **Clinic business data is OK in approved tools only.** Examples: clinic name, staff emails, billing plan, and ticket text with patient details removed.
- 👀 **A human must review every AI-written message before it reaches a customer.**
- 🚨 **Think something leaked? Email security@relaymint.io within 24 hours.** Don't wait until you're sure.

If you're unsure, remove the data or ask in #security-requests before you paste.

---

## 2. Why this policy exists

Our customers are dental clinics, and their data includes information about **their patients**. Our contracts with clinics and Korea's Personal Information Protection Act (PIPA) require us to protect that data carefully. A single paste into the wrong tool can:

- send patient information to a company we have no contract with,
- let that data be stored or used to train AI models,
- break our contracts with clinics and expose Relaymint to regulatory penalties.

We want people to use AI. It makes support, sales, and engineering faster. This policy explains how to use it safely.

---

## 3. Scope

**This policy covers:**
- All employees and contractors, in every team and in both Korea and Japan.
- Any generative AI tool: chatbots, coding assistants, writing assistants, AI features built into other apps (for example Notion AI, Gmail/Google Docs AI, Slack AI, Zoom AI summaries), browser extensions, and mobile apps.
- Any way data gets into a tool: typing, pasting, uploading files, screenshots, voice, or connecting the tool to another app (for example "connect to Google Drive").

**This policy does not cover:**
- AI features that Relaymint builds into our own product. Those follow the product security review process.
- Personal use of AI on personal matters that involves no company data.

---

## 4. Definitions

| Term | What it means | Examples |
|---|---|---|
| **AI tool** | Any software that generates text, code, images, or summaries using AI. | ChatGPT, Claude, Gemini, Copilot, Cursor, Notion AI, AI browser extensions |
| **Approved AI tool** | An AI tool Relaymint has a signed contract with, where training on our data is turned off, **used through your company account**. | See Section 5 |
| **Patient data** | Any information about a clinic's patients, or information that could identify one. | Patient name, phone number, appointment reason, treatment notes, patient ID, appointment time tied to a person, screenshots showing any of these |
| **Clinic business data** | Information about the clinic as our customer, with no patient information. | Clinic name, clinic staff names and emails, billing plan, contract terms, ticket text **with patient details removed** |
| **Secrets** | Anything that gives access to our systems or data. | Production passwords, API keys, tokens, `.env` files, SSH keys, database connection strings, database dumps or exports |
| **Redact / remove patient details** | Replace every piece of patient data with a neutral placeholder **before** pasting. | "Kim Soo-jin, 010-1234-5678" → "[Patient], [phone]" |
| **Customer-facing output** | Anything a clinic, prospect, or partner will read. | Support replies, sales emails, help-center articles, proposals |

---

## 5. Approved tools

| Tool | Approved version | Typical users | Notes |
|---|---|---|---|
| **Claude** | Claude Team plan (company account) | Everyone | Signed DPA, no training on our data |
| **ChatGPT** | ChatGPT Enterprise (company account) | Everyone | Signed DPA, no training on our data |
| **GitHub Copilot** | Copilot Business (company org) | Engineering | Normal PR review applies |
| **Cursor** | Cursor Business, **privacy mode ON** | Engineering | Check privacy mode before you start working |

**Not approved for any company data:**
- Free or personal accounts of **any** tool, including a personal ChatGPT Plus or Claude Pro account.
- Gemini (consumer version).
- AI browser extensions (for example summarizers, writing helpers, "chat with this page" extensions).
- **Notion AI** and other built-in AI features that aren't listed above, until they are added to this table **[Assumption: not yet approved]**.
- Any tool not in the table above.

**How to tell if you're on an approved account:** you signed in with your **@relaymint.io** account through company SSO, and the workspace shows "Relaymint". If you're not sure, ask in #security-requests.

To request a new tool, post in #security-requests with the tool name, what you want to use it for, and what data it would touch.

---

## 6. The rules

### Rule 1: Use only approved tools for company data
Any company data, including clinic business data, internal documents, and code, may go only into the approved tools listed in Section 5.

### Rule 2: Never put patient data into any AI tool
This applies to **every** tool, approved or not. Before you paste a ticket, email, log, or screenshot, remove all patient details. If you can't remove them cleanly (for example in a screenshot of the scheduling calendar), **don't use AI for that task.**

### Rule 3: Clinic business data goes into approved tools only
Clinic names, staff emails, billing plans, and patient-free ticket text are fine in approved tools, and not allowed anywhere else.

### Rule 4: Never put secrets into any AI tool
This applies to **every** tool, approved or not: no production credentials, API keys, tokens, or database dumps. Engineers: make sure `.env` files and other secret files are excluded from AI context (see Section 7.3).

### Rule 5: A human reviews every customer-facing AI output
Before any AI-written reply, email, or article reaches a customer, a person must read it fully and check that:
- the facts are correct (features, prices, policies, dates),
- there are no invented promises, discounts, or commitments,
- no internal or other-customer information slipped in,
- the tone and language are right for the clinic (Korean or Japanese business style).

The person who sends it is responsible for its content, whether or not AI drafted it.

### Rule 6: AI-generated code follows normal review
Code from Copilot or Cursor goes through the normal pull request review. No extra rule applies, but Rules 2 and 4 still cover what you feed into the tool.

---

## 7. Examples: allowed vs. not allowed

### 7.1 Customer Support (support tickets)

**Scenario:** A clinic writes in: *"Hi, this is Tanaka from Sakura Dental. Patient Sato Yuki (090-1111-2222) booked a root canal for Tuesday 10:00 but got an SMS for Wednesday. Can you check?"*

| | Example |
|---|---|
| ❌ **Not allowed** | Pasting the whole ticket into **any** AI tool, including Claude Team or ChatGPT Enterprise. It contains a patient name, phone number, and treatment reason. |
| ❌ **Not allowed** | Pasting a screenshot of the clinic's appointment calendar showing patient names. |
| ❌ **Not allowed** | Using a free ChatGPT account or a browser extension to "quickly translate" the ticket into Korean. |
| ✅ **Allowed** (approved tool) | *"A clinic (Sakura Dental, contact: Tanaka) reports that a patient booked an appointment for Tuesday 10:00 but received an SMS reminder for Wednesday. Draft a polite Japanese reply asking for the booking ID and confirming we're investigating."* |
| ✅ **Allowed** (approved tool) | Asking Claude or ChatGPT to summarize a long ticket thread **after** you've replaced patient details with [Patient], [phone], [treatment]. |
| ✅ **Allowed**, with human review | Using the AI draft as a starting point, then checking facts and tone before sending (Rule 5). |

**Tip:** Look up the patient-specific details yourself in the admin console. Use AI only for the wording.

### 7.2 Sales (sales emails)

| | Example |
|---|---|
| ✅ **Allowed** (approved tool) | *"Write a follow-up email to Dr. Lee at Seoul Smile Dental Clinic. They're on the Starter plan with 3 staff and asked about upgrading to Pro for multi-location support."* |
| ✅ **Allowed** (approved tool) | Pasting a prospect's email (clinic name, staff name, their questions) and asking for a reply draft. |
| ❌ **Not allowed** | Using a personal ChatGPT or free Gemini account to write the same email. Clinic business data belongs in approved tools only. |
| ❌ **Not allowed** | Pasting an email where the clinic forwarded a patient complaint with the patient's name and details, unless you remove those details first. |
| ❌ **Not allowed** | Uploading a full CRM export or customer list to an AI tool to "find upsell targets" without an approved exception (Section 8). |
| ⚠️ **Check before sending** | AI suggests "We can offer 20% off if you sign this week." Only send it if that discount is actually approved (Rule 5). |

### 7.3 Engineering (quick reference)

| | Example |
|---|---|
| ✅ **Allowed** | Using Copilot or Cursor (privacy mode on) on the Relaymint codebase. |
| ✅ **Allowed** | Asking Claude to explain an error using a stack trace **with patient data and tokens removed**. |
| ❌ **Not allowed** | Pasting production logs, database rows, or query results that contain patient data. |
| ❌ **Not allowed** | Opening a production DB dump, `.env` file, or a real-data seed or fixture file while Cursor or Copilot can read it as context. |
| ❌ **Not allowed** | Pasting an API key into a chat to "check why auth fails". |

### 7.4 Everyone else (Marketing, Ops/Finance/HR)

| | Example |
|---|---|
| ✅ **Allowed** | Drafting a blog post or campaign copy in Claude Team or ChatGPT Enterprise. |
| ✅ **Allowed** | Summarizing an internal meeting note that contains no patient data. |
| ❌ **Not allowed** | Using a clinic's real patient story or testimonial containing patient details as AI input. |
| ❌ **Not allowed** | Uploading employee HR records or payroll files to an AI tool **[Assumption: employee personal data is out of scope for this version; see Section 11]**. |

---

## 8. Exceptions

If you have a real business need that this policy blocks (for example analyzing a large set of anonymized tickets):

1. Post a request in **#security-requests** with:
   - the tool (must be specific, for example "ChatGPT Enterprise"),
   - the dataset (for example "Q3 support tickets, patient fields stripped by script"),
   - the purpose,
   - the duration you need (**maximum 90 days**),
   - who will have access.
2. **Minji Park (Security Lead)** reviews it and approves or declines **in writing in that channel**. A verbal OK or a DM doesn't count.
3. An exception covers **only that tool + dataset + time period**. When it expires, you stop, or you submit a new request.

**What exceptions can't do:** override Rule 2 (patient data) or Rule 4 (secrets) **[Assumption: confirm with Legal; see Section 11]**.

---

## 9. What to do if something goes wrong

If you **pasted something you shouldn't have**, or you **think data may have leaked** through an AI tool:

1. **Stop.** Don't keep using that conversation. Don't delete it until Security says so (it may be needed for the investigation).
2. **Email security@relaymint.io within 24 hours.** Include:
   - what tool and account,
   - what data (roughly; don't paste the data again in the email),
   - when it happened,
   - which clinic, if you know.
3. **The Security Lead decides** whether it's a reportable incident and what happens next.

Reporting quickly is always the right choice. People who report their own mistakes promptly are treated as having acted in good faith.

---

## 10. Enforcement

| Situation | Outcome |
|---|---|
| First violation | Required retraining on this policy |
| Repeated violation | HR process |
| Willful violation (knowingly breaking the rules, or hiding a leak) | HR process, which may include termination or ending a contractor agreement |

For contractors, violations are handled through their contract and their agency or manager **[Assumption]**.

---

## 11. Assumptions and open questions (resolve before publishing)

| # | Assumption / question | Why it matters | Suggested owner |
|---|---|---|---|
| A1 | **Policy owner is Minji Park.** | Someone needs to own reviews and updates. | CTO |
| A2 | **Notion AI is not approved.** | The policy will live in Notion, where people will see and use Notion AI. If Relaymint's Notion plan has a DPA and training opt-out, consider approving it explicitly, or disable Notion AI at the workspace level. | Security + Legal |
| A3 | **Gemini inside Google Workspace** (if you use Workspace) is treated like consumer Gemini, i.e. not approved. | People may assume it's covered by the company Google contract. | Security |
| A4 | **Japan:** the agreed rules cite Korea's PIPA. Japanese clinic data also falls under Japan's APPI. | The rules probably already satisfy both, but the "why" section should be legally accurate. | Legal |
| A5 | **Exceptions can't override the patient-data and secrets bans.** | Rules 2 and 4 say "never", but the exception process doesn't say whether it can override them. | Legal + Security Lead |
| A6 | **Employee personal data (HR, payroll)** isn't covered by the agreed rules. | Ops/HR may put it into AI tools. Either add a rule or state it's out of scope. | HR + Legal |
| A7 | **Contractors** get company accounts for approved tools. | Contractors without accounts might use personal ones, which breaks Rule 1. | Ops |
| A8 | **AI meeting recorders/transcribers** (Zoom AI, Otter, etc.) on calls with clinics. | Clinics may mention patients on calls. Not addressed by the current rules. | Security |

---

## 12. Risks this policy doesn't fully solve

- **Redaction mistakes.** Support agents remove patient details by hand, and it's easy to miss one (a name in a signature, a phone number in an attachment). *Mitigation:* train with real examples, and consider a redaction helper or a ticket view with patient fields masked.
- **Shadow AI.** Personal accounts and extensions are easy to use and hard to detect. *Mitigation:* SSO-only access to approved tools, a browser extension allowlist on company devices, and making approved tools easy to get.
- **Built-in AI features that appear without notice.** SaaS vendors keep adding AI features (Notion, Slack, Zoom, Google). *Mitigation:* a quarterly check of the tools we use, with features disabled at the admin level until reviewed.
- **Coding assistants reading sensitive files.** Copilot and Cursor can take local files as context. *Mitigation:* `.cursorignore` / content exclusion for secrets and data files; keep real patient data off developer machines.
- **Wrong or overconfident AI answers sent to customers.** *Mitigation:* Rule 5, and support leads spot-checking AI-assisted replies.

---

## 13. Rollout plan (this month)

| Step | Owner | When |
|---|---|---|
| Resolve open questions A1–A8 with Legal and CTO | Security Lead | Week 1 |
| Final review with Legal; publish in Notion | Security Lead | Week 2 |
| Announce in #general; add a pinned link in #security-requests | Security Lead | Week 2 |
| 20-minute walkthrough for Customer Support (most frequent users), using the ticket examples | Support Lead + Security Lead | Week 2–3 |
| Short sessions for Sales, Marketing, Ops/Finance/HR; engineering covered in the eng sync | Team leads | Week 3 |
| Every employee and contractor confirms they've read the policy (Notion checkbox or form) | Ops/HR | By end of month |
| Admin-level: disable unapproved built-in AI features; set Cursor privacy mode enforcement; Copilot content exclusions | IT/Engineering | Week 3–4 |
| Add policy to onboarding for new hires and contractors | Ops/HR | End of month |

---

## 14. Policy owner review checklist

Use this at each review (every 6 months) and whenever a tool, contract, or regulation changes.

**Tools and contracts**
- [ ] Each approved tool still has a signed DPA and training opt-out confirmed (check renewal dates).
- [ ] Plan tiers haven't changed (for example Team → a lower plan without the same terms).
- [ ] Cursor privacy mode is enforced at the org level, not just per user.
- [ ] Copilot / Cursor content exclusions still cover secrets and data files.
- [ ] New built-in AI features in our SaaS tools (Notion, Slack, Google, Zoom, CRM, helpdesk) have been reviewed, then approved or disabled.
- [ ] The approved and not-approved lists in Section 5 are current.

**Data and legal**
- [ ] Definitions of patient data and clinic business data still match our clinic contracts.
- [ ] Legal has confirmed no changes to PIPA (Korea) or APPI (Japan) that affect this policy.
- [ ] Any new data types (for example new product features collecting patient info) are covered.

**Exceptions and incidents**
- [ ] All exceptions in #security-requests are logged, and none has gone past 90 days.
- [ ] Expired exceptions have actually stopped.
- [ ] Incidents reported to security@relaymint.io since the last review have been examined for patterns (for example repeated redaction misses in Support).
- [ ] Any policy gaps found in incidents have been fixed in this document.

**People and awareness**
- [ ] All current employees and contractors have acknowledged the latest version.
- [ ] New hires and contractors get the policy during onboarding.
- [ ] The Support team's examples still reflect real ticket types.
- [ ] Retraining for first-time violations has been completed.

**Document hygiene**
- [ ] Version number, effective date, and next review date are updated.
- [ ] Changes are summarized in a changelog at the bottom of the page.
- [ ] Korean and Japanese translations (if published) match the English version **[Assumption: translations may be needed for Support staff]**.

---

## 15. Questions?

- General questions: **#security-requests**
- Suspected leak or mistake: **security@relaymint.io** (within 24 hours)
- Policy owner: **Minji Park, Security Lead**

---

### Changelog
| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | [YYYY-MM-DD] | First version | [Name] |

---

**Next steps for you:**
1. Settle **A2 (Notion AI)** and **A5 (whether exceptions can override Rules 2 and 4)** first. Those two most affect how people will read the policy.
2. Have Legal confirm the APPI wording (A4) and whether employee data is in scope (A6).
3. Decide whether Support needs Korean and Japanese versions. If your support agents work mainly in those languages, a translated one-page summary of Sections 1 and 7.1 will work better than the full document.

If you want, I can also write a one-page quick-reference card for support agents or a Korean translation of the summary.
