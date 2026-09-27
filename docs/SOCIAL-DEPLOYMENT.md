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
- Moderators review reports at `/mod.html`; access requires the Firebase custom
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
# Or against the existing dev emulators:
npm run test:rules
npm run test:unit
```

`npm run dev` uses demo Firebase services; it never deploys production data.
For the Functions routes too, use Node 20 (the functions package engine):

```sh
mise exec node@20 -- npm run dev:full
# In another terminal, with the full stack running:
mise exec node@20 -- npm run test:functions
```

The full stack uses functions on 5001 behind the same HTTP entry point on 8000.
Normal dev serves bundled game JSON; full dev routes game JSON and `/api/*` to
Functions. Resetting `.emulator-data/` resets local fixtures. Static archive pages
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
4. Deploy Hosting. Confirm sign-up, posting and two-account interactions against
   the deployment using dedicated test accounts. Assign moderator claims only from
   a trusted Admin SDK environment; never through browser UI.
5. For live Chipper delivery, deploy Functions and Hosting. The previous setup
   notes report that this requires a Blaze upgrade; verify billing prerequisites.
   Existing static files take priority over Hosting rewrites. After backing them
   up, move the three files below outside the published Hosting directory before
   the live-feed deployment (keep `data/community-archive.json` public):

   - `data/chipper_game_board_feed.json`
   - `data/chipper-miiverse.json`
   - `data/boards/BeeSid.json`

   Preserve the curated `chipper/feed` payload through a trusted admin import or
   moderator publishing. Confirm both `/api/chipper-game-board-feed` and the
   legacy `/data/chipper_game_board_feed.json` return the same live contract.
   Until this activation, the legacy game URLs continue serving their archive.
6. Keep `ARACHNID_SHIELD_USER` and `ARACHNID_SHIELD_PASS` server-side when enabling
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

## Bounds and remaining product work

This is a working shared social foundation, not a claim that every possible
production-scale problem is solved. Current bounds: people discovery reads 100
profiles, conversations show the latest 100 messages, replies show the first 200,
polls show 30, and repost discovery reads 100. Posts have explicit load-more.
Advanced historical profile card builders and demo-only polls/moderation records
are not automatically migrated into trusted server data. Palette/wallpaper settings,
simulations and game pages remain available.

Before opening a large public service: add server-side abuse throttling/App Check,
verified media moderation, account recovery/deletion workflows, pagination at all
bounds, retention/cleanup of orphaned uploads and deleted-post subcollections,
private message attachments and any game-account verification protocol. Vote
choices are public, as disclosed beside the chart. Polls are community voting,
not financial prediction markets or betting odds.
