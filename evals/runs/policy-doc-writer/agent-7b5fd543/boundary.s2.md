Here's a one-page draft. I made a few assumptions to get it done without holding you up (listed below the policy). Two of your goals pull against each other, so I've flagged that first.

**The tension:** "Use AI as much as possible" and "nothing confidential ever leaves" only work together if people have an **approved tool that keeps data inside the company's control** (an enterprise plan with no training on your data, retention controls, and SSO). Without one, the only way to guarantee "nothing leaves" is to ban confidential data from every AI tool, and that will cut into the speed you want. The draft below assumes you have, or will get, at least one approved tool.

---

# AI Usage Policy

**Owner:** [Name/Role] · **Effective:** [Date] · **Applies to:** All employees, contractors, and interns

### 1. Purpose
We want everyone to use AI to work faster and better. This policy tells you how to do that without exposing company, customer, or employee information.

### 2. Default: Use It
You are encouraged to use AI for drafting, summarizing, coding, research, analysis, and brainstorming. You don't need permission for everyday use of **approved tools**.

### 3. Approved Tools
- **Approved:** [e.g., ChatGPT Enterprise / Claude for Work / Microsoft Copilot, company accounts only]. These may be used with Internal and Confidential data (see §4).
- **Not approved:** Personal accounts, free consumer versions, browser extensions, and any tool not on the list. Use these **only with Public data**.
- To request a new tool, contact [IT/Security email]. Current list: [link].

### 4. What Data Goes Where

| Data type | Examples | Approved tools | Unapproved tools |
|---|---|---|---|
| **Public** | Published website content, public docs | Yes | Yes |
| **Internal** | Internal processes, non-sensitive drafts | Yes | No |
| **Confidential** | Customer data, financials, contracts, source code, strategy, HR records | Yes, company account only | **Never** |
| **Restricted** | Passwords, API keys, credentials, payment card data, health data, government IDs | **Never** | **Never** |

If you're not sure, treat it as Confidential.

### 5. Your Responsibilities
- **You own the output.** Review AI output for accuracy, bias, and security before you use or share it. AI makes things up.
- **Don't send unreviewed AI output to customers** or publish it externally.
- **Code:** AI-generated code follows normal code review. Do not paste secrets into prompts.
- **Decisions about people** (hiring, performance, termination) must not be made by AI alone.
- **Disclose AI use** when a customer, contract, or regulator requires it.
- **Respect IP:** Don't use AI to reproduce copyrighted material or third-party confidential information.

### 6. Incidents
If you think confidential data went into an unapproved tool, report it to [Security contact] **within 24 hours**. Reporting quickly and honestly will not be punished; hiding it may be.

### 7. Enforcement
Violations may lead to losing tool access or to disciplinary action. This policy is reviewed every 6 months because the tools change fast.

**Questions:** [Contact / Slack channel]

---

### Assumptions
- You have, or will buy, at least one enterprise AI tool with contractual data protection (no training on your data, SSO, retention controls).
- You use or will adopt a simple four-level data classification (Public, Internal, Confidential, Restricted).
- There are no sector-specific rules (HIPAA, PCI, financial regulators, EU AI Act high-risk uses) that need their own sections.

### Risks
- **"Never leaves the company" isn't literally true** once you use a cloud AI vendor. Data goes to the vendor under contract. If you mean truly on-premises only, the approved tool list shrinks sharply and so does the speed benefit.
- **Shadow AI:** If the approved tools are slow or clunky, people will fall back to personal accounts. The policy only works if the approved option is easy to use.
- **"Cover everything" on one page** means details like vendor review criteria, retention settings, and regulated data are only referenced here. They'll need a short supporting standard.

### Next Actions
1. Confirm which tool(s) are approved and fill in the brackets.
2. Have Legal/Security check vendor terms (training, retention, data location).
3. Confirm the data classification matches what you already use.
4. Announce the policy with a 15-minute walkthrough and a one-line summary: *"Use approved AI freely; never put Confidential data in anything else; never put secrets in anything."*
5. Set a 6-month review date.

If you tell me your industry, which AI tools people use today, and whether you already have a data classification scheme, I can tighten this further.
