# Deploying the shared social site

## What is implemented

- Firebase email/password sign-up and sign-in, password reset and existing SMS
  MFA sign-in. Unique Auth-backed identities; existing numeric profile URLs are
  retained. Public profiles exclude email addresses for newly created accounts.
- Live community posts, stable `/post/{id}` links, edits/deletes, media uploads,
  replies, Yeah reactions, reposts, community creation and owner-only descriptions.
- Friend requests and recipient acceptance, a real Friends feed, blocking enforced
  for direct messages/replies/reactions, private text conversations and reply alerts.
- Immutable one-vote-per-account polls. Charts use actual timestamped votes with
  time ranges, pointer/touch exploration, keyboard controls and a data table.
- In-page drawing canvas with touch, mouse, keyboard, undo and local drafts.
- Indexed public search for posts and profiles, replacing seeded demo search results.
- Account verification, password/email changes and permanent account deletion.
  Deletion locks writes immediately and retries server cleanup until completion.
- Per-account posting cooldowns enforced by Firestore rules, including direct SDK
  writes. Reposts/reactions remain transactional. Private unread message indicators.
- Moderators review post, reply and poll reports at `/mod.html`; access requires the Firebase custom
  claim `moderator: true`. The old browser PIN is no longer an authorization method.
- Original Chipper JSON and posts are preserved. Live Functions merge shared
  BeeSid posts into the established game-feed JSON contract. Game clients keep
  using HTTPS on the Coolbrador domain, never Firestore directly.
- The Chipper profile export is explicitly a public display card, not an account
  authentication token. Secure game-account verification requires game-client and
  server work; the previous browser-only random code never implemented redemption.

## Local verification

```sh
npm ci
npm --prefix functions ci
mise exec -- npm run dev
# With dev stopped (test runner owns the emulator ports):
mise exec -- npm test
# Rules-only runner also needs the dev stack stopped:
mise exec node@20 -- npm run test:rules
# Unit checks need no running services:
npm run test:unit
```

`npm run dev` uses demo Firebase services; it never deploys production data.
For the Functions routes too, use Node 20 (the functions package engine):

```sh
mise exec node@20 -- npm run dev:full
# In another terminal, with the full stack running:
mise exec node@20 -- npm run test:functions
mise exec node@20 -- npm run test:deletion
mise exec node@20 -- npm run test:media  # only with local provider secrets empty
```

The full stack uses functions on 5001 behind the same HTTP entry point on 8000.
Normal dev serves bundled game JSON; full dev routes game JSON and `/api/*` to
Functions. For local media-proxy testing, use an ignored `functions/.secret.local`
with empty `ARACHNID_SHIELD_USER=` and `ARACHNID_SHIELD_PASS=` entries. This
keeps the real provider disabled and avoids remote secret retrieval. Resetting `.emulator-data/` resets local fixtures. Static archive pages
read `data/community-archive.json`, so live-feed updates cannot renumber old links.
The full-stack launcher repairs the historical Functions SDK shim's missing
execute permission locally. Dependency installation can change the repository's
tracked `functions/node_modules`; keep generated dependency churn out of app commits.

## Production rollout order

This branch does not deploy itself. Use the reviewed commit and the actual
production Firebase project. Export/backup Firestore before any migration.

1. Enable Email/Password in Firebase Auth and configure the site's authorized
   domains/password-reset email templates. Review the existing SMS MFA configuration
   if it is used. New signup no longer prompts for unsolicited SMS enrollment.
2. **Sanitize existing profiles before allowing public profile reads.** Historical
   code stored email addresses in public profile documents. Use a trusted Admin
   SDK environment with Application Default Credentials and set `GCLOUD_PROJECT`
   explicitly. Dry-run first:

   ```sh
   GCLOUD_PROJECT=<reviewed-project-id> node tools/migrate-social-profiles.cjs
   GCLOUD_PROJECT=<reviewed-project-id> node tools/migrate-social-profiles.cjs --apply
   ```

   This moves contact email/phoneNumber to the client-inaccessible
   `accountPrivate/{uid}` collection and deletes legacy credential fields. It leaves
   profile IDs and public biographies intact. Resolve any ownerless records before
   continuing. Do not publish profile exports or migration logs containing contacts.
3. Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules`; wait for
   indexes to finish building. New uploads are public post/profile media at
   `media/{uid}/{file}` with owner-only writes, allowed MIME types and a 10 MB limit.
4. Backfill public search metadata after sanitizing profiles:

   ```sh
   GCLOUD_PROJECT=<reviewed-project-id> node tools/index-social-search.mjs
   GCLOUD_PROJECT=<reviewed-project-id> node tools/index-social-search.mjs --apply
   ```

   Search indexes public post text, display names and biographies only. It matches
   complete words (up to 100 distinct words per record), with progressive results.
5. Deploy Functions and Hosting together for account deletion, cleanup and live
   game delivery. Confirm sign-up, posting and two-account interactions against
   the deployment using dedicated test accounts. Assign moderator claims only from
   a trusted Admin SDK environment; never through browser UI.
6. Hosting predeploy builds `.hosting/`, an explicit public-asset artifact.
   Tools, tests, dependencies, local state and server code are excluded. It omits
   the three legacy static game-feed files so Hosting rewrites reach Functions.
   Functions predeploy packages those curated archives as fallback data: the
   original posts remain available even before the first moderator publish.
   No manual removal of tracked archive files is needed. Existing `chipper/feed`
   data takes precedence. The repository previously reported a Spark-plan
   limitation; verify the Functions/Blaze prerequisite before rollout. Confirm both `/api/chipper-game-board-feed` and the
   legacy `/data/chipper_game_board_feed.json` return the same live contract.
   `npm run build:archive` builds a static archive variant for inspection; normal
   Firebase deployment rebuilds live mode.
7. Keep `ARACHNID_SHIELD_USER` and `ARACHNID_SHIELD_PASS` server-side when enabling
   the media matching service. Existing client-side media checks are best-effort;
   they do not constitute enforced server-side media moderation. Direct Storage
   uploads require a separate quarantine/scanning pipeline for enforced scanning.

## Existing browser data

Browser-local posts/messages/friendships cannot safely be declared shared data:
there is no trusted ownership record and many entries are seeded demos. This
change leaves those localStorage records intact and never silently uploads them.
Original bundled posts are accessible through archive URLs. A reviewed migration
for real historical browser-only content would require user exports and ownership
verification. The public profiles collection is reused without changing its IDs.

## Cleanup, quotas and operations

- Deploy all exported lifecycle triggers. Deleted posts/replies/polls remove their
  related records and owned media. Shared media is retained while another public
  post, reply or profile references it. Replaced profile uploads are cleaned up.
- Account deletion requires a login within five minutes and explicit confirmation.
  `accountDeletions/{uid}` is private and locks all social writes, even with an old
  token. Retry-enabled jobs remove the account's authored content and uploads;
  other people's messages and community discussions remain. Community ownership
  becomes unassigned. The completion tombstone remains to prevent stale-session
  recreation. Monitor jobs that remain pending/running and Cloud Functions errors.
- Firestore cooldowns: posts 5 seconds, replies/friend requests 2 seconds,
  messages 1 second, polls 30 seconds, reports 10 seconds, communities 60 seconds.
  The atomic activity stamp must match the specific created record; clients cannot
  reset it or use one stamp for multiple posts. Media proxy calls have a 2-second
  per-account quota and require authentication. These controls do not replace
  account-creation/IP abuse controls or App Check configuration.
- History windows grow on demand for posts, reposts, messages, replies, polls,
  notifications and reports. Friends query their authors directly. Public people
  discovery uses cursor pages; friends and conversation participants resolve
  independently. Linked replies/polls outside the initial window remain reachable.

## Remaining external requirements and bounds

Production has not been deployed from this task. The privacy migration, public
search backfill, Firebase configuration and deployment above are required. Actual
provider email delivery and existing SMS MFA were not exercised against production.

The media proxy now requires authentication, binds Firebase secrets, handles
provider failures explicitly and does not misread negative-match results. The
actual Arachnid upstream is unverified without credentials; approved emulate
v0.0.1 has no Arachnid service. Browser checks remain best-effort and public Storage
uploads do not enforce quarantine/scanning. Enforced moderation of every upload
requires a separate server quarantine pipeline and an operational review/provider
policy. Failed/unreferenced uploads may still need an operational retention sweep.

Growing live windows reread loaded history, and reaction/poll charts subscribe to
individual records. Very large communities would need aggregate counters, history
buckets and tighter listener budgeting. Search is word matching, not fuzzy or
semantic search. Private messages currently support text. Game-account verification
requires a compatible game-client protocol; the public profile card is deliberately
display information only. Vote choices are public as disclosed beside the chart.

Appearance settings, simulations, game pages and original archived posts remain.
Gift Drive is now a shared appreciation board; no fabricated donor totals, prizes
or payment buttons are presented. Historical local-only profile builders and demo
moderation/polls are not migrated into trusted server records.
