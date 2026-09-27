# Coolbrador mediaScan (Arachnid Shield proxy)

Illegal media matching stays server-side. Do not put Shield username/password in frontend JS.

## Credentials
1. Register at https://shield.projectarachnid.com (Canadian Centre for Child Protection).
2. Set Firebase secrets:
   - `ARACHNID_SHIELD_USER`
   - `ARACHNID_SHIELD_PASS`
3. Deploy functions, then add a hosting rewrite from `/api/media-scan` to `mediaScan`.

Until credentials exist, the client still hard-blocks porn via NSFWJS + text heuristics and soft-skips the remote hash scan.
