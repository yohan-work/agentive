I can't review the PR yet because the diff isn't in your message. I've only seen your one-line description, so I won't say anything about code I haven't read. There are three things I need, most important first:

1. **The diff.** Please send the full diff of the auth middleware and every file that reads or writes the session. That means the login and logout handlers, token refresh, the API client or fetch wrapper, and any server-side session or CSRF code. (`git diff main...your-branch`, or paste the PR's "Files changed" view.)
2. **Why the storage changed, and what gets stored.** Why are you moving from cookies to localStorage? What goes into localStorage: an opaque session ID, a JWT access token, a refresh token? How does the server get it now: an `Authorization: Bearer` header, or something else?
3. **The test output and what the tests cover.** Please paste the test run itself, not only "tests pass". Tell me which tests exercise the middleware: unit tests with mocked requests, or integration tests that go through a real request cycle.

## What I can say from your description alone

This part is based only on what you wrote. It isn't a code review.

**Session storage moving from cookies to localStorage is a security design change, not a refactor.** It should be treated as a potential **blocker** until the diff shows how the risks below are handled:

- **XSS can now steal the token.** Any script running on your origin can read localStorage. That includes an XSS bug, a compromised npm dependency, or a third-party script tag. An `HttpOnly` cookie can't be read from JavaScript. [ASSUMPTION] If the old cookie was `HttpOnly`, this change removes that protection, and one XSS becomes full account takeover that persists until the token expires. Check the old cookie's `Set-Cookie` flags in the current code.
- **Logout and revocation.** localStorage never expires on its own and is shared by every tab on the origin. Once I have the diff I'll check three things. Does logout clear the key and also invalidate the token on the server? Is the token's lifetime short? Is there a refresh or revocation path?
- **CSRF changes shape.** Bearer tokens in a header aren't sent automatically, so classic CSRF mostly goes away. But if any endpoint still accepts the old cookie during a transition period, CSRF protection has to stay on those endpoints. I'll check whether the middleware accepts both.
- **SSR and non-browser callers.** [ASSUMPTION] If any page renders on the server, or anything calls the API without JavaScript, those requests can't see localStorage. Server-rendered pages or requests that need auth may silently become anonymous.
- **Existing sessions at deploy time.** Users who have a cookie and no localStorage entry may be logged out all at once. You may need a migration path, or you may decide that's acceptable, but it should be a deliberate choice.

The common safer alternative is to keep the session in an `HttpOnly; Secure; SameSite=Lax` (or `Strict`) cookie and do the middleware refactor separately. If localStorage is required, for example for a cross-origin API, keep access tokens short-lived and put the refresh token in an `HttpOnly` cookie. Add a strict Content-Security-Policy to reduce XSS risk.

## Test gaps to check once I see the tests

"Tests pass" doesn't show that this change is safe. Auth refactors usually break in cases the happy-path tests don't cover. These are the tests I'd expect to see, or to ask you to add:

- `rejects request with missing token`: no header and no cookie. Assert 401, and assert the handler is not called.
- `rejects expired / tampered token`: sign a token with a past `exp`, and separately change one byte of the signature. Assert 401 for both.
- `logout invalidates token server-side`: log in, log out, then replay the old token. Assert 401.
- `legacy cookie no longer authenticates` (or `still authenticates and is CSRF-protected`, if you support both during migration): check whichever behavior you intend.
- `protected SSR route without client token`: assert it redirects or returns 401 rather than rendering with no user or the wrong user.

## Verdict

**Do not merge today, based on what I've seen.** I haven't seen any code or test output, so I can't approve it, and I can't confirm the tests passed. The storage change alone is a security decision that needs review. Please send the diff and the answers to the three questions and I'll do the full line-by-line review. The merge decision stays with you and whoever owns auth security on your team.
