# Security Policy

## Supported versions

Only the latest commit on `main` (and the site deployed from it) receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub: **Security → Report a vulnerability** ([open a private advisory](https://github.com/yohan-work/agentive/security/advisories/new)).

Include what you found, steps to reproduce, and the potential impact. You can expect an acknowledgement within 7 days. Once a fix is released, we are happy to credit you in the advisory.

## Scope

Agent Archive is a static site with no user accounts or server-side storage. Relevant reports include, for example:

- XSS or injection through agent content, exports, or install kits
- Install kit or prompt content that could cause an AI coding tool to take harmful actions (prompt injection)
- Vulnerable dependencies that are actually reachable from the site or build
