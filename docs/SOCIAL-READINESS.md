# Social readiness work log

## Objective
Make Coolbrador usable as a shared social site while keeping its community boards,
Miiverse-style posts, BeeSid/Chipper game feed, games, and theme customization.
Keep this branch in a draft PR and push reviewable checkpoints about every ten minutes.

## Confirmed baseline problems
- Sign-up allocates an unauthenticated counter before creating the Auth user; the
  checked-in rules deny counters and profiles, so sign-up cannot complete.
- Posts, replies, reactions, friends, direct messages, notifications and polls
  largely live only in localStorage and do not reach another browser.
- Browser-local identity allocation can assign different people the same ID.
- The Community Friends tab filters Chipper keywords instead of friendships.
- Share links depend on position in a local array, so another browser can open
  the wrong post or no post.
- Password reset is a placeholder; reCAPTCHA initialization gates login listeners.
- Demo users/presence/messages appear as actual social activity.
- Chipper's legacy publisher uses a hard-coded production Firestore REST URL.
- Firestore permits anonymous writes to the entire Chipper feed.
- The chart fabricates a rising history when only one observation exists.
- `npm test` points at a missing tests directory.

## Implementation sequence
1. Account-backed public profiles, protected social collections, and real shared
   posts/replies/reactions, stable links and useful error states.
2. Discover people, mutual friends, private direct messages, notifications and
   profile editing; fix navigation and mobile/keyboard usability.
3. Persistent community polls and accessible interactive history charts using
   observed votes. Preserve the Chipper JSON contract and archived game posts.
4. Emulator security/integration tests, shared-browser journeys, CodeRabbit review.

## Deployment boundaries
The local development server runs Firebase Auth/Firestore/Storage emulators.
Production deployment and existing-data migration must be reviewed separately.
The repository records a Spark-plan limitation for live Cloud Functions. Static
Chipper JSON stays available until the documented live-feed deployment is enabled.

## Checkpoint: shared social implementation
Implemented Firebase-backed accounts and public profiles, stable post links,
media uploads, posts/replies/Yeah/reposts, friend requests, blocking, private text
messages, reply notifications, polls, moderator reports, and history charts.
The original game JSON files are retained. Legacy board posts are archived;
new shared posts live in separate Firestore collections. Existing palette,
wallpaper, Chipper game presentation, simulations, and account-link pages remain.

First rules pass: 10/10 tests passed. Sign-up and a shared BeeSid post exercised
in the local browser. Three game-feed projection tests passed. Remaining:
full browser journeys, deployment/migration documentation, and CodeRabbit review.

GitHub checkpoint pushes work. Direct draft-PR creation was rejected by the
runtime-owned Git delivery wrapper, which states it will handle delivery after
the turn. No alternative API is used to bypass that restriction.

## Checkpoint: verified user journeys and recovery
- Two independent local accounts exercised shared posts, replies, Yeah/repost,
  friend request/acceptance, reply notifications and private messages in both
  directions. Community creation and image upload succeeded in the browser.
- Poll history verified at the first vote (100/0) and second vote (50/50), including
  keyboard Home/End controls and the observation table.
- Mobile testing found and fixed an oversized header avatar covering content;
  menu Escape now restores focus and closed navigation is not tabbable.
- Profile sanitation migration passed dry-run/apply/idempotence verification with
  synthetic local fixtures. See SOCIAL-DEPLOYMENT.md for rollout ordering.
- CodeRabbit CLI review was attempted but is disabled for this task. This is a
  review blocker, not a clean-review result. Final emulator suite and full Functions
  smoke checks remain in progress.

## Final verification checkpoint
- Full emulator suite: 19 tests passed (12 security, four game projection, two
  chart history, one profile migration). After the final projection adjustment,
  all six unit tests passed again; rules and migration inputs were unchanged.
- Live Functions smoke passed shared/curated feed merging, legacy URL parity,
  board mirroring, anonymous/non-moderator rejection, and moderator publishing.
  The publishing check exposed a broken Admin Timestamp call, now corrected.
- Mobile profile navigation and saved biography were verified through the menu.
  A backdrop stacking bug that intercepted menu taps was found and corrected.
  The actual Friends feed showed a friend's General post without game keywords.
- Poll content accessibility audit: zero violations, one contrast check requiring
  manual review for the SVG chart. Keyboard chart and mobile controls were exercised.
- These checks use synthetic local accounts and emulators. Production migration,
  deployment and the launch hardening in SOCIAL-DEPLOYMENT.md remain outstanding.
  CodeRabbit review remains unavailable because it is disabled in task settings.

## Continued launch work
- Added account verification, password/email changes and permanent deletion controls.
  Deletion uses a recent authenticated login, a write-lock tombstone, and retryable
  background cleanup. Legacy profile IDs and other people's content are handled.
- Removed fixed history cutoffs for replies, messages, notifications, polls and
  reports. Discovery pages load progressively; friendship/conversation identities
  resolve separately. Friends feeds query friend authors directly.
- Added private unread conversation state, draft restoration, mark-all-read and
  owner controls to close/delete polls.
- Added a public-only Hosting artifact, excluding tools, tests and local state.
  The live deployment omits static game-feed overrides; packaged curated archives
  are now a Functions fallback, preserving the original feed on first deployment.
- 22-test lifecycle gate passed. HTTP deletion worker and mobile password-change
  flows passed. Pagination browser fixtures exposed 37 messages and 36 replies.
  The account settings accessibility audit reported zero violations.

## Launch-work verification checkpoint
- Added drawing posts, indexed shared-content search, visible content preferences,
  reply/poll reporting and Firestore-enforced posting cooldowns. Replaced remaining
  demo search/sidebars and the nonfunctional Gift donation screen with real links
  and a shared appreciation board. Home puts the composer before board browsing.
- Full expanded emulator suite passed 34/34. This includes private-message activity,
  account locking, shared-image retention, search backfill, routes and build policy.
- Live HTTP smoke passed packaged Chipper archive fallback, shared/curated merging,
  authorized publishing, account deletion and avatar-replacement cleanup. The
  media proxy passed local authentication/quota/unconfigured-provider checks only.
- Browser checks passed drawing upload, real search, older history, private drafts,
  unread conversation state, poll closing/report/removal, profile blocking, password
  changes and permanent account deletion. Drawing and account accessibility audits
  had zero violations; decorative icon contrast required manual inspection.
- Hosting artifact: 218 public files; 88 checked asset references resolve. Syntax
  passed across all 38 changed JavaScript modules at this checkpoint.
- CodeRabbit review is still disabled by task configuration. GitHub accepted b1268ff
  then rejected subsequent pushes with403. Later work is committed locally and
  preserved in the downloadable Git recovery bundle. Production remains undeployed.

## EU safety and interface follow-up

- Researched the official DSA/GDPR texts, Mastodon user controls and AT Protocol
  moderation documentation. Applicability and operator launch gaps are recorded
  in `EU-SAFETY-AND-UI.md`; this work does not certify legal compliance.
- Added safety/rules, private moderation decisions with required reasons, pending
  report visibility, account-free email-notice preparation, and a current-data
  export with recent-login checks, rate limits and bounds. No emails are sent by
  the notice builder; monitoring and acknowledgement require operator setup.
- Added muted phrases and safer initial content visibility. Fixed light-mode text
  inheritance/contrast, small-screen toolbars and profiles, touch targets, dialog
  labels/focus and retry behavior, attachment controls, scrollable message history,
  settings navigation and theme persistence on login. New component colors use
  palette tokens; chart series and drawing colors are centrally defined.
- Main automated gate passed37/37. Browser checks exercised reports and moderator
  receipts, notice drafting, muted content and actual account download. Live HTTP
  export authentication/recent-login/cooldown and account deletion passed.
- Light-home contrast and login-link accessibility findings were fixed; final
  corresponding audits have zero violations. Settings and Safety audits also
  have zero violations. Poll SVG axis contrast remains a manual check, inspected
  visually in both modes; no complete sitewide WCAG certification is claimed.
- Checkpoint5a2dfcf pushed successfully, including the previously blocked commits.
  CodeRabbit review remains disabled by the task setting.
