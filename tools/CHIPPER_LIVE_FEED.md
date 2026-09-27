# Chipper live BeeSid feed (coolbrador.com only)

Chipper must **NOT** call Firestore. Use coolbrador.com URLs only.

## Primary GET (poll on scene load + every ~10 min)

```
https://coolbrador.com/data/chipper_game_board_feed.json
```

Alias (same JSON bytes today; same live function when Blaze is on):

```
https://coolbrador.com/data/chipper-miiverse.json
```

Optional API alias (rewrite → same handler once Functions deploy):

```
https://coolbrador.com/api/chipper-game-board-feed
```

Board mirror:

```
https://coolbrador.com/data/boards/BeeSid.json
```

Raw feed JSON (no Firestore unwrap). Posts are **newest-first**.

## Live sync status (2026-09-26)

| Path | Status |
|------|--------|
| One-shot static hosting deploy | **DONE** — tone-switched BeeSid bodies live |
| Hosting rewrite → Cloud Function reading Firestore `chipper/feed` | **BLOCKED** — project is Spark; Blaze required to deploy Functions (`cloudbuild.googleapis.com`) |
| Upgrade URL | https://console.firebase.google.com/project/coolbrador/usage/details |

### After Blaze upgrade (agent / Alan)

1. `firebase deploy --only functions,hosting --project coolbrador`
2. **Remove or move** public static copies so rewrite wins (Hosting serves existing files before rewrites):
   - move `data/chipper_game_board_feed.json` → `data/_static_fallback/chipper_game_board_feed.json`
   - move `data/chipper-miiverse.json` → same folder
   - move `data/boards/BeeSid.json` → same folder
3. Redeploy hosting. GET coolbrador.com paths then return LIVE Firestore payload.

Until Blaze: Save still auto-pushes Firestore (`js/cb-chipper-feed-sync.js`). Chipper keeps using coolbrador.com static JSON; an agent must `build_chipper_feed.py` + `firebase deploy --only hosting` after tone/Save changes (or Alan upgrades Blaze).

## Feed JSON shape

```json
{
  "board": "chipper-game-board",
  "version": 5,
  "meta": { "source": "...", "derivedAt": "...", "boardVersion": 5 },
  "sensitivity": { "webDefault": "show", "chipperDefault": "hide" },
  "posts": [
    {
      "id": "cg-10",
      "body": "DIED TO THE SAME FIRE 12 TIMES AND NOW IM BANNED FROM THIS GAME WHATEVER ILL GO PLAY RIVALS",
      "yeahs": 0,
      "views": 0,
      "url": "https://coolbrador.com/b/BeeSid/post/10/comments/",
      "boardPostId": "1785621600000"
    }
  ]
}
```

## Write path (unchanged)

BeeSid Save → `CoolbradorChipperFeed` debounced PATCH → Firestore `chipper/feed` (`payload` + `board` string fields). That is the **write** store for the future Function; Chipper never reads it.
