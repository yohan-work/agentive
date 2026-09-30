Before this can be published, I need three answers. A provisional draft follows so you can react to something concrete.

**Questions (most important first)**

1. **Which AI tools are approved, and do any of them come with a company contract that keeps our data private?** This decides everything. If there is an approved company tool whose vendor contract says our data is not stored or used for training, then "use AI as much as possible" and "nothing confidential leaves the company" can both hold: people use that tool freely. If there is no such tool, the two goals collide on every task that involves confidential material, and the policy has to pick which goal wins.
2. **What counts as "confidential" here?** Do you already have a data classification (for example Public / Internal / Confidential)? If not, I need your list: customer data, employee data, source code, financials, contracts, unreleased product plans, and so on.
3. **Who owns this policy, who approves exceptions, and what happens when someone breaks it?** I need a named role or team for each, plus a place to report mistakes (email, channel, or form).

**Conflicts to be aware of**

- **Speed vs. confidentiality.** Resolved only if question 1 gives us an approved, contract-protected tool. Until then, the draft says: when in doubt, confidentiality wins.
- **"One page max" vs. "cover everything."** The policy below fits on one page by keeping each rule to a line or two. The examples and owner notes sit outside the policy so they do not count toward the page.

---

## 1. The policy (provisional)

**AI Usage Policy**
Owner: [TBD: role or team] · Effective: [TBD: date] · Review: [TBD: how often]

**Purpose**
We want everyone to use AI tools as much as they can to work faster. We also never let confidential information leave the company. This policy explains how to do both.

**Scope**
Everyone who works for or with [TBD: company name]: [ASSUMPTION] employees, contractors, and interns. It covers every AI tool: chat assistants, coding assistants, AI features inside other apps, browser extensions, and meeting note-takers.

**Definitions**
- **Approved AI tool:** a tool listed at [TBD: where the list lives]. [ASSUMPTION] Approved tools have a company agreement that stops the vendor from keeping or training on our data.
- **Confidential information:** [TBD: your definition or classification]. [ASSUMPTION] Includes customer and employee personal data, source code, financials, contracts, passwords and keys, and anything not yet public.
- **Leave the company:** typing, pasting, uploading, or recording information into any tool or service that is not an approved AI tool.

**What is allowed**
- Use AI for any work task: drafting, summarizing, coding, research, analysis, brainstorming.
- Use approved AI tools with confidential information, [ASSUMPTION] as long as the tool is approved for that type of data.
- Use any AI tool, approved or not, with information that is already public or that you wrote with nothing confidential in it.

**What is not allowed**
- Putting confidential information into any AI tool that is not approved. This includes personal accounts (e.g. a free account on your own email) of a tool that is approved for company use.
- Pasting passwords, API keys, or access tokens into any AI tool, approved or not. [ASSUMPTION]
- Installing AI browser extensions or meeting note-takers that are not on the approved list.
- Sending AI output to customers or publishing it without a person reading and checking it first. You are responsible for anything you send, whoever wrote it.

**If you are not sure**
Treat it as confidential and use an approved tool, or remove the confidential parts first. Still not sure? Ask [TBD: contact].

**Exceptions**
Want to use a tool that is not approved, or use confidential data in a new way? Request it from [TBD: approver] via [TBD: how]. Do not use the tool until you have a written yes. Approved exceptions last [TBD: duration] and must be renewed after that.

**Reporting a problem**
If you put confidential information into the wrong tool, or see someone else do it, report it to [TBD: contact or channel] right away, within [TBD: time limit]. Reporting fast limits the damage. [ASSUMPTION] People who report their own mistake promptly will not be penalized for reporting.

**Enforcement**
[TBD: what happens on a breach, and who decides.]

---

## 2. Examples

| Situation | Allowed? | Why |
|---|---|---|
| Asking an approved AI tool to rewrite a customer email that includes the customer's name and order details | Allowed [ASSUMPTION: if the tool is approved for customer data] | Confidential data, but it stays in an approved tool |
| Pasting the same customer email into a free chatbot on your personal account | Not allowed | Confidential data leaves the company |
| Using any AI tool to draft a LinkedIn post about a product that is already launched | Allowed | Public information only |
| Asking an approved coding assistant to debug a function from our codebase | Allowed [ASSUMPTION: if source code is permitted in that tool] | Code stays in an approved tool |
| Pasting a config file with a database password into an approved coding assistant | Not allowed | Secrets never go into any AI tool; delete the password first |
| Summarizing last quarter's internal revenue numbers in a free AI tool | Not allowed | Financials are confidential |
| Turning on an AI note-taker in a customer call because it came free with a calendar app | Not allowed | Note-taker is not approved, and the call contents are confidential |
| Sending an AI-drafted proposal to a client without reading it | Not allowed | A person must check AI output before it goes out |

**Edge cases people get wrong**

- **"I removed the name, so it's fine."** Removing a name is not always enough. A customer's company, deal size, and dates together can still identify them. If the rest is still confidential, use an approved tool.
- **"It's the same tool, just my own account."** An approved tool on a personal account does not have the company agreement. Use the company login.
- **"The AI feature is built into an app we already use."** Built-in AI features may send data to a different vendor. Check the approved list for that feature, not just the app.
- **"I already pasted it."** Stop, do not paste more, and report it right away. Deleting the chat yourself does not undo it.

---

## 3. Owner notes (not part of the policy)

**Must confirm before publishing**
- The list of approved AI tools and where it lives (question 1).
- Whether each approved tool actually has a no-retention / no-training agreement, and which data types each one is cleared for. The whole policy rests on this.
- Your definition of confidential information (question 2).
- Policy owner, exception approver, exception duration, report contact, report time limit (question 3).
- Enforcement consequences and who decides them.
- Company name, effective date, review cycle.

**Assumptions I made (each marked [ASSUMPTION] above)**
- The policy applies to employees, contractors, and interns.
- Approved tools have a contract that prevents data retention and training.
- Approved tools may be used with confidential data they are cleared for.
- Secrets (passwords, keys, tokens) are banned from all AI tools, even approved ones.
- People who self-report quickly are not penalized for reporting. Remove this if you do not want to commit to it.

**Not covered here**
This draft does not claim to meet any law or regulation, and nobody has approved it. Have Legal and Security review it before publishing, especially the definition of confidential information and the enforcement section.

**Optional additions**
- A rule on labeling AI-generated content shared with customers.
- A rule on using AI for hiring or performance decisions about people.
- Required training before getting access to approved tools.
- A rule on copyright and ownership of AI-generated output.
