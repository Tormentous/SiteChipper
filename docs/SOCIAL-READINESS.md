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
