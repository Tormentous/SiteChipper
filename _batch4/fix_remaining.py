# -*- coding: utf-8 -*-
import os, re, shutil

SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"

def read(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write(p, t):
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)

# 1) Wrap bindPolyChart to prefer shared scrub chart
polls = os.path.join(SITE, "js", "polls.js")
pt = read(polls)
if "bindPolyChart__legacy" not in pt and "function bindPolyChart" in pt:
    pt = pt.replace(
        "function bindPolyChart(",
        """function bindPolyChart(root) {
    try {
      var wrap = root && root.querySelector && (
        root.querySelector(".poll-poly-wrap") ||
        root.querySelector(".poll-poly-chart") ||
        root.querySelector("[data-poly]") ||
        root
      );
      var raw = wrap && (wrap.getAttribute("data-poly") || (wrap.closest && wrap.closest("[data-poly]") && wrap.closest("[data-poly]").getAttribute("data-poly")));
      if (window.CoolbradorScrubChart && raw) {
        var payload = JSON.parse(decodeURIComponent(raw));
        var host = document.createElement("div");
        host.className = "cb-scrub-host";
        var mountEl = wrap.classList && wrap.classList.contains("poll-poly-wrap") ? wrap : (wrap.querySelector(".poll-poly-wrap") || wrap);
        mountEl.innerHTML = "";
        mountEl.appendChild(host);
        var sides = (payload.sides || payload.series || []).map(function (s, i) {
          return { id: s.id || String(i), name: s.short || s.name || s.label || ("Side " + (i + 1)), pct: s.pct || s.value };
        });
        var hist = payload.history || payload.points || [];
        var series = sides.map(function (s) {
          var points;
          if (hist.length && hist[0] && (hist[0].pct || hist[0][s.id] != null || hist[0].v != null)) {
            points = hist.map(function (h) {
              var pctMap = h.pct || h;
              var v = pctMap[s.id];
              if (v == null && Array.isArray(h.values)) v = h.values[sides.indexOf(s)];
              return { t: Number(h.t || h.time || Date.now()), v: Number(v) || 0 };
            });
          } else {
            points = [
              { t: Date.now() - 7200000, v: 0 },
              { t: Date.now(), v: Number(s.pct) || 0 }
            ];
          }
          return { id: s.id, name: s.name, points: points };
        });
        CoolbradorScrubChart.mount(host, { series: series, height: 210 });
        return;
      }
    } catch (e) { try { console.warn("shared scrub fallback", e); } catch (_) {} }
    return bindPolyChart__legacy.apply(this, arguments);
  }
  function bindPolyChart__legacy(""",
        1,
    )
    write(polls, pt)
    print("bindPolyChart wrapped")
else:
    print("bindPolyChart wrap skip", "legacy" in pt, "fn" in pt)

# 2) polls.html carousel mount + ensure scripts
ph = os.path.join(SITE, "polls.html")
ht = read(ph)
if 'id="pollsBoardCarousel"' not in ht:
    if '<div class="polls-page">' in ht:
        ht = ht.replace(
            '<div class="polls-page">',
            '<div class="polls-page">\n    <div id="pollsBoardCarousel" class="cb-polls-board-carousel"></div>',
            1,
        )
        print("carousel mount after polls-page")
    elif '<div class="poll-tabs"' in ht:
        ht = ht.replace(
            '<div class="poll-tabs"',
            '<div id="pollsBoardCarousel" class="cb-polls-board-carousel"></div>\n    <div class="poll-tabs"',
            1,
        )
        print("carousel mount before tabs")
    write(ph, ht)

# rename bootBoardCarousel target id if script uses pollsBoardCarousel
pt = read(polls)
if "pollsBoardCarousel" not in pt and "bootBoardCarousel" in pt:
    # surgical already used pollsBoardCarousel in bootBoardCarousel - check
    print("carousel id in polls.js", "pollsBoardCarousel" in pt, "getElementById" )
    # show bootBoardCarousel snippet
    i = pt.find("bootBoardCarousel")
    print(pt[i:i+400])

# Fix bootBoardCarousel to look for pollsBoardCarousel
if "bootBoardCarousel" in pt:
    pt2 = pt
    pt2 = pt2.replace('getElementById("pollsBoardCarousel")', 'getElementById("pollsBoardCarousel")')
    pt2 = pt2.replace('getElementById("pollsBoardCarousel")', 'getElementById("pollsBoardCarousel")')
    # actual id we put in HTML is pollsBoardCarousel
    # check what surgical used
    m = re.search(r'getElementById\("([^"]*Carousel[^"]*)"\)', pt)
    print("carousel getElementById", m.group(1) if m else None)
    if m and m.group(1) != "pollsBoardCarousel":
        pt2 = pt2.replace('getElementById("' + m.group(1) + '")', 'getElementById("pollsBoardCarousel")')
        pt2 = pt2.replace('id="' + m.group(1) + '"', 'id="pollsBoardCarousel"')
        write(polls, pt2)
        print("aligned carousel id to pollsBoardCarousel")
    elif m:
        print("carousel id already pollsBoardCarousel")

# 3) Fix top board post comments — inspect post-thread findPost
ptpath = os.path.join(SITE, "js", "post-thread.js")
tt = read(ptpath)
# Harden n lookup and replies arrays
if "function ensureReplies" not in tt:
    inject = '''
  function ensureReplies(post) {
    if (!post) return post;
    if (!Array.isArray(post.replies)) post.replies = [];
    post.replies.forEach(ensureReplies);
    return post;
  }

'''
    if '"use strict";' in tt:
        tt = tt.replace('"use strict";', '"use strict";\n' + inject, 1)
    else:
        tt = inject + tt
    write(ptpath, tt)
    print("ensureReplies injected")

tt = read(ptpath)
# Fix parseInt of n when post numbers are strings; also try id=
if "q.get(\"id\")" not in tt:
    old = 'var n = parseInt(q.get("n") || q.get("post") || "0", 10);\n    if (board && n > 0) return { board: board, n: n };'
    new = '''var n = parseInt(q.get("n") || q.get("post") || "0", 10);
    var id = q.get("id") || q.get("postId") || "";
    if (board && n > 0) return { board: board, n: n, id: id };
    if (board && id) return { board: board, n: 0, id: id };'''
    if old in tt:
        tt = tt.replace(old, new, 1)
        print("route parse id added")
    else:
        print("WARN route parse pattern missing")

# find where post is resolved by n and also allow id
if "resolvePostFromBoard" not in tt and "function loadBoardPosts" in tt:
    # find selection by n
    # common: list.find(function(p){ return p.n === n }) or posts[n-1]
    for pat in [
        "return list.find(function (p) { return p.n === n; })",
        "return list.find(function(p){return p.n===n;})",
        "return list[n - 1]",
        "list.find(function (p) { return Number(p.n) === Number(n); })",
    ]:
        if pat in tt:
            print("found resolve", pat[:60])
    # show around 'n > 0' usage after load
    i = tt.find("loadBoardPosts")
    print("--- loadBoardPosts area ---")
    print(tt[i:i+900])

write(ptpath, tt) if False else None

# Broader fix: after loading list, resolve by n OR id OR first post
tt = read(ptpath)
if "/* batch4 resolve */" not in tt:
    # Find a function that picks the post
    m = re.search(r"function\s+(findPost|resolvePost|getThreadPost)\s*\([^)]*\)\s*\{", tt)
    if m:
        print("resolver", m.group(1))
        print(tt[m.start():m.start()+600])
    else:
        # search for .n ===
        i = tt.find(".n ===")
        if i < 0:
            i = tt.find("n ===")
        print("n compare at", i)
        print(tt[max(0, i - 200) : i + 400])

# 4) profile social: ensure brands stylesheet + common missing icons
layout = os.path.join(SITE, "js", "layout.js")
lt = read(layout)
if "fa-brands" not in lt and "all.min.css" in lt:
    print("FA all.min already includes brands")
# ensure kit uses all.min not solid-only
if "css/solid.min.css" in lt and "all.min.css" not in lt:
    lt = lt.replace("css/solid.min.css", "css/all.min.css")
    write(layout, lt)
    print("switched solid to all")

# profile.js - map any broken brand classes
prof = os.path.join(SITE, "js", "profile.js")
pr = read(prof)
# twitter -> x-twitter already; ensure roblox etc
replacements = [
    ('"fa-brands fa-twitter"', '"fa-brands fa-x-twitter"'),
    ('"fa-brands fa-roblox"', '"fa-solid fa-gamepad"'),
    ('"fa-brands fa-discord"', '"fa-brands fa-discord"'),
]
for a, b in replacements:
    if a in pr and a != b:
        pr = pr.replace(a, b)
        print("social icon", a, "->", b)
write(prof, pr)

# 5) Make sure messages exact CSS wins - already in batch4
css = read(os.path.join(SITE, "styles.css"))
# Fix community note spacing: more space above, no side margins
# already in batch-additions - verify
print("note CSS", ".cb-community-notes" in css and "margin-top: 14px" in css)

# 6) board tabs should use chipper style - CSS added; ensure HTML class on boards
for path in [
    os.path.join(SITE, "b", "General", "board.html"),
]:
    bh = read(path)
    if "cb-board-tabs" in bh and "chipper-tabs-inner" not in bh:
        # board-tabs.js wraps with chipper-tabs-inner at runtime - ok
        print("General board tabs present")

print("DONE fix_remaining")
