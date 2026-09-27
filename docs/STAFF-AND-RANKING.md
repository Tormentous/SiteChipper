# Staff operations and return-visit feed

## Feed ranking

Latest and Friends remain chronological. For you ranks the currently loaded
candidate window, not the whole database. It deduplicates reposts and filters
blocked authors/sharers before ranking. Scores are:

- freshness: `4 / (1 + ageHours / 24)` using the original creation time;
- chosen community: +3;
- accepted friend: +2;
- not seen on this device in the last seven days: +1;
- diversity: greedy penalty of2 per already selected author and0.5 per community.

Ties use time then stable ID. There is no inferred sensitive-trait profile,
remote impression telemetry, dwell-time optimisation, paid ranking or fake
activity. Ranking does not read the contents of private messages. Interests and
up to500 seen post IDs are stored per account on this device; a post is marked
seen when at least half is visible in the For you feed. The ranking uses the
initial seen snapshot for the page so observations do not immediately reorder it.
Settings allows interest selection and reset. Account deletion clears this local
cache on the device where deletion was requested. Other-device data can be cleared
in that device's settings/browser storage.

This is an explainable first ranking algorithm, not proof of increased retention.
Validate actual usefulness and voluntary return rates with a consent/measurement
plan before making product claims. Candidate retrieval remains bounded to loaded
posts, and pagination/very large feeds need server-side candidate indexing later.

## Staff roles

| Action | Moderator | Lead | Administrator |
|---|---|---|---|
| Read queue/context/history/directory | Yes | Yes | Yes |
| Claim an unassigned case | Yes | Yes | Yes |
| Notes/triage/resolve own ordinary case | Yes | Yes | Yes |
| Change another person's case/assignment | No | Yes | Yes |
| Resolve/clear escalated case | No | Yes | Yes |
| Manage staff access / read access audit | No | No | Yes |

Employees first create real accounts through the normal sign-in flow. A trusted
operator bootstraps the first administrator using Application Default Credentials:

```
GCLOUD_PROJECT=<explicit-project> node tools/bootstrap-staff.cjs --uid=<account-uid>
# Review dry-run output, then repeat with --apply.
```

The command verifies the account and refuses when an active administrator already
exists. A transaction protects initial bootstrap against competing runs. Recovery
if all administrators disappear requires a trusted operator, not self-service
privilege escalation. A signed-in administrator can grant roles to existing UIDs,
change roles and disable staff access in `/mod.html`; these changes require a
login within five minutes. An administrator cannot change their own staff role.
Verify employee identity/UID through company onboarding before granting access.
No invitations or emails are sent by these tools.

Legacy `moderator:true` claims remain a migration fallback only when no staff
record exists. An explicit inactive staff record overrides a stale legacy claim.
Account deletion disables and anonymizes the staff-directory record. Disabling
staff access does not disable the person's social account. The Chipper publisher
uses the same active-staff check.

## Case workflow

Queue pages contain50 reports, oldest first. Search and status/assignment/priority
filters cover the loaded records; counts are not global service statistics.
Choose a case and claim it, review current text and the original content, add
internal notes, set priority/escalation, and record a rule/law plus explanation.
Ordinary moderators cannot resolve an escalated case. Leads/admins can reassign
to an active employee or release a case.

Every mutation checks the current staff role, account tombstone, assignment and
case version in a Firestore transaction. Concurrent changes return a conflict;
refresh before deciding again. Staff writes through the browser SDK are denied.
Resolutions atomically write case history, separate private recipient receipts,
remove the pending report, and optionally delete content. Deletion is permanent;
there is no false “restore” button. Appeals continue through the documented
support route. Internal notes are never copied into public/recipient decisions.

Notes and case/access events are append-only through this service. Case history
keeps actor IDs, assignment, timestamps and decision reasons, without copying
media or retaining the original reporter identity in closed-case metadata.
Company operators must define lawful retention/access and staff-data rights
handling for these operational records. No automated retention policy, enterprise
SSO, mandatory staff MFA, scheduled escalation pager, or restored-content appeals
system is claimed. Plan those before a staffed public launch.

## Deployment and verification

Deploy Functions (`staffModeration` and updated Chipper publisher), the new
moderationCases status/updatedAt index, Firestore rules and Hosting together.
The old client-only moderator removal path is intentionally denied by rules so
company actions cannot skip the server audit. New UI requires the staff API.
Run `npm test` with the documented Node20/Java21 environment, plus the local
staff HTTP and browser workflows. Production deployment is a separate step.
