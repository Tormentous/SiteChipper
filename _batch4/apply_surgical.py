# -*- coding: utf-8 -*-
import os, re, shutil, glob

SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
PATCH = os.path.join(SITE, "_batch4")

def read(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write(p, t):
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)

print("SITE", SITE)
assert os.path.isdir(SITE)

# --- 1) copy modules ---
for name in ("cb-scrub-chart.js", "cb-media-player.js", "board-tabs.js"):
    src = os.path.join(PATCH, name)
    dst = os.path.join(SITE, "js", name)
    shutil.copy2(src, dst)
    print("copied", name)

# --- 2) CSS ---
css_path = os.path.join(SITE, "styles.css")
css = read(css_path)
add = read(os.path.join(PATCH, "batch-additions.css"))
if not add.startswith("/* === batch4"):
    add = "/* === batch4: media/scrub/kalshi/notes/messages === */\n" + add
marker = "/* === batch4:"
if marker in css:
    css = css[: css.find(marker)].rstrip() + "\n\n" + add
else:
    css = css.rstrip() + "\n\n" + add
css, n = re.subn(
    r"(body\.messages-page\s+\.cb-msg-shell\s*\{[^}]*?)height:\s*calc\(100vh\s*-\s*200px\);",
    r"\1height: 100%;",
    css,
    count=1,
)
print("shell height fixes", n)
write(css_path, css)

# --- 3) inject scripts into html ---
tags = (
    '<script src="/js/cb-scrub-chart.js"></script>\n'
    '<script src="/js/cb-media-player.js"></script>\n'
)
html_n = 0
for root, dirs, files in os.walk(SITE):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "_batch4", "_extract", "_patches", "_portal_stage") and not d.startswith(".")]
    for f in files:
        if not f.endswith(".html"):
            continue
        path = os.path.join(root, f)
        t = read(path)
        if "cb-media-player.js" in t:
            continue
        if not any(x in t for x in ("/js/posts.js", "/js/polls.js", "/js/board-tabs.js")):
            continue
        orig = t
        if re.search(r"<script[^>]+/js/posts\.js", t):
            t = re.sub(r"(<script[^>]+/js/posts\.js[^>]*>)", tags + r"\1", t, count=1)
        elif re.search(r"<script[^>]+/js/polls\.js", t):
            t = re.sub(r"(<script[^>]+/js/polls\.js[^>]*>)", tags + r"\1", t, count=1)
        elif re.search(r"<script[^>]+/js/board-tabs\.js", t):
            t = re.sub(r"(<script[^>]+/js/board-tabs\.js[^>]*>)", tags + r"\1", t, count=1)
        elif "</body>" in t:
            t = t.replace("</body>", tags + "</body>", 1)
        if t != orig:
            write(path, t)
            html_n += 1
            print("html", os.path.relpath(path, SITE))
print("html patched", html_n)

# --- 4) messages.html class ---
msg = os.path.join(SITE, "messages.html")
t = read(msg)
if "messages-page" not in t:
    def add_cls(m):
        attrs = m.group(1)
        if "class=" in attrs:
            return "<body" + attrs.replace('class="', 'class="messages-page ', 1) + ">"
        return '<body class="messages-page"' + attrs + ">"
    t = re.sub(r"<body([^>]*)>", add_cls, t, count=1)
    write(msg, t)
    print("messages.html class added")
else:
    print("messages.html ok")

# --- 5) posts.js surgical ---
posts = os.path.join(SITE, "js", "posts.js")
t = read(posts)
bak = posts + ".bak_batch4"
if not os.path.exists(bak):
    shutil.copy2(posts, bak)
    print("backup posts.js")

# 5a) remove controls from video
old_vid = "'<video class=\"post-media\" src=\"' + url + '\" controls muted loop playsinline></video>'"
new_vid = "'<video class=\"post-media\" src=\"' + url + '\" muted loop playsinline></video>'"
if old_vid in t:
    t = t.replace(old_vid, new_vid)
    print("video controls removed")
else:
    t2, n = re.subn(r'(<video class="post-media"[^"]*src="\' \+ url \+ \'" )controls ', r"\1", t)
    t = t2
    print("video controls regex", n)

# 5b) audio branch
if 'm.type === "audio"' not in t:
    needle = (
        '      } else {\n'
        '        parts.push(\n'
        '          \'<div class="post-media-frame">\' +\n'
        '          \'<img class="post-media-blur" src="\' + url + \'" alt="" aria-hidden="true">\' +\n'
    )
    insert = (
        '      } else if (m.type === "audio" || /\\.(mp3|wav|ogg|m4a)(\\?|$)/i.test(url)) {\n'
        '        parts.push(\n'
        '          \'<div class="post-media-frame post-media-frame-audio">\' +\n'
        '          \'<audio class="post-media" src="\' + url + \'" preload="metadata"></audio>\' +\n'
        '          "</div>"\n'
        '        );\n'
        '      } else {\n'
        '        parts.push(\n'
        '          \'<div class="post-media-frame">\' +\n'
        '          \'<img class="post-media-blur" src="\' + url + \'" alt="" aria-hidden="true">\' +\n'
    )
    if needle in t:
        t = t.replace(needle, insert, 1)
        print("audio branch added")
    else:
        print("WARN audio needle missing")

# 5c) yeah scroll preserve
old_yeah = (
    '        var yScroll = window.scrollY || window.pageYOffset || 0;\n'
    '        var updated = toggleYeah(board, yeahBtn.dataset.id);\n'
    '        if (updated) {\n'
    '          paintYeahState(updated, yeahBtn);\n'
    '          if (typeof opts.onYeah === "function") opts.onYeah(updated, yeahBtn);\n'
    '          requestAnimationFrame(function () {\n'
    '            if (Math.abs((window.scrollY || 0) - yScroll) > 2) {\n'
    '              window.scrollTo(0, yScroll);\n'
    '            }\n'
    '          });'
)
new_yeah = (
    '        var postCard = yeahBtn.closest(".post");\n'
    '        var yScroll = window.scrollY || window.pageYOffset || 0;\n'
    '        var topBefore = postCard ? postCard.getBoundingClientRect().top : null;\n'
    '        var updated = toggleYeah(board, yeahBtn.dataset.id);\n'
    '        if (updated) {\n'
    '          paintYeahState(updated, yeahBtn);\n'
    '          if (typeof opts.onYeah === "function") opts.onYeah(updated, yeahBtn);\n'
    '          requestAnimationFrame(function () {\n'
    '            var card = (postCard && postCard.isConnected) ? postCard : document.querySelector(\'.post[data-id="\' + (yeahBtn.dataset.id || "") + \'"]\');\n'
    '            if (card && topBefore != null) {\n'
    '              var delta = card.getBoundingClientRect().top - topBefore;\n'
    '              if (Math.abs(delta) > 1) window.scrollTo(0, (window.scrollY || 0) + delta);\n'
    '              else if (Math.abs((window.scrollY || 0) - yScroll) > 2) window.scrollTo(0, yScroll);\n'
    '            } else if (Math.abs((window.scrollY || 0) - yScroll) > 2) {\n'
    '              window.scrollTo(0, yScroll);\n'
    '            }\n'
    '          });'
)
if old_yeah in t:
    t = t.replace(old_yeah, new_yeah, 1)
    print("yeah scroll patched")
else:
    print("WARN yeah block mismatch")

# 5d) community notes — remove emdash, IG-like votes, spacing anchor
# Find the map join for notes
pat = re.compile(
    r"host\.innerHTML = notes\.map\(function \(n\) \{\s*"
    r"return '<div class=\"cb-community-note\">[\s\S]*?\}\)\.join\(\"\"\);",
    re.M,
)
repl = '''host.innerHTML = notes.map(function (n) {
      var likes = (n.likes && n.likes.length) || 0;
      var dislikes = (n.dislikes && n.dislikes.length) || 0;
      var uid = (typeof sessionUserId === "function" ? sessionUserId() : null);
      var liked = uid && (n.likes || []).map(String).indexOf(String(uid)) >= 0;
      var disliked = uid && (n.dislikes || []).map(String).indexOf(String(uid)) >= 0;
      return (
        '<div class="cb-community-note" data-note-id="' + escapeHtml(n.id || "") + '">' +
          '<div class="cb-community-note-head"><i class="fa-solid fa-clipboard-check" aria-hidden="true"></i> <strong>Community Note</strong></div>' +
          '<div class="cb-community-note-body">' + escapeHtml(n.text) + "</div>" +
          '<div class="cb-community-note-meta">' +
            "<span>by " + escapeHtml(n.byName || "Lab") + "</span>" +
            '<button type="button" class="cb-community-note-vote' + (liked ? " is-on" : "") + '" data-note-vote="up" aria-label="Helpful"><i class="fa-solid fa-thumbs-up"></i> ' + likes + "</button>" +
            '<button type="button" class="cb-community-note-vote' + (disliked ? " is-on" : "") + '" data-note-vote="down" aria-label="Not helpful"><i class="fa-solid fa-thumbs-down"></i> ' + dislikes + "</button>" +
          "</div>" +
        "</div>"
      );
    }).join("");'''
t2, n = pat.subn(repl, t, count=1)
if n:
    t = t2
    print("notes UI patched")
else:
    print("WARN notes map not found")

# anchor after yeah section / more space above notes
t = t.replace(
    'var anchor = postEl.querySelector(".post-actions") || postEl.querySelector(".post-body");',
    'var anchor = postEl.querySelector(".yeah-section") || postEl.querySelector(".post-actions") || postEl.querySelector(".post-body");',
)

# vote handler
if "data-note-vote" in t and 'noteVote = e.target.closest' not in t:
    needle = '      var yeahBtn = e.target.closest(".yeah-btn");'
    if needle in t:
        handler = '''      var noteVote = e.target.closest("[data-note-vote]");
      if (noteVote) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof requireSignedIn === "function" && !requireSignedIn("rate a community note")) return;
        var noteEl = noteVote.closest(".cb-community-note");
        var noteId = noteEl && noteEl.getAttribute("data-note-id");
        var dir = noteVote.getAttribute("data-note-vote");
        var list = (typeof loadCommunityNotes === "function") ? loadCommunityNotes() : [];
        var note = null;
        for (var ni = 0; ni < list.length; ni++) {
          if (String(list[ni].id) === String(noteId)) { note = list[ni]; break; }
        }
        if (!note) return;
        var me = String((typeof sessionUserId === "function" && sessionUserId()) || "");
        note.likes = Array.isArray(note.likes) ? note.likes.filter(function (x) { return String(x) !== me; }) : [];
        note.dislikes = Array.isArray(note.dislikes) ? note.dislikes.filter(function (x) { return String(x) !== me; }) : [];
        if (dir === "up") note.likes.push(me);
        else if (dir === "down") note.dislikes.push(me);
        if (typeof saveCommunityNotes === "function") saveCommunityNotes(list);
        if (typeof renderCommunityNotesForPost === "function") renderCommunityNotesForPost(noteVote.closest(".post"));
        return;
      }

'''
        t = t.replace(needle, handler + needle, 1)
        print("note vote handler added")
    else:
        print("WARN yeahBtn needle missing")

# 5e) parentSnapshot on createRepost
if "parentSnapshot" not in t:
    # find entry.snapshot or snapshot field in createRepost
    m = re.search(r"(var entry = \{[\s\S]*?snapshot:\s*)(\{[\s\S]*?\n\s*\})(\s*,|\s*\n\s*\};)", t)
    # simpler: after originalPostId line, enhance snapshot object
    # Look for snapshot: { inside createRepost
    idx = t.find("function createRepost")
    if idx >= 0:
        chunk = t[idx:idx+1800]
        sm = re.search(r"snapshot:\s*\{([^}]*)\}", chunk)
        if sm and "parentSnapshot" not in sm.group(0):
            old = sm.group(0)
            # if snapshot is multi-line, broader
            sm2 = re.search(r"snapshot:\s*\{[\s\S]*?\n\s*\}", chunk)
            if sm2:
                old = sm2.group(0)
                # append fields before closing
                new = old[:-1] + (
                    ",\n        isReply: !!found.isReply,\n"
                    "        parentSnapshot: (found.isReply && found.parentPost) ? {\n"
                    "          id: found.parentPost.id,\n"
                    "          userId: found.parentPost.userId,\n"
                    "          username: found.parentPost.username,\n"
                    "          text: found.parentPost.text || \"\",\n"
                    "          board: found.board\n"
                    "        } : null\n      }"
                )
                t = t[:idx] + chunk.replace(old, new, 1) + t[idx+1800:]
                print("parentSnapshot added")
            else:
                print("WARN snapshot multiline not found")
        else:
            # entry may use different shape - add parent fields onto entry
            if "originalPostId: found.post.id" in chunk and "parentSnapshot" not in chunk:
                t = t.replace(
                    "originalPostId: found.post.id,",
                    "originalPostId: found.post.id,\n"
                    "      isReply: !!found.isReply,\n"
                    "      parentSnapshot: (found.isReply && found.parentPost) ? {\n"
                    "        id: found.parentPost.id,\n"
                    "        userId: found.parentPost.userId,\n"
                    "        username: found.parentPost.username,\n"
                    "        text: found.parentPost.text || \"\",\n"
                    "        board: found.board\n"
                    "      } : null,",
                    1,
                )
                print("parentSnapshot on entry")
            else:
                print("WARN createRepost snapshot shape")
    else:
        print("WARN no createRepost")

# 5f) quote context UI when rendering repost of reply
if "cb-repost-quote" not in t:
    # after repostRow / cb-repost-context block, before return
    marker = 'repostRow = \'<div class="cb-repost-context">'
    # find alternate
    markers = [
        'repostRow = \'<div class="cb-repost-context">',
        "repostRow = '<div class=\"cb-repost-context\">",
        'cb-repost-context',
    ]
    placed = False
    for mk in markers:
        i = t.find(mk)
        if i < 0:
            continue
        # find next "return (" after this
        end = t.find("\n    return (", i)
        if end < 0:
            end = t.find("\n    return (", i)
        if end < 0:
            continue
        block = '''
    var quoteCtx = "";
    try {
      var parentSnap = null;
      if (typeof repostBy !== "undefined" && repostBy && (repostBy.parentSnapshot || (repostBy.snapshot && repostBy.snapshot.parentSnapshot))) {
        parentSnap = repostBy.parentSnapshot || repostBy.snapshot.parentSnapshot;
      }
      if (!parentSnap && post && post._quoteParent) parentSnap = post._quoteParent;
      if (parentSnap && (parentSnap.text || parentSnap.username)) {
        var qBoard = String(parentSnap.board || "").replace(/^\\/b\\//, "");
        var qId = parentSnap.id || "";
        var qHref = (qBoard && qId) ? ("/b/" + encodeURIComponent(qBoard) + "/post.html?id=" + encodeURIComponent(qId)) : "#";
        var qPfp = (typeof getPfp === "function") ? getPfp(parentSnap.userId) : "/users/default/pfp.jpg";
        quoteCtx =
          '<a class="cb-repost-quote" href="' + escapeHtml(qHref) + '" data-board="' + escapeHtml(qBoard) + '" data-id="' + escapeHtml(String(qId)) + '">' +
            '<div class="cb-repost-quote-head"><img src="' + escapeHtml(qPfp) + '" alt=""><strong>' + escapeHtml(parentSnap.username || "Lab") + "</strong></div>" +
            '<div class="cb-repost-quote-text">' + escapeHtml(parentSnap.text || "") + "</div>" +
          "</a>";
      }
    } catch (eQuote) {}
'''
        t = t[:end] + block + t[end:]
        # inject into template
        if "mediaHTMLFor(post)" in t:
            t = t.replace("mediaHTMLFor(post)", "quoteCtx + mediaHTMLFor(post)", 1)
        placed = True
        print("quoteCtx UI added")
        break
    if not placed:
        print("WARN quoteCtx not placed")

write(posts, t)
print("posts.js saved", len(t))

# --- 6) board onYeah stop full rerender ---
for path in glob.glob(os.path.join(SITE, "b", "*", "board.html")):
    t = read(path)
    t2 = t
    for a, b in [
        ("onYeah: function () { render(); },", "onYeah: function () {},"),
        ("onYeah: function(){ render(); },", "onYeah: function () {},"),
        ("onYeah: function () { render(); }", "onYeah: function () {}"),
    ]:
        t2 = t2.replace(a, b)
    if t2 != t:
        write(path, t2)
        print("onYeah", os.path.relpath(path, SITE))

# Ensure board pages load scrub chart before board-tabs
for path in glob.glob(os.path.join(SITE, "b", "*", "board.html")):
    t = read(path)
    if "board-tabs.js" in t and "cb-scrub-chart.js" not in t:
        t = re.sub(
            r'(<script[^>]+/js/board-tabs\.js[^>]*>)',
            tags + r"\1",
            t,
            count=1,
        )
        write(path, t)
        print("board scripts", os.path.relpath(path, SITE))

# --- 7) polls carousel + shared scrub ---
polls = os.path.join(SITE, "js", "polls.js")
pt = read(polls)
if not os.path.exists(polls + ".bak_batch4"):
    shutil.copy2(polls, polls + ".bak_batch4")

if "bootBoardCarousel" not in pt:
    carousel = r'''
  function bootBoardCarousel() {
    var mount = document.getElementById("pollsBoardCarousel");
    if (!mount) {
      var main = document.querySelector("main") || document.body;
      mount = document.createElement("div");
      mount.id = "pollsBoardCarousel";
      mount.className = "cb-polls-board-carousel";
      if (main.firstChild) main.insertBefore(mount, main.firstChild);
      else main.appendChild(mount);
    }
    var boards = ["General", "BeeSid", "ChipperCorner", "GiftDrive", "Invasions", "Labradoria", "Mutinies4Lyfe", "FarmDESTROYERSCLUB"];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("posts_/b/") === 0) {
          var b = k.slice("posts_/b/".length);
          if (b && boards.indexOf(b) < 0) boards.push(b);
        }
      }
    } catch (e) {}
    var active = "General";
    try {
      active = new URLSearchParams(location.search).get("board") || localStorage.getItem("cb_polls_board") || "General";
    } catch (e2) {}
    function paint() {
      mount.innerHTML = boards.map(function (b) {
        return '<button type="button" class="cb-polls-board-chip' + (b === active ? " is-active" : "") + '" data-board="' + b + '">' + b + "</button>";
      }).join("");
    }
    function applyFilter() {
      document.querySelectorAll(".poll-card, .poll-issue-card, [data-poll-board]").forEach(function (card) {
        var b = card.getAttribute("data-poll-board") || card.getAttribute("data-board") || "General";
        var show = String(active).toLowerCase() === "general" || String(b).toLowerCase() === String(active).toLowerCase();
        card.style.display = show ? "" : "none";
      });
    }
    paint();
    applyFilter();
    mount.onclick = function (e) {
      var btn = e.target.closest("[data-board]");
      if (!btn) return;
      active = btn.getAttribute("data-board");
      try { localStorage.setItem("cb_polls_board", active); } catch (err) {}
      try {
        var url = new URL(location.href);
        url.searchParams.set("board", active);
        history.replaceState({}, "", url);
      } catch (err2) {}
      paint();
      applyFilter();
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootBoardCarousel);
  else bootBoardCarousel();
'''
    idx = pt.rfind("})();")
    if idx != -1:
        pt = pt[:idx] + carousel + "\n" + pt[idx:]
        print("polls carousel")
    else:
        pt += "\n" + carousel

# wrap poly scrub to use shared chart if present
if "bindPolyScrub__legacy" not in pt:
    for fname in ("function bindPolyScrub(root)", "function bindPollPoly(root)", "function wirePolyScrub(root)"):
        if fname in pt:
            pt = pt.replace(
                fname,
                fname.replace("function ", "function ")  # keep name
                ,
                1,
            )
            # actual wrap
            name = fname.split("(")[0].replace("function ", "").strip()
            pt = pt.replace(
                "function " + name + "(root)",
                "function "
                + name
                + """(root) {
    try {
      var wrap = root && root.querySelector && (root.querySelector(".poll-poly-wrap") || root.querySelector(".poll-poly-wrap"));
      if (wrap && window.CoolbradorScrubChart) {
        var raw = wrap.getAttribute("data-poly");
        if (raw) {
          var payload = JSON.parse(decodeURIComponent(raw));
          var host = document.createElement("div");
          wrap.innerHTML = "";
          wrap.appendChild(host);
          var sides = (payload.sides || []).map(function (s) {
            return { id: s.id, name: s.short || s.name || s.id, pct: s.pct };
          });
          var hist = payload.history || [];
          var series = sides.map(function (s) {
            var points = hist.length ? hist.map(function (h) {
              var pctMap = h.pct || h;
              return { t: Number(h.t || h.time || Date.now()), v: Number(pctMap[s.id]) || 0 };
            }) : [{ t: Date.now() - 7200000, v: 0 }, { t: Date.now(), v: Number(s.pct) || 0 }];
            return { id: s.id, name: s.name, points: points };
          });
          CoolbradorScrubChart.mount(host, { series: series, height: 210 });
          return;
        }
      }
    } catch (e) {}
    return """
                + name
                + """__legacy(root);
  }
  function """
                + name
                + """__legacy(root)""",
                1,
            )
            print("polls scrub wrap on", name)
            break
    else:
        print("WARN no poly bind function")

write(polls, pt)

ph = os.path.join(SITE, "polls.html")
if os.path.exists(ph):
    ht = read(ph)
    if 'id="pollsBoardCarousel"' not in ht:
        ht2, n = re.subn(r"(<main[^>]*>)", r'\1\n  <div id="pollsBoardCarousel" class="cb-polls-board-carousel"></div>', ht, count=1)
        if n:
            write(ph, ht2)
            print("polls.html mount")
        else:
            print("WARN polls.html no main")
    if "cb-scrub-chart.js" not in ht and "polls.js" in ht:
        ht = read(ph)
        ht = re.sub(r'(<script[^>]+/js/polls\.js[^>]*>)', tags + r"\1", ht, count=1)
        write(ph, ht)
        print("polls.html scripts")

# --- 8) FA bump ---
layout = os.path.join(SITE, "js", "layout.js")
lt = read(layout)
lt2, n = re.subn(r"font-awesome/\d+\.\d+\.\d+/css/all\.min\.css", "font-awesome/6.6.0/css/all.min.css", lt)
if n:
    write(layout, lt2)
    print("FA upgraded")
else:
    print("FA link present", "all.min.css" in lt)

# --- 9) post-thread id coercion ---
for name in ("post-thread.js", "post-thread.js"):
    ptpath = os.path.join(SITE, "js", name)
    if not os.path.exists(ptpath):
        continue
    tt = read(ptpath)
    tt2 = tt
    tt2 = tt2.replace(
        "posts.find(function (p) { return p.id === id; })",
        "posts.find(function (p) { return String(p.id) === String(id); })",
    )
    tt2 = tt2.replace("posts.find((p) => p.id === id)", "posts.find((p) => String(p.id) === String(id))")
    tt2 = tt2.replace("posts.find(p => p.id === id)", "posts.find(p => String(p.id) === String(id))")
    if tt2 != tt:
        write(ptpath, tt2)
        print(name, "id coercion")
    else:
        print(name, "no coerce pattern")

# Fix board-tabs CoolbradorPosts / CoolbradorScrubChart names to match live
bt = read(os.path.join(SITE, "js", "board-tabs.js"))
bt = bt.replace("CoolbradorPosts", "CoolbradorPosts")
bt = bt.replace("CoolbradorScrubChart", "CoolbradorScrubChart")
# live export names:
bt = re.sub(r"Cool\w+Posts", "CoolbradorPosts", bt)
bt = re.sub(r"Cool\w+Scrub\w+", "CoolbradorScrubChart", bt)
# getPfp from live export
bt = bt.replace(".getPfp", ".getPfp")
write(os.path.join(SITE, "js", "board-tabs.js"), bt)
print("board-tabs globals aligned")

print("DONE surgical")
