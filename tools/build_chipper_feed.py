#!/usr/bin/env python3
"""Derive Chipper game board feed from data/boards/BeeSid.json only.

No hardcoded post bodies. yeahs/likes = len(yeahs) or int; views from board.
Writes:
  data/chipper_game_board_feed.json
  data/chipper-miiverse.json  (same bytes)
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SITE = "https://coolbrador.com"
BOARD_REL = Path("data/boards/BeeSid.json")
OUT_FEED = Path("data/chipper_game_board_feed.json")
OUT_ALIAS = Path("data/chipper-miiverse.json")

SENSITIVITY = {
    "webDefault": "show",
    "chipperDefault": "hide",
    "adultHiddenByDefault": True,
    "pornHardBlocked": True,
    "note": (
        "Illegal/porn media hard-blocked sitewide. 18+ hidden by default. "
        "Sensitive speech: web SHOW, Chipper HIDE. Seed posts are funny/clean only."
    ),
}


def abs_url(url: Any) -> str:
    if url is None:
        return ""
    s = str(url).strip()
    if not s:
        return ""
    if s.startswith("data:") or s.startswith("blob:"):
        return s
    if s.startswith("//"):
        return "https:" + s
    if s.startswith("http://") or s.startswith("https://"):
        return s
    if s.startswith("/"):
        return SITE + s
    return SITE + "/" + s.lstrip("/")


def yeah_count(p: dict) -> int:
    y = p.get("yeahs")
    if isinstance(y, list):
        return len(y)
    try:
        n = int(y)
        return n if n >= 0 else 0
    except (TypeError, ValueError):
        return 0


def view_count(p: dict) -> int:
    try:
        n = int(p.get("views") or 0)
        return n if n >= 0 else 0
    except (TypeError, ValueError):
        return 0


def media_list(p: dict) -> list:
    m = p.get("media")
    if not m:
        return []
    if isinstance(m, list):
        out = []
        for item in m:
            if isinstance(item, dict) and item.get("url"):
                out.append(
                    {
                        "url": abs_url(item.get("url")),
                        "type": item.get("type") or "image",
                    }
                )
            elif isinstance(item, str) and item.strip():
                out.append({"url": abs_url(item), "type": "image"})
        return out
    if isinstance(m, dict) and m.get("url"):
        return [{"url": abs_url(m.get("url")), "type": m.get("type") or "image"}]
    if isinstance(m, str) and m.strip():
        return [{"url": abs_url(m), "type": "image"}]
    return []


def post_ts(p: dict) -> float:
    ts = p.get("timestamp") or ""
    if isinstance(ts, (int, float)):
        return float(ts)
    s = str(ts).strip()
    if not s:
        try:
            return float(p.get("id") or 0)
        except (TypeError, ValueError):
            return 0.0
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s).timestamp()
    except ValueError:
        try:
            return float(p.get("id") or 0)
        except (TypeError, ValueError):
            return 0.0


def post_id_num(p: dict) -> int:
    try:
        return int(p.get("id") or 0)
    except (TypeError, ValueError):
        return 0


def chrono_sort(posts: list) -> list:
    return sorted(posts, key=lambda p: (post_ts(p), post_id_num(p)))


def handle_of(p: dict, author: str) -> str:
    h = str(p.get("handle") or author or "").strip()
    if h.startswith("@"):
        h = h[1:]
    return h.lower() or "unknown"


def body_of(p: dict) -> str:
    # Prefer text, then body — never invent.
    if p.get("text") is not None:
        return str(p.get("text"))
    if p.get("body") is not None:
        return str(p.get("body"))
    return ""


def build_feed(board: dict) -> dict:
    posts_in = board.get("posts")
    if not isinstance(posts_in, list):
        posts_in = []
    board_version = int(board.get("version") or 0)
    chrono = chrono_sort([p for p in posts_in if isinstance(p, dict)])
    out_posts = []
    for i, p in enumerate(chrono):
        n = i + 1
        yc = yeah_count(p)
        author = str(p.get("username") or p.get("displayName") or "unknown")
        handle = handle_of(p, author)
        display = str(p.get("displayName") or author)
        cg_id = f"cg-{n:02d}" if n < 100 else f"cg-{n}"
        out_posts.append(
            {
                "id": cg_id,
                "author": author,
                "display_name": display,
                "handle": handle,
                "username": handle,
                "avatar_url": abs_url(p.get("avatar_url") or ""),
                "feeling": p.get("feeling") or "happy",
                "body": body_of(p),
                "media": media_list(p),
                "likes": yc,
                "yeahs": yc,
                "views": view_count(p),
                "url": f"{SITE}/b/BeeSid/post/{n}/comments/",
                "sensitive": bool(p.get("sensitive")) if "sensitive" in p else False,
                "contentWarnings": list(p.get("contentWarnings") or []),
                "boardPostId": str(p.get("id") or ""),
                "timestamp": p.get("timestamp"),
            }
        )
    out_posts.reverse()  # newest-first for Chipper
    derived_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "board": "chipper-game-board",
        "version": board_version or 1,
        "meta": {
            "source": "derived-from-boards/BeeSid.json",
            "derivedAt": derived_at,
            "boardVersion": board_version,
            "note": "yeahs/likes = len(board.yeahs); views = board.views. Do not hardcode.",
        },
        "sensitivity": SENSITIVITY,
        "posts": out_posts,
    }


def main(argv: list[str]) -> int:
    root = Path.cwd()
    if len(argv) > 1:
        root = Path(argv[1]).resolve()
    board_path = root / BOARD_REL
    if not board_path.is_file():
        print(f"ERROR: missing {board_path}", file=sys.stderr)
        print("Run from site root (expects data/boards/BeeSid.json).", file=sys.stderr)
        return 1
    with board_path.open("r", encoding="utf-8") as f:
        board = json.load(f)
    if not isinstance(board, dict):
        print("ERROR: BeeSid.json root must be an object", file=sys.stderr)
        return 1
    feed = build_feed(board)
    text = json.dumps(feed, indent=2, ensure_ascii=False) + "\n"
    out_feed = root / OUT_FEED
    out_alias = root / OUT_ALIAS
    out_feed.parent.mkdir(parents=True, exist_ok=True)
    out_feed.write_text(text, encoding="utf-8")
    out_alias.write_text(text, encoding="utf-8")
    print(f"Wrote {out_feed} ({len(feed['posts'])} posts, boardVersion={feed['meta']['boardVersion']})")
    print(f"Wrote {out_alias} (same bytes)")
    print(f"meta.source={feed['meta']['source']} derivedAt={feed['meta']['derivedAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
