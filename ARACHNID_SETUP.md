# Coolbrador media scan proxy

The `/api/media-scan` function requires a Firebase bearer token and enforces a
per-account cooldown. Provider credentials stay server-side; Functions binds the
`ARACHNID_SHIELD_USER` and `ARACHNID_SHIELD_PASS` secrets.

Set these in the production Firebase project and deploy the function plus Hosting:

```sh
firebase functions:secrets:set ARACHNID_SHIELD_USER
firebase functions:secrets:set ARACHNID_SHIELD_PASS
```

For local Firebase emulators, create ignored `functions/.secret.local` with empty
values for both names. The proxy returns501 (unconfigured) rather than contacting
a real provider. `npm run test:media` checks local authentication and quotas.

The provider's live response contract has not been verified in this task. The
approved emulate v0.0.1 catalog has no Arachnid service. Unit tests check positive,
negative, malformed and failed response handling without claiming to validate the
upstream. The client treats this scan as best-effort. Direct public Storage
uploads do not enforce a server quarantine or review workflow.
