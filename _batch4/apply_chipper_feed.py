# -*- coding: utf-8 -*-
import os, re, json, shutil

SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
PATCH = os.path.join(SITE, "_batch4")
GODOT_SCENE = r"C:\Users\pugga\Documents\Game Development\ChipperGodot\Scenes\Levels\SubMissions\BeeSid\beesidlair.tscn"
GODOT_SCRIPT = r"C:\Users\pugga\Documents\Game Development\ChipperGodot\Scenes\Levels\SubMissions\BeeSid\beesidlair_feed.gd"

def read(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write(p, t):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)

# --- copy static assets ---
os.makedirs(os.path.join(SITE, "data"), exist_ok=True)
shutil.copy2(os.path.join(PATCH, "chipper-miiverse.json"), os.path.join(SITE, "data", "chipper-miiverse.json"))
shutil.copy2(os.path.join(PATCH, "cb-feed-algo.js"), os.path.join(SITE, "js", "cb-feed-algo.js"))
print("copied json + algo")

# --- wire algo into posts.js loadFeedPosts ---
posts = os.path.join(SITE, "js", "posts.js")
t = read(posts)
if "CoolbradorFeedAlgo" not in t:
    old = """    posts = filterBlockedPosts(posts);
    if (opts.limit) posts = posts.slice(0, opts.limit);
    return posts;
  }"""
    new = """    posts = filterBlockedPosts(posts);
    if (opts.sort !== "chrono" && global.CoolbradorFeedAlgo && typeof global.CoolbradorFeedAlgo.rankPosts === "function") {
      try {
        posts = global.CoolbradorFeedAlgo.rankPosts(posts, { diversity: true });
      } catch (eAlgo) {}
    } else if (opts.sort !== "ranked") {
      /* keep prior order from mergeReposts / chrono */
    }
    if (opts.limit) posts = posts.slice(0, opts.limit);
    return posts;
  }"""
    if old in t:
        t = t.replace(old, new, 1)
        write(posts, t)
        print("posts.js engagement rank hooked")
    else:
        print("WARN loadFeedPosts hook not found")
else:
    print("posts.js already has FeedAlgo")

# --- inject script tags on home + community + board pages ---
tag = '<script src="/js/cb-feed-algo.js"></script>\n'
for root, dirs, files in os.walk(SITE):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "_batch4") and not d.startswith(".")]
    for f in files:
        if not f.endswith(".html"):
            continue
        path = os.path.join(root, f)
        html = read(path)
        if "cb-feed-algo.js" in html:
            continue
        if "/js/posts.js" not in html and "posts.js" not in html:
            continue
        html2 = re.sub(r'(<script[^>]+/js/posts\.js[^>]*>)', tag + r"\1", html, count=1)
        if html2 != html:
            write(path, html2)
            print("algo script", os.path.relpath(path, SITE))

# --- seed-demo: expand BeeSid miiverse posts + board note meta ---
seed = os.path.join(SITE, "js", "seed-demo.js")
st = read(seed)
pool = json.load(open(os.path.join(PATCH, "chipper-miiverse.json"), encoding="utf-8"))

# Force-refresh BeeSid seeds with miiverse pack (migrate key)
miiverse_seed_js = """
  // Chipper Game Board / Miiverse test seeds for BeeSid
  (function seedBeeSidMiiverse() {
    var beeKey = "posts_/b/BeeSid";
    var flag = "cb_beesid_miiverse_v2";
    if (localStorage.getItem(flag)) return;
    var MEDIA_FALLBACK = (typeof MEDIA !== "undefined" && MEDIA) ? MEDIA : {};
    var now = Date.now();
    var pack = %s;
    var posts = (pack.posts || []).map(function (p, i) {
      return {
        id: now - (i + 1) * 1000,
        username: p.username,
        userId: String(3 + (i %% 5)),
        text: p.text,
        media: p.media || null,
        timestamp: new Date(now - (i + 1) * 3600000).toISOString(),
        yeahs: Array(Math.max(1, Number(p.yeahs) || 1)).fill(0).map(function (_, j) { return String(j + 2); }),
        replies: [],
        views: 10 + i * 3,
        tags: p.tags || [],
        boardNote: false
      };
    });
    // Pin a Chipper Game Board note-style lead post
    posts.unshift({
      id: now,
      username: "Chipper",
      userId: "chipper",
      text: "CHIPPER GAME BOARD — posts from inside BeeSid's lair show up here. Draw, fail loudly, trade bee tips. (Not a regular chill board.)",
      media: null,
      timestamp: new Date(now).toISOString(),
      yeahs: ["2", "3", "5"],
      replies: [],
      views: 42,
      pinned: true,
      isGameBoardNote: true,
      tags: ["chipper", "game"]
    });
    localStorage.setItem(beeKey, JSON.stringify(posts));
    localStorage.setItem("boardmeta_/b/BeeSid", JSON.stringify({
      name: "BeeSid",
      desc: "Chipper Game Board — in-game posts from Chipper / BeeSid lair. Casual scrollers: this is where level screenshots and Miiverse energy live.",
      icon: "/b/BeeSid/icon.png",
      gameBoard: true,
      gameBoardLabel: "Chipper Game Board",
      gameBoardIcon: "fa-solid fa-gamepad"
    }));
    localStorage.setItem(flag, "1");
  })();
""" % json.dumps(pool)

if "cb_beesid_miiverse_v2" not in st:
    # append before final export or at end of IIFE
    if st.rstrip().endswith("})();"):
        st = st.rstrip()[:-5] + "\n" + miiverse_seed_js + "\n})();"
    else:
        st = st + "\n" + miiverse_seed_js
    write(seed, st)
    print("seed-demo BeeSid miiverse pack added")
else:
    print("seed already has miiverse v2")

# --- board banner note CSS + board-tabs / board page hook ---
css = os.path.join(SITE, "styles.css")
ct = read(css)
if "cb-game-board-note" not in ct:
    ct += """

/* Chipper Game Board notice on in-game boards */
.cb-game-board-note {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 10px 0 16px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--cb-accent) 35%, transparent);
  background: color-mix(in srgb, var(--cb-accent) 12%, transparent);
}
.cb-game-board-note-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--cb-accent) 22%, transparent);
  color: var(--cb-accent);
  flex: 0 0 auto;
  font-size: 1.15rem;
}
.cb-game-board-note strong { display: block; margin-bottom: 2px; }
.cb-game-board-note p { margin: 0; color: var(--cb-muted, #8b95a5); font-size: 0.92rem; line-height: 1.35; }
"""
    write(css, ct)
    print("game board note css")

# Inject banner into BeeSid board.html (and generic boards via JS is better)
bt = os.path.join(SITE, "js", "board-tabs.js")
btt = read(bt)
if "cb-game-board-note" not in btt:
    inject = r'''
  function renderGameBoardNote(board) {
    var host = document.getElementById("boardGameNote") || document.querySelector(".board-meta-row");
    if (!host) return;
    var meta = {};
    try { meta = JSON.parse(localStorage.getItem("boardmeta_/b/" + board) || "{}"); } catch (_) { meta = {}; }
    var isGame = !!(meta.gameBoard || String(board).toLowerCase() === "beesid");
    if (!isGame) return;
    var note = document.getElementById("boardGameNote");
    if (!note) {
      note = document.createElement("div");
      note.id = "boardGameNote";
      note.className = "cb-game-board-note";
      var anchor = document.querySelector(".board-meta-row") || document.querySelector(".cb-board-tabs");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(note, anchor.nextSibling);
      else return;
    }
    var label = meta.gameBoardLabel || "Chipper Game Board";
    var icon = meta.gameBoardIcon || "fa-solid fa-gamepad";
    var body = meta.desc || "In-game posts from Chipper levels land here.";
    note.innerHTML =
      '<div class="cb-game-board-note-icon" aria-hidden="true"><i class="' + icon + '"></i></div>' +
      "<div><strong>" + label + "</strong><p>" + body + "</p></div>";
  }
'''
    # call from boot
    if "function boot(" in btt:
        btt = btt.replace("function boot(", inject + "\n  function boot(", 1)
        btt = btt.replace(
            "renderDebates(board);",
            "renderDebates(board);\n    renderGameBoardNote(board);",
            1,
        )
        if "renderGameBoardNote(board)" not in btt:
            btt = btt.replace(
                "renderMods(board);",
                "renderMods(board);\n    renderGameBoardNote(board);",
                1,
            )
        write(bt, btt)
        print("board-tabs game note")
    else:
        print("WARN no boot in board-tabs")
else:
    print("board note already present")

# --- Godot script + attach to beesidlair.tscn ---
shutil.copy2(os.path.join(PATCH, "beesidlair_feed.gd"), GODOT_SCRIPT)
print("wrote", GODOT_SCRIPT)

scene = read(GODOT_SCENE)
if "beesidlair_feed.gd" not in scene:
    # add ext_resource after first ext_resource block line 3 area
    # find last ext_resource before sub_resource or first node
    m = list(re.finditer(r'\[ext_resource[^\]]+\]', scene))
    if not m:
        print("WARN no ext_resource")
    else:
        last = m[-1]
        # pick a free id - use feed_cb
        ext = '[ext_resource type="Script" path="res://Scenes/Levels/SubMissions/BeeSid/beesidlair_feed.gd" id="feed_cb"]\n'
        scene = scene[: last.end()] + "\n" + ext + scene[last.end():]
        # attach to root BeeSidLair node
        scene2, n = re.subn(
            r'(\[node name="BeeSidLair"[^\]]*\]\n)',
            r'\1script = ExtResource("feed_cb")\n',
            scene,
            count=1,
        )
        if n:
            write(GODOT_SCENE, scene2)
            print("beesidlair.tscn script attached")
        else:
            # try without unique_id quirks
            print("WARN root node replace failed; dumping node line")
            for line in scene.splitlines():
                if 'name="BeeSidLair"' in line:
                    print(line)
                    break
            write(GODOT_SCENE, scene)  # at least saved ext_resource
            print("ext_resource added only")
else:
    print("beesidlair already has feed script")

print("DONE apply_chipper_feed")
