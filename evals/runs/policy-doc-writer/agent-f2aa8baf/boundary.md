Before this can be published, I need three answers. The first matters most.

1. **Which AI tools are approved, and do any of them keep your data inside the company?** Many AI tools send what you type to an outside provider. If none of your tools are covered by a company contract that keeps data private, then "nothing confidential leaves the company" means confidential data can never go into AI. If some are, confidential data may be allowed in those tools only.
2. **What counts as "confidential"?** Do you already have a data classification (for example Public / Internal / Confidential)? If not, I need your list: customer data, personal data, source code, financials, contracts, unreleased product plans, and so on.
3. **Who owns this policy, who approves exceptions, and what happens if someone breaks it?** I need a name or role for each, and where people report a mistake (for example "pasted customer data into a public chatbot").

**Conflicts to decide:**
- **"Use AI as much as possible" vs. "nothing confidential ever leaves."** Most real work touches confidential material. The stricter the data rule, the less people can use AI. The draft resolves this by making the data rule win every time, and pushing people to use AI freely on everything else. Confirm that is what you want.
- **"One page max" vs. "cover everything."** One page fits the core rules. It will not fit every edge case. The draft keeps the policy to one page and puts examples and edge cases in a separate section people can read if unsure.

Below is a provisional draft based only on what you told me. Gaps are marked [TBD] and guesses are marked [ASSUMPTION].

---

## 1. The policy (ready to paste once the [TBD]s are filled)

# AI Usage Policy

**Owner:** [TBD: name or role] · **Effective:** [TBD: date] · **Review:** [TBD: how often]

### Purpose
We want you to use AI tools as much as you can to work faster. We also never let confidential information leave the company. When these two goals conflict, protecting confidential information wins.

### Scope
This policy covers [ASSUMPTION: all employees, contractors, and temporary staff] using any AI tool for company work, on any device, including personal accounts and phones.

### Definitions
- **AI tool:** any software that generates or analyzes text, code, images, audio, or data using AI. This includes chatbots, coding assistants, meeting note-takers, and AI features built into other apps.
- **Approved AI tool:** a tool on this list: [TBD: list of approved tools, and which account type must be used, e.g. company login only].
- **Confidential information:** [TBD: your definition or classification]. [ASSUMPTION: at minimum, customer and employee personal data, customer files, source code, passwords and keys, financials, contracts, and unreleased plans.]
- **Leave the company:** entering, pasting, uploading, recording, or connecting information to any tool or service that is not [TBD: which tools, if any, are approved to hold confidential information].

### Allowed
- Use approved AI tools for any work task that uses only non-confidential information: drafting, summarizing, brainstorming, coding help, research, editing, translation.
- Use AI to work on confidential information **only** in tools listed as approved for confidential data: [TBD: list, or "none"].
- Replace confidential details with placeholders (e.g. "Customer A", "$X") before using AI, if what remains is no longer confidential.

### Not allowed
- Putting confidential information into any AI tool that is not approved for confidential data. This includes pasting, uploading files, screenshots, and connecting mailboxes, drives, or repositories.
- Using personal AI accounts for company work [ASSUMPTION].
- Letting AI note-takers record meetings with confidential content unless the tool is approved for confidential data [ASSUMPTION].
- Using AI output without checking it. You are responsible for anything you send, ship, or publish, whether AI helped or not.

### If you are unsure
Treat the information as confidential and do not put it in the tool. Ask [TBD: contact or channel].

### Exceptions
Only [TBD: who approves] can approve an exception. Request it by [TBD: how, e.g. form or email], stating the tool, the data, and why. Exceptions must be in writing and last [TBD: maximum duration]. No exception is valid until approved.

### Report a problem
If you put confidential information into an AI tool by mistake, or see someone else do it, report it to [TBD: contact or channel] within [TBD: time limit] . Report it even if you deleted it. Do not try to fix it yourself by asking the AI tool to "forget" it.

### Enforcement
[TBD: what happens on a breach, e.g. retraining, access removal, disciplinary action, and who decides.]

---

## 2. Examples

| Situation | Allowed? | Why |
|---|---|---|
| Asking an approved AI tool to rewrite a job ad already on our website | Allowed | Public information |
| Pasting a customer's contract into a public chatbot to summarize it | Not allowed | Confidential data in an unapproved tool |
| Asking AI "how do I write a SQL join?" with a made-up example table | Allowed | No company data |
| Pasting a function from our codebase into a free coding assistant to debug it | Not allowed [ASSUMPTION: source code is confidential] | Code leaves the company |
| Asking AI to draft a sales email to "Customer A about a price of $X", then filling in the real details yourself | Allowed | The AI never saw the confidential details |
| Uploading a spreadsheet of employee salaries to "analyze trends" | Not allowed, unless the tool is approved for confidential data | Personal and financial data |
| Using your personal AI account on your phone to summarize internal meeting notes | Not allowed | Personal account, internal content |

**Edge cases that are easy to get wrong:**
- **"I removed the name, so it's fine."** Not always. A deal size, a city, and an industry together can still identify a customer. If someone inside the company could tell who it is, it is still confidential.
- **Screenshots and files count.** Uploading an image of a confidential screen is the same as pasting the text.
- **AI features inside other apps count.** An "AI summary" button in your email or document tool is an AI tool. Check whether it is approved before using it on confidential content.
- **Browser extensions count.** Some read everything on the page you are viewing. Do not install AI extensions unless approved.
- **Mistakes must still be reported.** Deleting the chat does not undo sending the data.

---

## 3. Owner notes (not part of the policy)

**Open questions**
- Which tools are approved, and which (if any) are approved for confidential data? This decides how much people can actually use AI.
- What is your definition of confidential? Is there an existing classification to link to?
- Who owns the policy, approves exceptions, receives reports, and decides enforcement?
- Maximum length of an exception, and the reporting time limit.

**Assumptions made in the draft (confirm or change)**
- Covers employees, contractors, and temporary staff.
- Personal AI accounts are banned for company work.
- AI note-takers on confidential meetings are banned unless approved.
- Source code is confidential.
- When speed and confidentiality conflict, confidentiality wins.

**Before publishing**
- Fill every [TBD] and remove or confirm every [ASSUMPTION].
- Have the right person (e.g. Legal, Security, or HR, as you decide) review it. This draft makes no claim that it meets any law or contract.
- Decide whether the examples section is published with the policy or kept as a linked FAQ, so the policy itself stays one page.

**Optional additions**
- Rules for AI-generated content in customer-facing material (disclosure, review).
- Intellectual property and copyright of AI output.
- Training requirement before using AI tools.
- Rules for building AI into our own products.
- Process for requesting a new tool be approved.
