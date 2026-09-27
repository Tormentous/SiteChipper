import os, re, shutil, glob
# -*- coding: utf-8 -*-

SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
PATCH = os.path.join(SITE, "_batch4")

def read(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write(p, t):
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)

print("SITE", SITE, "exists", os.path.isdir(SITE))
assert os.path.isdir(SITE)
assert os.path.isdir(PATCH)

# 1) JS modules
for name in ("cb-scrub-chart.js", "cb-media-player.js"):
    shutil.copy2(os.path.join(PATCH, name), os.path.join(SITE, "js", name))
    print("copied", name)

# 2) CSS
css_path = os.path.join(SITE, "styles.css")
css = read(css_path)
add = read(os.path.join(PATCH, "batch-additions.css"))
if not add.startswith("/* === batch4"):
    add = "/* === batch4: media player, scrub charts, kalshi mods, notes === */\n" + add
marker = "/* === batch4:"
if marker in css:
    css = css[:css.find(marker)].rstrip() + "\n\n" + add
else:
    css = css.rstrip() + "\n\n" + add
# shell height fill body
css2, n = re.subn(
    r"(body\.messages-page\s+\.cb-msg-shell\s*\{[^}]*?)height:\s*calc\(100vh\s*-\s*200px\);",
    r"\1height: 100%;",
    css,
    count=1,
)
css = css2
print("css shell height replacements", n)
write(css_path, css)
print("styles.css bytes", len(css))

# 3) inject scripts
tags = (
    '<script src="/js/cb-scrub-chart.js"></script>\n'
    '<script src="/js/cb-media-player.js"></script>\n'
)
html_n = 0
for root, dirs, files in os.walk(SITE):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules','_batch4','_extract','_patches','_portal_stage')]
    for f in files:
        if not f.endswith('.html'): continue
        path = os.path.join(root, f)
        t = read(path)
        if 'cb-media-player.js' in t: continue
        if not any(x in t for x in ('/js/posts.js', '/js/polls.js', '/js/board-tabs.js', 'posts.js', 'polls.js', 'board-tabs.js')):
            continue
        orig = t
        if re.search(r'<script[^>]+/js/posts\.js', t):
            t = re.sub(r'(<script[^>]+/js/posts\.js[^>]*>)', tags + r'\1', t, count=1)
        elif re.search(r'<script[^>]+/js/polls\.js', t):
            t = re.sub(r'(<script[^>]+/js/polls\.js[^>]*>)', tags + r'\1', t, count=1)
        elif re.search(r'<script[^>]+/js/board-tabs\.js', t):
            t = re.sub(r'(<script[^>]+/js/board-tabs\.js[^>]*>)', tags + r'\1', t, count=1)
        elif '</body>' in t:
            t = t.replace('</body>', tags + '</body>', 1)
        if t != orig:
            write(path, t)
            html_n += 1
            print('html', os.path.relpath(path, SITE))
print('html patched', html_n)

# 4) messages body class
msg = os.path.join(SITE, 'messages.html')
t = read(msg)
if 'messages-page' not in t:
    def add_class(m):
        attrs = m.group(1)
        if 'class=' in attrs:
            return '<body' + attrs.replace('class="', 'class="messages-page ', 1) + '>'
        return '<body class="messages-page"' + attrs + '>'
    t = re.sub(r'<body([^>]*)>', add_class, t, count=1)
    write(msg, t)
    print('messages.html class added')
else:
    print('messages.html already has messages-page')

# 5) posts.js — media controls off, audio, yeah scroll, notes, repost quote
posts = os.path.join(SITE, 'js', 'posts.js')
t = read(posts)
# strip controls from video/audio markup strings
t = t.replace(' controls muted', ' muted')
t = t.replace('" controls"', '""')  # careful - skip
t = t.replace(" controls'", "'")
t = re.sub(r'\scontrols(?=[\s>\'"])', '', t)
print('controls attrs stripped loosely')

# audio branch
if 'type === "audio"' not in t and 'm.type === "audio"' not in t:
    # find image else branch after video
    patterns = [
        (
            '} else {\n        parts.push(\n          \'<div class="post-media-frame">\' +\n          \'<img class="post-media-blur"',
            '} else if (m.type === "audio" || /\\.(mp3|wav|ogg|m4a)(\\?|$)/i.test(url)) {\n'
            '        parts.push(\n'
            '          \'<div class="post-media-frame post-media-frame-audio">\' +\n'
            '          \'<audio class="post-media" src="\' + url + \'" preload="metadata"></audio>\' +\n'
            '          "</div>"\n'
            '        );\n'
            '      } else {\n'
            '        parts.push(\n'
            '          \'<div class="post-media-frame">\' +\n'
            '          \'<img class="post-media-blur"'
        ),
    ]
    for a,b in patterns:
        if a in t:
            t = t.replace(a,b,1)
            print('audio branch inserted')
            break
    else:
        print('WARN audio branch not inserted')

# yeah scroll
if 'topBefore' not in t:
    a = 'var yScroll = window.scrollY || window.pageYOffset || 0;\n        var updated = toggleYeah(board, yeahBtn.dataset.id);'
    b = 'var postCard = yeahBtn.closest(".post");\n        var yScroll = window.scrollY || window.pageYOffset || 0;\n        var topBefore = postCard ? postCard.getBoundingClientRect().top : null;\n        var updated = toggleYeah(board, yeahBtn.dataset.id);'
    if a in t:
        t = t.replace(a,b,1)
        old = """requestAnimationFrame(function () {
            if (Math.abs((window.scrollY || 0) - yScroll) > 2) {
              window.scrollTo(0, yScroll);
            }
          });"""
        new = """requestAnimationFrame(function () {
            var card = (postCard && postCard.isConnected) ? postCard : document.querySelector('.post[data-id=\"' + (yeahBtn.dataset.id || '') + '\"]');
            if (card && topBefore != null) {
              var delta = card.getBoundingClientRect().top - topBefore;
              if (Math.abs(delta) > 1) window.scrollTo(0, (window.scrollY || 0) + delta);
              else if (Math.abs((window.scrollY || 0) - yScroll) > 2) window.scrollTo(0, yScroll);
            } else if (Math.abs((window.scrollY || 0) - yScroll) > 2) {
              window.scrollTo(0, yScroll);
            }
          });"""
        if old in t:
            t = t.replace(old, new, 1)
            print('yeah scroll ok')
        else:
            print('WARN yeah raf missing')
    else:
        print('WARN yeah yScroll missing — dump nearby')
        i = t.find('toggleYeah(board')
        print(repr(t[max(0,i-120):i+80]) if i>=0 else 'no toggleYeah(board')

# community notes UI
if 'cb-community-note-vote' not in t and 'data-note-vote' not in t:
    pat = re.compile(r'host\.innerHTML = notes\.map\(function \(n\) \{[\s\S]*?\}\)\.join\(""\);', re.M)
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
        print('notes UI ok')
    else:
        print('WARN notes map not found')

# insert notes after yeah section
t = t.replace(
    'var anchor = postEl.querySelector(".post-actions") || postEl.querySelector(".post-body");',
    'var anchor = postEl.querySelector(".yeah-section") || postEl.querySelector(".post-actions") || postEl.querySelector(".post-body");',
)

# note vote handler
if 'data-note-vote' in t and 'noteVote = e.target.closest' not in t:
    for needle in [
        '      var yeahBtn = e.target.closest(".yeah-btn");',
        '      var yeahBtn = e.target.closest(".yeah-btn");',
    ]:
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
        if (dir === "up") note.likes.push(me); else if (dir === "down") note.dislikes.push(me);
        if (typeof saveCommunityNotes === "function") saveCommunityNotes(list);
        if (typeof renderCommunityNotesForPost === "function") renderCommunityNotesForPost(noteVote.closest(".post"));
        return;
      }

'''
            t = t.replace(needle, handler + needle, 1)
            print('note vote handler ok')
            break
    else:
        print('WARN yeahBtn needle missing for votes')

# parentSnapshot on repost
if 'parentSnapshot' not in t:
    m = re.search(r'snapshot:\s*\{[\s\S]*?board:\s*found\.board\s*\}', t)
    if m:
        old = m.group(0)
        new = old[:-1] + (',\n        isReply: !!found.isReply,\n'
            '        parentSnapshot: (found.isReply && found.parentPost) ? {\n'
            '          id: found.parentPost.id,\n'
            '          userId: found.parentPost.userId,\n'
            '          username: found.parentPost.username,\n'
            '          text: found.parentPost.text || "",\n'
            '          board: found.board\n'
            '        } : null\n      }')
        t = t.replace(old, new, 1)
        print('parentSnapshot ok')
    else:
        print('WARN snapshot block missing')

# quote UI — soft insert before mediaHTMLFor(post)
if 'cb-repost-quote' not in t:
    if 'mediaHTMLFor(post)' in t:
        # define quoteCtx before first return of render card if possible
        if 'var quoteCtx' not in t:
            # insert empty + builder near repostRow if present
            if "repostRow = '" in t or 'repostRow = "' in t or "repostRow =" in t:
                end = t.find('\n    return (', t.find('repostRow'))
                if end != -1:
                    block = '''
    var quoteCtx = "";
    try {
      var parentSnap = null;
      if (typeof repostBy !== "undefined" && repostBy && repostBy.snapshot && repostBy.snapshot.parentSnapshot) parentSnap = repostBy.snapshot.parentSnapshot;
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
                    t = t.replace('mediaHTMLFor(post)', 'quoteCtx + mediaHTMLFor(post)', 1)
                    print('quoteCtx ok')
                else:
                    print('WARN no return after repostRow')
            else:
                print('WARN no repostRow')
        else:
            print('quoteCtx already')
    else:
        print('WARN no mediaHTMLFor')

write(posts, t)
print('posts.js saved', len(t))

# 6) board-tabs rewrite (from patch file if present, else embedded)
bt_src = os.path.join(PATCH, 'board-tabs.js')
bt_dst = os.path.join(SITE, 'js', 'board-tabs.js')
if os.path.exists(bt_src):
    shutil.copy2(bt_src, bt_dst)
    print('board-tabs from patch')
else:
    print('WARN no board-tabs in patch — skip rewrite')

# 7) board onYeah
for path in glob.glob(os.path.join(SITE, 'b', '*', 'board.html')):
    t = read(path)
    t2 = t
    for a,b in [
        ('onYeah: function () { render(); },', 'onYeah: function () {},'),
        ('onYeah: function(){ render(); },', 'onYeah: function () {},'),
        ('onYeah: function () { render(); }', 'onYeah: function () {}'),
    ]:
        t2 = t2.replace(a,b)
    if t2 != t:
        write(path, t2)
        print('onYeah', os.path.relpath(path, SITE))

# 8) polls carousel + shared scrub wrap
polls = os.path.join(SITE, 'js', 'polls.js')
pt = read(polls)
if 'bootBoardCarousel' not in pt:
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
    idx = pt.rfind('})();')
    if idx != -1:
        pt = pt[:idx] + carousel + '\n' + pt[idx:]
        print('polls carousel injected')
    else:
        pt += '\n' + carousel
        print('polls carousel appended')

if 'bindPolyScrub__legacy' not in pt and 'function bindPolyScrub' in pt:
    pt = pt.replace(
        'function bindPolyScrub(root)',
        '''function bindPolyScrub(root) {
    try {
      var wrap = root && root.querySelector && root.querySelector(".poll-poly-wrap");
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
    return bindPolyScrub__legacy(root);
  }
  function bindPolyScrub__legacy(root)''',
        1,
    )
    print('polls shared scrub wrap')
write(polls, pt)

ph = os.path.join(SITE, 'polls.html')
if os.path.exists(ph):
    ht = read(ph)
    if 'id="pollsBoardCarousel"' not in ht:
        ht2, n = re.subn(r'(<main[^>]*>)', r'\1\n  <div id="pollsBoardCarousel" class="cb-polls-board-carousel"></div>', ht, count=1)
        if n:
            write(ph, ht2)
            print('polls.html mount')
        else:
            print('WARN polls.html no main')

# FA bump
layout = os.path.join(SITE, 'js', 'layout.js')
lt = read(layout)
lt2, n = re.subn(r'font-awesome/\d+\.\d+\.\d+/css/all\.min\.css', 'font-awesome/6.6.0/css/all.min.css', lt)
if n:
    write(layout, lt2)
    print('FA upgraded', n)
else:
    print('FA already', 'all.min.css' in lt)

# post-thread id coercion
ptpath = os.path.join(SITE, 'js', 'post-thread.js')
if os.path.exists(ptpath):
    tt = read(ptpath)
    tt2 = tt.replace(
        'posts.find(function (p) { return p.id === id; })',
        'posts.find(function (p) { return String(p.id) === String(id); })',
    )
    tt2 = tt2.replace('posts.find((p) => p.id === id)', 'posts.find((p) => String(p.id) === String(id))')
    tt2 = tt2.replace('posts.find(p => p.id === id)', 'posts.find(p => String(p.id) === String(id))')
    if tt2 != tt:
        write(ptpath, tt2)
        print('post-thread id coercion')
    else:
        print('post-thread no pattern')

print('DONE')