# EU launch assessment and social UI changes

Reviewed 27 September 2026. This is an engineering assessment, not a certification
of legal compliance. EU/EEA rules and individual countries' laws differ; the UK
and Switzerland need separate assessment. The operator, establishment, audience,
turnover/headcount and actual provider configuration remain unconfirmed.

## Sources checked directly

- [Digital Services Act, Regulation 2022/2065](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng), especially Articles 3(h), 11–20, 25–28.
- [GDPR, Regulation 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), Articles 5–8, 12–22, 25, 28 and Chapter V.
- [Mastodon user moderation documentation](https://docs.joinmastodon.org/user/moderating/): keyword filters, mutes, blocks, contextual reports.
- [AT Protocol moderation guide](https://atproto.com/guides/moderation), reached from Bluesky's official documentation: labels, human review and reporting tools.
- [European Commission cookie policy](https://commission.europa.eu/cookies-policy_en): distinguishes necessary and optional storage; this page is an example, not legal authority for this application's configuration.

Research used direct HTTPS retrieval because the web-search tool returned an
authentication error. Reddit and Bluesky marketing support pages returned 403;
no conclusions were drawn from those unavailable pages.

## What the law actually requires

DSA Article 3(h) refers to illegality under applicable Union or national law. The
DSA does not make every offensive post illegal. Our community rules can prohibit
harassment, threats, exploitation, privacy abuse and scams more broadly. A
content warning never exempts illegal material from action.

Hosting services need accessible electronic notices (Article 16), including exact
location, explanation, reporter identity/contact subject to the child-abuse
exception, and good-faith statement. Contactable reporters need acknowledgement,
decision and redress information. Restrictions generally require specific reasons
for affected users (Article 17). Suspected crimes involving a threat to life or
safety require an operational escalation process (Article 18).

DSA Article 19 exempts qualifying micro/small enterprises from most Section 3
platform duties, including the Article 20 complaint system and Articles 25–28,
unless designated very large. This does not exempt Articles 11–14 or hosting
notice/reasons obligations. Article 15 has a separate small-enterprise exception.
Do not assume a size exemption without evidence. Avoiding deceptive choices,
explaining feeds and protecting minors remain useful design defaults.

GDPR requires a lawful basis, purpose limitation, data minimisation, security,
transparent notices and rights handling. A content download supports access and
portability but is not an exhaustive Article 15 response. Article 20 applies under
its own conditions and must not impair other people's rights. Article 8's
13–16 variation concerns consent-based processing of directly offered information
society services, not a universal European account-age rule. No invented age
checkbox, parental-consent claim or ID collection was added.

## Implemented

- Theme tokens for social controls, settings, chart series, drawing paper/ink,
  modal backdrop, shadows and errors; inherited colors fixed in light/dark mode.
- Responsive toolbars, profiles, poll controls and message composer; 44px touch
  targets, input font size, keyboard-scrollable messages, dialog labeling/focus,
  outside-click/Escape menu dismissal and accessible attachment control.
- Device-only muted phrases; sensitive content defaults collapsed. Existing user
  preferences remain respected. No autoplay, engagement ranking or betting added.
- Public safety/rules and data-information pages linked from footer, login,
  support and settings; visible explanation of chronological feeds and game reuse.
- Structured member reports; signed-out visitors can prepare an email notice
  with exact URL, facts and good-faith statement. Child-abuse notices can omit
  identity/contact. The UI explicitly says drafting is not submission.
- Moderators record a rule/legal basis and specific explanation. Each recipient
  receives a separate private decision copy; reporter identity is not shared
  with the author. Users can read pending reports and decisions and request
  review by email. No claim of a complete Article 20 system is made.
- Authenticated, recent-login, rate-limited JSON account export. It excludes
  tokens/passwords and other participants' message bodies, includes media links,
  and fails explicitly rather than silently truncating oversized accounts.

## Operator work before EU public launch

1. Confirm legal operator, postal/contact details, establishment and any required
   EU representative; verify the existing support mailbox is monitored and publish
   required authority/recipient contacts and supported languages.
2. Complete and approve a real privacy notice and terms: purposes and legal bases,
   processors/subprocessors, transfer safeguards, retention including logs/backups,
   supervisory authority and rights response workflow. The public data page
   expressly identifies the incomplete notice rather than inventing these facts.
3. Verify the notice inbox, acknowledgement, response times, emergency escalation,
   moderator training and review/redress workflow. Email draft UI cannot prove
   that a message was received. Large drafts may need copying manually.
4. Assess minors' access and country-specific requirements. No age assurance,
   parental permission, private minor profiles or minor-specific DM rules are
   claimed. Public-by-default profiles and open messaging need this decision.
5. Assess whether Article 20 complaints, transparency reporting/database,
   advertising and recommender duties apply; verify company-size evidence.
   The chart remains a public poll display, not a prediction market.
6. Inventory production cookies, browser storage, third-party calls and analytics.
   Do not deploy optional tracking before the appropriate consent controls; a
   decorative cookie banner does not establish consent. No analytics was added.
7. Confirm configured media scanning/quarantine and provider contracts. Existing
   best-effort upload checks do not prove illegal-content detection or removal.
8. Define retention and assisted exports for large accounts. The bounded export
   scans legacy UID-keyed votes/reactions and needs a scalable indexed migration
   before large deployments. Service logs/backups need separate rights handling.
9. Deploy Firestore rules and the export Function with Hosting; run the existing
   profile privacy migration before launch. Legacy public contact data is not
   fixed merely by updating frontend copy.

No production deployment, legal-policy approval, email submission, provider
configuration or external enforcement report was performed by this task.
