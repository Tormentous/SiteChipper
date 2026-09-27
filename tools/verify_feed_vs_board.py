#!/usr/bin/env python3
"""Compare BeeSid.json vs live (or local) chipper feed derived counts."""
import json, sys, urllib.request
from datetime import datetime
from pathlib import Path

def yeah_count(p):
    y = p.get("yeahs")
    return len(y) if isinstance(y, list) else int(y or 0)

def load(url_or_path):
    if str(url_or_path).startswith("http"):
        with urllib.request.urlopen(url_or_path, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    return json.loads(Path(url_or_path).read_text(encoding="utf-8"))

def chrono(posts):
    def k(p):
        ts = p.get("timestamp") or ""
        try:
            t = datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
        except Exception:
            t = 0
        return (t, int(p.get("id") or 0) if str(p.get("id","")).isdigit() else 0)
    return sorted(posts, key=k)

board_src = sys.argv[1] if len(sys.argv) > 1 else "https://coolbrador.com/data/boards/BeeSid.json"
feed_src = sys.argv[2] if len(sys.argv) > 2 else "https://coolbrador.com/data/chipper_game_board_feed.json"
board = load(board_src)
feed = load(feed_src)
bposts = chrono(board["posts"])
# feed newest-first -> chrono
fposts = list(reversed(feed["posts"]))
ok = True
print(f"board posts={len(bposts)} feed posts={len(fposts)} meta={feed.get('meta')}")
if len(bposts) != len(fposts):
    print("FAIL length mismatch"); ok = False
for i, (b, f) in enumerate(zip(bposts, fposts), 1):
    yc, vc = yeah_count(b), int(b.get("views") or 0)
    fy, fl, fv = int(f.get("yeahs") or 0), int(f.get("likes") or 0), int(f.get("views") or 0)
    match = fy == yc == fl and fv == vc
    print(f"{'OK' if match else 'FAIL'} #{i} {f.get('id')} board yeahs={yc} views={vc} feed yeahs={fy} likes={fl} views={fv}")
    if not match: ok = False
print("PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
