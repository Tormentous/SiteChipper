
  function ensureReplies(post) {
    if (!post) return post;
    if (!Array.isArray(post.replies)) post.replies = [];
    post.replies.forEach(ensureReplies);
    return post;
  }

(function () {
    
  function applyThreadOg(board, post, routeN) {
    try {
      if (!window.CoolbradorOg || !post) return;
      var permalink = location.origin + "/b/" + encodeURIComponent(board) + "/post/" + routeN + "/comments";
      window.CoolbradorOg.fromPost(board, post, permalink);
    } catch (e) {}
  }

  function replyDomId(replyId) {
    return "reply-" + String(replyId || "").replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function highlightTargetReply() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    var el = document.getElementById(hash);
    if (!el) {
      var cm = hash.match(/^comment-(\d+)$/);
      if (cm) el = document.querySelector('.post-thread-reply-wrap[data-comment-n="' + cm[1] + '"]');
    }
    if (!el && hash.indexOf("reply-") === 0) {
      var rid = hash.slice("reply-".length);
      el = document.querySelector('.post-thread-reply-wrap[data-reply-id="' + rid.replace(/"/g, "") + '"]');
    }
    if (!el) return;
    el.classList.add("is-highlight");
    try {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch (e) {
      el.scrollIntoView(true);
    }
    window.setTimeout(function () {
      el.classList.remove("is-highlight");
    }, 2600);
  }
  function pingReplyNotif(CP, board, routeN, postOwnerId, text, postSnippet, replyId) {
    try {
      if (!window.CoolbradorNotifications || !window.CoolbradorNotifications.notifyReply) return;
      var href = "/b/" + encodeURIComponent(board) + "/post/" + routeN + "/comments";
      if (replyId) href += "#" + replyDomId(replyId);
      window.CoolbradorNotifications.notifyReply(
        CP.sessionUserId(),
        (function () {
          var uid = CP.sessionUserId();
          var u = {};
          try { u = JSON.parse(localStorage.getItem("user_" + uid) || "{}"); } catch (e) {}
          return u.displayName || u.username || "Lab";
        })(),
        postOwnerId,
        href,
        text,
        {
          board: board,
          postN: routeN,
          postSnippet: postSnippet || "",
          postLabel: "",
          replyId: replyId || ""
        }
      );
    } catch (e) {}
  }

  function parseThreadRoute() {
    var path = location.pathname || "";
    var m = path.match(/\/b\/([^\/]+)\/post\/(\d+)\/comments\/?/i);
    if (m) {
      return { board: decodeURIComponent(m[1]), n: parseInt(m[2], 10) };
    }
    var q = new URLSearchParams(location.search);
    var board = q.get("board") || "";
    var n = parseInt(q.get("n") || q.get("post") || "0", 10);
    if (board && n > 0) return { board: board, n: n };
    return null;
  }

  function storageKey(board) {
    return "posts_/b/" + board;
  }

  function loadBoardPosts(board) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(storageKey(board)) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    return list.slice().sort(function (a, b) {
      var ta = Date.parse(a.timestamp || "") || Number(a.id) || 0;
      var tb = Date.parse(b.timestamp || "") || Number(b.id) || 0;
      if (ta !== tb) return ta - tb;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }

  function saveBoardPosts(board, chronological) {
    var newestFirst = chronological.slice().sort(function (a, b) {
      var ta = Date.parse(a.timestamp || "") || Number(a.id) || 0;
      var tb = Date.parse(b.timestamp || "") || Number(b.id) || 0;
      if (ta !== tb) return tb - ta;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
    localStorage.setItem(storageKey(board), JSON.stringify(newestFirst));
    try {
      if (/BeeSid/i.test(String(board || "")) && window.CoolbradorChipperFeed) {
        if (typeof window.CoolbradorChipperFeed.onBeeSidWrite === "function") {
          window.CoolbradorChipperFeed.onBeeSidWrite(board);
        } else if (typeof window.CoolbradorChipperFeed.mirrorFromBoard === "function") {
          window.CoolbradorChipperFeed.mirrorFromBoard();
        }
      }
    } catch (e) {}
  }

  function ensureReplyIds(replies) {
    replies.forEach(function (r, i) {
      if (!r.id) r.id = "r-legacy-" + i;
      r.replies = r.replies || [];
      r.yeahs = r.yeahs || [];
    });
    return replies;
  }

  function flattenReplyTree(replies) {
    var list = ensureReplyIds(replies.slice());
    var byId = {};
    var roots = [];
    list.forEach(function (r) {
      byId[r.id] = { reply: r, children: [] };
    });
    list.forEach(function (r) {
      var node = byId[r.id];
      var pid = r.parentId;
      if (pid && byId[pid]) byId[pid].children.push(node);
      else roots.push(node);
    });
    var out = [];
    function walk(nodes, depth) {
      nodes.forEach(function (node) {
        out.push({ reply: node.reply, depth: depth });
        walk(node.children, depth + 1);
      });
    }
    walk(roots, 0);
    return out;
  }

  function childCount(all, parentId) {
    var n = 0;
    (all || []).forEach(function (r) {
      if (String(r.parentId || "") === String(parentId)) n += 1;
    });
    return n;
  }

  function makeReplyObject(uid, username, text, parentId, media) {
    return {
      id: "r-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
      parentId: parentId || null,
      userId: String(uid),
      username: username || "Lab",
      text: text || "",
      media: media || null,
      timestamp: new Date().toISOString(),
      yeahs: [],
      replies: [],
      views: 0
    };
  }

  function currentUserName(CP) {
    var uid = CP.sessionUserId();
    var u = {};
    try { u = JSON.parse(localStorage.getItem("user_" + uid) || "{}"); } catch (e) {}
    return u.displayName || u.username || "Lab";
  }

  var topComposerMounted = false;

  function ensureTopComposer(CP, visible) {
    var host = document.getElementById("threadComposeHost");
    if (!host) return null;
    if (!topComposerMounted) {
      host.innerHTML = CP.composerHTML({
        mode: "comment",
        showBoard: false,
        showMedia: true,
        containerId: "threadCompose",
        containerClass: "post-thread-compose",
        pfpId: "threadReplyPfp",
        textId: "threadReplyText",
        submitId: "threadReplyBtn",
        attachId: "threadAttachMedia",
        previewId: "threadMediaPreview",
        mediaInputId: "threadMediaInput",
        placeholder: "Say something and watch what happens...",
        submitLabel: "Reply"
      });
      topComposerMounted = true;
    }
    var box = document.getElementById("threadCompose");
    if (box) box.hidden = !visible;
    return box;
  }

  function renderThread() {
    var route = parseThreadRoute();
    var empty = document.getElementById("threadEmpty");
    var postBox = document.getElementById("threadPost");
    var repliesBox = document.getElementById("threadReplies");
    var back = document.getElementById("threadBack");
    var CP = window.CoolbradorPosts;

    if (!route || !route.board || !(route.n > 0)) {
      if (empty) empty.hidden = false;
      if (postBox) postBox.innerHTML = "";
      if (repliesBox) repliesBox.innerHTML = "";
      ensureTopComposer(CP, false);
      return;
    }

    var board = route.board;
    if (back) {
      back.href = "/b/" + encodeURIComponent(board) + "/board.html";
      back.textContent = "Back to " + board;
    }
    document.title = board + " post #" + route.n + " - Coolbrador";

    var posts = loadBoardPosts(board);
    try {
      if (CP && typeof CP.loadBoardPostsChronological === "function") {
        posts = CP.loadBoardPostsChronological(board) || posts;
      }
    } catch (_) {}
    var post = posts[route.n - 1];
    if (!post) {
      try {
        var qid = new URLSearchParams(location.search).get("id") || "";
        if (qid) {
          for (var zi = 0; zi < posts.length; zi++) {
            if (posts[zi] && String(posts[zi].id) === String(qid)) { post = posts[zi]; break; }
          }
          if (!post && CP && typeof CP.findPostRecord === "function") {
            var zh = CP.findPostRecord(board, qid);
            if (zh && zh.post && !zh.isReply) post = zh.post;
          }
        }
      } catch (_) {}
    }
    if (!post) {
      if (empty) empty.hidden = false;
      if (postBox) postBox.innerHTML = "";
      if (repliesBox) repliesBox.innerHTML = "";
      ensureTopComposer(CP, false);
      return;
    }
    if (empty) empty.hidden = true;

    if (!CP) {
      postBox.textContent = post.text || "";
      return;
    }

    ensureTopComposer(CP, true);

    post.board = "/b/" + board;
    post.replies = ensureReplyIds(post.replies || []);

    postBox.innerHTML = CP.renderPostCard(post, {
      board: "/b/" + board,
      showBoard: true,
      className: "post-thread-main-card",
      showActions: true,
      skipThreadLink: true
    });
    applyThreadOg(board, post, route.n);
    var inline = postBox.querySelector(".replies");
    if (inline) inline.remove();

    var flat = flattenReplyTree(post.replies);
    if (!flat.length) {
      repliesBox.innerHTML = '<p class="cb-rail-muted post-thread-empty-replies">No comments yet. Be the first Labrador.</p>';
    } else {
      repliesBox.innerHTML = flat.map(function (item, commentIndex) {
        var r = item.reply;
        var depth = Math.min(item.depth, 8);
        var commentN = commentIndex + 1;
        var kids = childCount(post.replies, r.id);
        var replyPost = {
          id: r.id,
          username: r.username || "Lab",
          userId: r.userId,
          text: r.text || "",
          timestamp: r.timestamp,
          media: r.media || null,
          yeahs: r.yeahs || [],
          replies: new Array(kids),
          views: r.views || 0,
          board: "/b/" + board
        };
        var card = CP.renderPostCard(replyPost, {
          board: "/b/" + board,
          skipThreadLink: true,
          showBoard: false,
          hideBoard: true,
          showMenu: true,
          showActions: true,
          showYeahSection: false,
          compact: true,
          className: "post-thread-reply-card"
        });
        // Inline composer: same prefab, no board picker
        var inlineHtml = CP.composerHTML({
          mode: "comment",
          showBoard: false,
          showMedia: true,
          containerClass: "post-thread-inline-compose-inner",
          pfpId: "inlinePfp-" + r.id,
          textId: "inlineText-" + r.id,
          submitId: "inlineSubmit-" + r.id,
          attachId: "inlineAttach-" + r.id,
          previewId: "inlinePreview-" + r.id,
          mediaInputId: "inlineMedia-" + r.id,
          placeholder: "Say something and watch what happens...",
          submitLabel: "Reply"
        });
        return (
          '<div class="post-thread-reply-wrap" id="' + replyDomId(r.id) + '" data-comment-n="' + commentN + '" data-depth="' + depth + '" data-reply-id="' + CP.escapeHtml(r.id) + '">' +
            card +
            '<div class="post-thread-inline-compose" hidden data-parent="' + CP.escapeHtml(r.id) + '">' +
              inlineHtml +
              '<div class="post-thread-inline-cancel-row"><button type="button" class="tool-btn inline-reply-cancel">Cancel</button></div>' +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    postBox._cbPostsBound = false;
    repliesBox._cbPostsBound = false;

    CP.bindFeedInteractions(postBox, {
      navigateToBoard: false,
      onYeah: function () { renderThread(); }
    });

    CP.bindFeedInteractions(repliesBox, {
      navigateToBoard: false,
      onYeah: function () {},
      onComment: function (e, pe) {
        if (!pe || !pe.classList.contains("post-thread-reply-card")) return false;
        var wrap = pe.closest(".post-thread-reply-wrap");
        if (!wrap) return false;
        repliesBox.querySelectorAll(".post-thread-inline-compose").forEach(function (el) {
          if (el.parentElement !== wrap) el.hidden = true;
        });
        var box = wrap.querySelector(".post-thread-inline-compose");
        if (!box) return false;
        var opening = box.hidden;
        box.hidden = !opening;
        if (opening) {
          var pfp = box.querySelector(".post-avatar img");
          if (pfp) pfp.src = CP.getPfp(CP.sessionUserId());
          var ta = box.querySelector("textarea");
          if (ta) {
            ta.focus();
            ta.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          // Wire this inline composer once
          if (!box._cbMounted) {
            box._cbMounted = true;
            var parentId = box.getAttribute("data-parent");
            CP.mountComposer(box.querySelector(".create-post-container") || box, {
              mode: "comment",
              requireBoard: false,
              signInVerb: "Reply",
              onSubmit: function (payload) {
                var chron = loadBoardPosts(board);
                var target = chron[route.n - 1];
                if (!target) return;
                target.replies = target.replies || [];
                var newReply = makeReplyObject(
                  CP.sessionUserId(),
                  currentUserName(CP),
                  payload.text,
                  parentId,
                  payload.media
                );
                target.replies.push(newReply);
                saveBoardPosts(board, chron);
                pingReplyNotif(CP, board, route.n, target.userId, payload.text, target.text || "", newReply.id);
                if (payload.clear) payload.clear();
                renderThread();
                CP.showToast("Replied");
              }
            });
          }
        }
        return true;
      }
    });

    if (!repliesBox._cbInlineCancelWired) {
      repliesBox._cbInlineCancelWired = true;
      repliesBox.addEventListener("click", function (e) {
        var cancel = e.target.closest(".inline-reply-cancel");
        if (!cancel) return;
        e.preventDefault();
        var box = cancel.closest(".post-thread-inline-compose");
        if (box) box.hidden = true;
      });
    }

    // Top-level shared composer (mount once)
    var topBox = document.getElementById("threadCompose");
    if (topBox && !topBox._cbMounted) {
      topBox._cbMounted = true;
      CP.mountComposer(topBox, {
        mode: "comment",
        requireBoard: false,
        signInVerb: "Reply",
        onSubmit: function (payload) {
          var chron = loadBoardPosts(board);
          var target = chron[route.n - 1];
          if (!target) return;
          target.replies = target.replies || [];
          var newReplyTop = makeReplyObject(
            CP.sessionUserId(),
            currentUserName(CP),
            payload.text,
            null,
            payload.media
          );
          target.replies.push(newReplyTop);
          saveBoardPosts(board, chron);
          pingReplyNotif(CP, board, route.n, target.userId, payload.text, target.text || "", newReplyTop.id);
          if (payload.clear) payload.clear();
          renderThread();
          CP.showToast("Commented");
        }
      });
    }
    window.setTimeout(highlightTargetReply, 60);
  }

  document.addEventListener("DOMContentLoaded", renderThread);
  window.addEventListener("hashchange", function () { window.setTimeout(highlightTargetReply, 40); });
})();