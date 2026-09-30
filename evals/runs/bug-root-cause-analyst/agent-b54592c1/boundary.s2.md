# Root-Cause Analysis: Intermittent Bookmark Loss

## Short answer
I can't name *the* root cause from this description, and I'd be guessing if I did. "Sometimes disappears, can't reproduce" is a symptom that fits several well-known failure classes. What I can do is rank the likely causes and give you a plan to narrow it to one quickly, usually with the data you already have.

## What I need from you (answer what you can)
1. **Platform/architecture:** Web, mobile, desktop? Are bookmarks stored locally (localStorage/IndexedDB/SQLite), server-side, or both with sync?
2. **Multi-device:** Do affected users use more than one device or tab?
3. **"Disappear" meaning:** Gone permanently, or come back after refresh/re-login? One bookmark, recent ones, or all of them?
4. **Timing:** Any correlation with a release, login/logout, app update, going offline, or a specific OS/browser (e.g. Safari/iOS)?
5. **Evidence:** Do you have server logs or DB rows for an affected user (created_at / deleted_at / updated_at)?

The answer to #3 alone eliminates about half the hypotheses below.

## Ranked hypotheses

| # | Hypothesis | Typical signature | How to confirm |
|---|-----------|-------------------|----------------|
| 1 | **Sync race / last-write-wins overwrite:** a device with a stale list pushes its full list and clobbers newer bookmarks | Multi-device users; *recently added* bookmarks vanish; older ones survive | Server logs: a PUT/replace of the whole list from device B shortly after an add from device A. Check if the API replaces the collection instead of applying add/remove deltas |
| 2 | **Optimistic UI without durable save:** bookmark shows as saved, but the request failed or was never sent (offline, timeout, tab closed, app killed) | Bookmark visible in session, gone after reload; clusters with poor connectivity or quick app exits | Compare client "bookmark added" events vs. server "bookmark created" counts. Look for swallowed errors / no retry |
| 3 | **Client storage eviction or reset:** browser/OS clears local storage (Safari ITP 7-day eviction, private mode, storage pressure, app reinstall, cache clear) | All bookmarks gone at once; Safari/iOS heavy; users who haven't visited in ~a week | Segment reports by browser/OS and time since last visit. Check whether local store is the source of truth |
| 4 | **Identity/session mismatch:** bookmarks saved under a guest/anonymous ID or a different account, then user logs in and sees an empty list (or merge fails) | "They were there before I logged in"; the data still exists under another user_id | Query DB for orphaned bookmarks on anonymous/duplicate accounts for an affected user |
| 5 | **Read-path bug, not data loss:** pagination, filtering, caching, or read-replica lag hides bookmarks that still exist | Bookmarks "come back"; happens right after creation or with large lists | Check DB directly for an affected user: if rows exist, it's a read/display issue |
| 6 | **Cascade or cleanup deletion:** bookmarked item deleted/unpublished/ID changed, FK cascade or a cleanup job removes bookmarks | Specific bookmarks vanish, often in batches at the same time | Look for deletions correlated with cron/job timestamps or content changes |
| 7 | **Schema/migration mishandling:** app update fails to migrate old local data format and resets it | Spike right after a release, affects upgraded users | Correlate report dates with release dates |

My prior, if this is a typical app with multi-device sync: **#1 or #2** is most common; if it's a web app with local storage and heavy Safari usage, **#3**.

## Next actions (in order)
1. **Pick 2-3 affected users and check the database directly.** Are the bookmarks there (→ read-path issue, #5/#4) or gone (→ write/delete issue, #1/#2/#6)? This is the single most useful step.
2. **Add instrumentation if you don't have it:** log bookmark create/delete/replace with user_id, device_id, client timestamp, and request source. Include a reason code on every delete path. Log client-side save failures.
3. **Switch deletes to soft delete (`deleted_at`, `deleted_by`)** if they are hard deletes. This lets you trace every disappearance and restore data for users.
4. **Audit the sync API:** if any endpoint accepts "here is the full list," treat it as a prime suspect and move to delta operations or versioned writes (ETag / version check to reject stale writes).
5. **Try reproducing the likely cases deliberately:** two devices with one offline, add on A, edit on B, reconnect B. Add a bookmark, then immediately kill the app or go offline. Log out/in as guest. Test on Safari after clearing site data.
6. **Segment the support reports** by platform, browser, multi-device use, and date vs. releases.

## Assumptions
- Bookmarks persist beyond a single session and are expected to sync or survive reloads.
- "Can't reproduce" means single-device, happy-path testing so far.
- You have some access to server logs or the database.

## Risks
- **Real user data loss** is likely happening now. Without soft deletes or backups, it may not be recoverable. Consider soft deletes as an immediate mitigation even before the cause is found.
- **Trust impact:** users stop relying on the feature, and churn on this is often silent.
- **Fixing the wrong layer:** patching the UI when the cause is a sync overwrite won't help. Confirm with data (step 1) before changing code.

Send me your answers to the questions above, or one affected user's DB/log trail, and I'll narrow this to a specific cause and fix.
