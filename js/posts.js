/**
 * CoolbradorPosts - shared Community-style post renderer (vanilla JS, no bundler).
 * Used by Community, boards, Home, Polls, and Gift.
 */
(function (global) {
  "use strict";

  /* Fallback keys match canonical demo roster ids "2".."23" (CB_DEMO_AVATARS). */
  var DEMO_AVATARS = {
    "2": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "3": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "4": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "5": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "6": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "7": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "8": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "9": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "10": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "11": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "12": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "13": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "14": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "15": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png",
    "16": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "17": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "18": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "19": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "20": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "21": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "22": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "23": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"
  };

  
  var BLOCKED_KEY = "cb_blocked_users";

  function getBlockedUsers() {
    try {
      var raw = JSON.parse(localStorage.getItem(BLOCKED_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function isBlockedUser(userId) {
    if (userId == null || userId === "") return false;
    return getBlockedUsers().indexOf(String(userId)) !== -1;
  }

  function setUserBlocked(userId, blocked) {
    var id = String(userId || "");
    if (!id) return getBlockedUsers();
    var list = getBlockedUsers().filter(function (x) { return x !== id; });
    if (blocked) list.push(id);
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(list));
    try {
      document.dispatchEvent(new CustomEvent("cb-blocks-changed", { detail: { userId: id, blocked: !!blocked } }));
    } catch (e) {}
    return list;
  }

  function filterBlockedPosts(posts) {
    var blocked = getBlockedUsers();
    if (!blocked.length) return posts || [];
    return (posts || []).filter(function (p) {
      if (blocked.indexOf(String(p.userId || "")) !== -1) return false;
      if (p && p._repost && blocked.indexOf(String(p._repost.userId || "")) !== -1) return false;
      return true;
    });
  }


  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function timeAgo(date) {
    if (date == null || date === "") return "";
    var ms = typeof date === "number" ? date : Date.parse(date);
    if (isNaN(ms)) return "";
    var s = Math.floor((Date.now() - ms) / 1000);
    var i = s / 31536000; if (i > 1) return Math.floor(i) + "y";
    i = s / 2592000; if (i > 1) return Math.floor(i) + "mo";
    i = s / 86400; if (i > 1) return Math.floor(i) + "d";
    i = s / 3600; if (i > 1) return Math.floor(i) + "h";
    i = s / 60; if (i > 1) return Math.floor(i) + "m";
    return "now";
  }

  function getPfp(id) {
    var key = String(id == null ? "" : id);
    var fromUser = "";
    var fromProf = "";
    try {
      var u = JSON.parse(localStorage.getItem("user_" + key) || "{}");
      if (u && u.profilePicture) fromUser = u.profilePicture;
    } catch (e) {}
    try {
      var p = JSON.parse(localStorage.getItem("profile_" + key) || "null");
      if (p && p.avatar) fromProf = p.avatar;
    } catch (e) {}
    // Use id string as AVATARS key (roster is "2".."23"; do not n-1 remap).
    return localStorage.getItem("pfp_" + key) || fromProf || fromUser ||
      (global.CB_DEMO_AVATARS && global.CB_DEMO_AVATARS[key]) ||
      DEMO_AVATARS[key] ||
      "/users/default/pfp.jpg";
  }

  function profileUrl(userId) {
    var id = String(userId == null ? "" : userId).trim();
    // Only fall back to session for explicit self aliases — never remap a real id.
    if (id === "me" || id === "self") id = sessionUserId() || "";
    if (!id || id === "guest") return "/login.html";
    return "/users/" + encodeURIComponent(id);
  }

  function hasLocalSession() {
    try {
      var loggedIn = localStorage.getItem("loggedIn") === "true";
      var id = String(localStorage.getItem("currentUserId") || "").trim();
      if (!(loggedIn && id && id !== "me" && id !== "guest")) return false;
      // Prefer CoolbradorSession when present, but never let a late/false answer override localStorage truth.
      if (global.CoolbradorSession && typeof global.CoolbradorSession.hasLocalSession === "function") {
        try {
          if (global.CoolbradorSession.hasLocalSession()) return true;
        } catch (e) {}
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function isSignedIn() {
    if (hasLocalSession()) return true;
    if (global.CoolbradorSession) {
      try { if (global.CoolbradorSession.isSignedIn()) return true; } catch (e) {}
    }
    try { if (global.CoolbradorAuth && global.CoolbradorAuth.currentUser) return true; } catch (e) {}
    var id = localStorage.getItem("currentUserId") || "";
    return localStorage.getItem("loggedIn") === "true" && !!id && id !== "me";
  }

  function sessionUserId() {
    try {
      if (global.CoolbradorSession && typeof global.CoolbradorSession.getSessionUserId === "function") {
        var sid = String(global.CoolbradorSession.getSessionUserId() || "");
        if (sid && sid !== "me" && /^\d+$/.test(sid)) return sid;
      }
    } catch (e) {}
    var id = String(localStorage.getItem("currentUserId") || "").trim();
    if (id && id !== "me" && /^\d+$/.test(id)) return id;
    return "";
  }

  function requireSignedIn(what) {
    if (hasLocalSession()) return true;
    if (isSignedIn() && sessionUserId()) return true;
    if (global.CoolbradorSession && typeof global.CoolbradorSession.requireSignedIn === "function") {
      return global.CoolbradorSession.requireSignedIn(what);
    }
    alert("Log in to " + (what || "do that") + ".");
    return false;
  }

  function showToast(msg) {
    var t = document.getElementById("cbToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "cbToast";
      t.className = "cb-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function copyText(text, okMsg) {
    var done = function () { showToast(okMsg || "Copied"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        ta.remove();
        done();
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
      done();
    }
  }

  function cleanBoardName(board) {
    return String(board || "").replace(/^posts_/, "").replace(/^\/?b\//, "").split("/")[0];
  }

  function normalizeBoardKey(board) {
    var clean = cleanBoardName(board);
    if (!clean) return "";
    return "posts_/b/" + clean;
  }

  function boardPathAttr(board) {
    var clean = cleanBoardName(board);
    if (!clean) return "";
    // Community stores data-board as "/b/Name" or the storage suffix after posts_
    if (String(board || "").indexOf("/b/") === 0) return String(board);
    if (String(board || "").indexOf("posts_") === 0) return String(board).replace(/^posts_/, "");
    return "/b/" + clean;
  }


  function loadBoardPostsChronological(board) {
    var key = normalizeBoardKey(board);
    var list = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    return list.slice().sort(function (a, b) {
      var ta = Date.parse(a.timestamp || "") || Number(a.id) || 0;
      var tb = Date.parse(b.timestamp || "") || Number(b.id) || 0;
      if (ta !== tb) return ta - tb;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }

  function getPostNumber(board, postId) {
    var posts = loadBoardPostsChronological(board);
    var idStr = String(postId);
    for (var i = 0; i < posts.length; i++) {
      if (posts[i] && String(posts[i].id) === idStr) return i + 1;
    }
    return 0;
  }

  function postThreadUrl(board, postId) {
    var clean = cleanBoardName(board);
    var n = getPostNumber(board, postId);
    if (!clean || !n) return "";
    return "/b/" + encodeURIComponent(clean) + "/post/" + n + "/comments";
  }

  function postPermalink(postEl) {
    if (postEl && postEl.getAttribute("data-href")) {
      var href = postEl.getAttribute("data-href");
      if (/^https?:\/\//i.test(href)) return href;
      if (href.charAt(0) === "#") return location.href.split("#")[0] + href;
      return location.origin + (href.charAt(0) === "/" ? href : "/" + href);
    }
    var id = postEl && postEl.dataset.id;
    var board = (postEl && postEl.dataset.board) || "";
    var path = postThreadUrl(board, id);
    if (path) return location.origin + path;
    var clean = cleanBoardName(board);
    if (clean) return location.origin + "/b/" + encodeURIComponent(clean) + "/board.html#post-" + id;
    return location.href.split("#")[0] + "#post-" + id;
  }



  var REPOSTS_PREFIX = "reposts_";
  var _missingRepostToastOnce = false;

  function loadUserSummary(userId) {
    var id = String(userId || "");
    // Canonical demo roster is already "1".."22". Only lift true legacy id "0".
    if (/^\d+$/.test(id)) {
      var n = parseInt(id, 10);
      var base = (global.CB_DEMO_ID_BASE != null) ? Number(global.CB_DEMO_ID_BASE) : 2;
      if (n >= 0 && n < base) id = String(base + n);
    }
    var u = {};
    var p = {};
    try { u = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (e) {}
    try { p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {}; } catch (e) {}
    // Stable roster names (SnackBandit=18, BarkBroker=23; DEMO_ID_BASE=2).
    var seedNames = {
      "2": "Cardbrador", "3": "BeeSid", "4": "Miguel", "5": "GyattToad",
      "6": "AnthonySpade", "7": "Barcat", "8": "EvilRobot", "9": "AbovegroundBro",
      "10": "NerdDog", "11": "OrangeTabby", "12": "EvilKid23", "13": "NoFilterBro",
      "14": "CoolDog", "15": "ANIMEGIRL", "16": "PantsWetterLabrador", "17": "RhombusRex",
      "18": "SnackBandit", "19": "BarTabby", "20": "PuddlePirate", "21": "TreatTaxer",
      "22": "SofaThief", "23": "BarkBroker"
    };
    var displayName = (p && p.displayName) || u.displayName || u.username || seedNames[id] || (id ? ("Labrador " + id) : "Labrador");
    var handle = (p && p.handle) || u.handle || u.username || String(displayName).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || (id ? ("lab" + id) : "lab");
    handle = String(handle).replace(/^@/, "");
    return {
      id: id,
      displayName: displayName,
      handle: handle,
      bio: (p && p.bio) || u.bio || "A Labrador on Coolbrador.",
      avatar: getPfp(id),
      posts: (function () {
        var n = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (!key || key.indexOf("posts_") !== 0) continue;
          try {
            var list = JSON.parse(localStorage.getItem(key) || "[]");
            list.forEach(function (p2) { if (String(p2.userId) === id) n += 1; });
          } catch (e) {}
        }
        return n;
      })()
    };
  }

  function loadBoardSummary(board) {
    var clean = cleanBoardName(board);
    var meta = {};
    try { meta = JSON.parse(localStorage.getItem("boardmeta_/b/" + clean) || "{}"); } catch (e) {}
    var posts = 0;
    try {
      var list = JSON.parse(localStorage.getItem(normalizeBoardKey(clean)) || "[]");
      posts = Array.isArray(list) ? list.length : 0;
    } catch (e) {}
    return {
      name: meta.name || clean || "Board",
      desc: meta.desc || "A Coolbrador board for Labradors.",
      href: clean ? ("/b/" + encodeURIComponent(clean) + "/board.html") : "/community.html",
      posts: posts
    };
  }

  function ensureHoverCardCss() {
    if (document.getElementById("cb-hover-card-css")) return;
    var style = document.createElement("style");
    style.id = "cb-hover-card-css";
    style.textContent = [
      ".cb-hover-card{position:fixed;z-index:4500;min-width:240px;max-width:280px;padding:14px;border-radius:14px;",
      "background:var(--cb-navy);border:1px solid rgba(var(--cb-accent-rgb),0.35);",
      "box-shadow:0 16px 40px rgba(0,0,0,0.45);color:var(--cb-text);pointer-events:auto;",
      "opacity:0;transform:translateY(4px);transition:opacity .16s ease,transform .16s ease;}",
      ".cb-hover-card.is-visible{opacity:1;transform:translateY(0);}",
      ".cb-hover-card[hidden]{display:none!important;opacity:0;}",
      ".cb-hover-card-top{display:flex;gap:10px;align-items:center;margin-bottom:8px;}",
      ".cb-hover-card-top img{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(var(--cb-accent-rgb),0.4);}",
      ".cb-hover-card-name{font-weight:800;font-size:0.98rem;line-height:1.2;}",
      ".cb-hover-card-handle{color:var(--cb-muted);font-size:0.82rem;}",
      ".cb-hover-card-bio{font-size:0.86rem;line-height:1.35;color:var(--cb-text);margin:0 0 8px;}",
      ".cb-hover-card-meta{font-size:0.78rem;color:var(--cb-muted);}",
      ".cb-hover-card a.cb-hover-card-open{display:inline-block;margin-top:10px;color:var(--cb-accent-text);text-decoration:none;font-weight:700;font-size:0.82rem;}",
      ".cb-hover-card a.cb-hover-card-open:hover{color:var(--cb-accent);}"
    ].join("");
    document.head.appendChild(style);
  }

  var _hoverCard = { el: null, timer: null, hideTimer: null, kind: "", key: "" };

  function hoverCardEl() {
    ensureHoverCardCss();
    if (_hoverCard.el) return _hoverCard.el;
    var el = document.createElement("div");
    el.className = "cb-hover-card";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.addEventListener("mouseenter", function () {
      if (_hoverCard.hideTimer) { clearTimeout(_hoverCard.hideTimer); _hoverCard.hideTimer = null; }
    });
    el.addEventListener("mouseleave", function () { scheduleHideHoverCard(); });
    document.body.appendChild(el);
    _hoverCard.el = el;
    return el;
  }

  function scheduleHideHoverCard() {
    if (_hoverCard.hideTimer) clearTimeout(_hoverCard.hideTimer);
    _hoverCard.hideTimer = setTimeout(function () {
      var el = _hoverCard.el;
      if (el) {
        el.classList.remove("is-visible");
        setTimeout(function () {
          if (el && !el.classList.contains("is-visible")) el.hidden = true;
        }, 170);
      }
      _hoverCard.kind = "";
      _hoverCard.key = "";
    }, 180);
  }

  function positionHoverCard(anchor, clientX, clientY) {
    var el = hoverCardEl();
    var pad = 10;
    var left;
    var top;
    if (typeof clientX === "number" && typeof clientY === "number") {
      left = clientX + 14;
      top = clientY + 14;
    } else {
      var r = anchor.getBoundingClientRect();
      top = r.bottom + pad;
      left = r.left;
    }
    el.hidden = false;
    // force reflow then fade in
    void el.offsetWidth;
    el.classList.add("is-visible");
    var w = el.offsetWidth || 260;
    var h = el.offsetHeight || 120;
    if (left + w > window.innerWidth - 12) left = Math.max(12, window.innerWidth - w - 12);
    if (top + h > window.innerHeight - 12) top = Math.max(12, (typeof clientY === "number" ? clientY : top) - h - pad);
    el.style.top = Math.round(top) + "px";
    el.style.left = Math.round(left) + "px";
  }

  function showProfileHoverCard(anchor, userId, evt) {
    var sum = loadUserSummary(userId);
    var el = hoverCardEl();
    el.innerHTML =
      '<div class="cb-hover-card-top">' +
        '<a href="' + profileUrl(sum.id) + '"><img src="' + escapeHtml(sum.avatar) + '" alt=""></a>' +
        '<div><div class="cb-hover-card-name">' + escapeHtml(sum.displayName) + "</div>" +
        '<div class="cb-hover-card-handle">@' + escapeHtml(sum.handle) + "</div></div></div>" +
      '<p class="cb-hover-card-bio">' + escapeHtml(String(sum.bio || "").slice(0, 140)) + "</p>" +
      '<div class="cb-hover-card-meta"><strong>' + sum.posts + "</strong> posts</div>" +
      '<a class="cb-hover-card-open" href="' + profileUrl(sum.id) + '">View profile</a>';
    _hoverCard.kind = "profile";
    _hoverCard.key = String(userId || "");
    var cx = evt && typeof evt.clientX === "number" ? evt.clientX : undefined;
    var cy = evt && typeof evt.clientY === "number" ? evt.clientY : undefined;
    positionHoverCard(anchor, cx, cy);
  }

  function showBoardHoverCard(anchor, board) {
    var sum = loadBoardSummary(board);
    var el = hoverCardEl();
    el.innerHTML =
      '<div class="cb-hover-card-top"><div>' +
        '<div class="cb-hover-card-name">' + escapeHtml(sum.name) + "</div>" +
        '<div class="cb-hover-card-handle">Board</div></div></div>' +
      '<p class="cb-hover-card-bio">' + escapeHtml(String(sum.desc || "").slice(0, 140)) + "</p>" +
      '<div class="cb-hover-card-meta"><strong>' + sum.posts + "</strong> posts</div>" +
      '<a class="cb-hover-card-open" href="' + escapeHtml(sum.href) + '">Open board</a>';
    _hoverCard.kind = "board";
    _hoverCard.key = String(board || "");
    positionHoverCard(anchor);
  }

  function bindHoverCards(container) {
    if (!container || container._cbHoverBound) return;
    container._cbHoverBound = true;
    container.addEventListener("mousemove", function (e) {
      _hoverCard.lastX = e.clientX;
      _hoverCard.lastY = e.clientY;
    }, { passive: true });
    container.addEventListener("mouseover", function (e) {
      var av = e.target.closest(".post-avatar[data-profile], .post-header strong[data-profile], a.post-avatar[data-profile], a.reply-avatar-link[data-profile], .reply-body strong[data-profile]");
      if (av && container.contains(av)) {
        var uid = av.getAttribute("data-profile") || "";
        if (!uid) return;
        if (_hoverCard.hideTimer) { clearTimeout(_hoverCard.hideTimer); _hoverCard.hideTimer = null; }
        if (_hoverCard.timer) clearTimeout(_hoverCard.timer);
        var evtSnap = { clientX: e.clientX, clientY: e.clientY };
        _hoverCard.timer = setTimeout(function () { showProfileHoverCard(av, uid, evtSnap); }, 220);
        return;
      }
      var board = e.target.closest("a.post-board");
      if (board && container.contains(board)) {
        if (_hoverCard.hideTimer) { clearTimeout(_hoverCard.hideTimer); _hoverCard.hideTimer = null; }
        if (_hoverCard.timer) clearTimeout(_hoverCard.timer);
        var name = (board.textContent || "").trim();
        _hoverCard.timer = setTimeout(function () { showBoardHoverCard(board, name); }, 220);
      }
    });
    container.addEventListener("mouseout", function (e) {
      var related = e.relatedTarget;
      var leavingCard = _hoverCard.el && related && _hoverCard.el.contains(related);
      var stillOnAnchor = related && related.closest(".post-avatar[data-profile], .post-header strong[data-profile], a.post-avatar[data-profile], a.reply-avatar-link[data-profile], .reply-body strong[data-profile], a.post-board");
      if (leavingCard || stillOnAnchor) return;
      if (_hoverCard.timer) { clearTimeout(_hoverCard.timer); _hoverCard.timer = null; }
      scheduleHideHoverCard();
    });
  }

  function frameToMediaItem(frame) {
    if (!frame) return null;
    var media = frame.querySelector("video.post-media, img.post-media, video, img");
    if (!media) return null;
    var url = media.getAttribute("src") || "";
    if (!url) return null;
    var isVideo = frame.classList.contains("post-media-frame-video") || (media.tagName || "").toLowerCase() === "video";
    return { url: url, type: isVideo ? "video" : "image", name: "coolbrador-media" };
  }

  function openPostMedia(frame) {
    if (!frame) return false;
    var postEl = frame.closest(".post");
    var frames = postEl
      ? Array.prototype.slice.call(postEl.querySelectorAll(".post-media-frame"))
      : [frame];
    if (!frames.length) frames = [frame];
    var items = [];
    var index = 0;
    frames.forEach(function (fr, i) {
      var item = frameToMediaItem(fr);
      if (!item) return;
      if (fr === frame) index = items.length;
      items.push(item);
    });
    if (!items.length) {
      var fallback = frameToMediaItem(frame);
      if (fallback) items.push(fallback);
    }
    if (!items.length) return false;
    if (global.CoolbradorMediaViewer && typeof global.CoolbradorMediaViewer.open === "function") {
      global.CoolbradorMediaViewer.open({
        url: items[index].url,
        type: items[index].type,
        name: items[index].name,
        items: items,
        index: index
      });
      return true;
    }
    return false;
  }

  function getReposts(userId) {
    var id = String(userId || sessionUserId() || "");
    if (!id) return [];
    try {
      var raw = JSON.parse(localStorage.getItem(REPOSTS_PREFIX + id) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }

  
  function userHasReposted(post, userId) {
    try {
      userId = String(userId || "");
      if (!userId || !post) return false;
      var pid = String(post.id || post.postId || "");
      var list = loadReposts(userId) || [];
      return list.some(function (r) {
        return String(r.originalPostId || r.postId || r.id || "") === pid;
      });
    } catch (_) { return false; }
  }
  function sessionUserIdSafe() {
    try {
      if (window.CoolbradorSession && window.CoolbradorSession.getSessionUserId) return String(window.CoolbradorSession.getSessionUserId() || "");
    } catch (_) {}
    try { return String(localStorage.getItem("currentUserId") || ""); } catch (_) { return ""; }
  }

function saveReposts(userId, list) {
    localStorage.setItem(REPOSTS_PREFIX + String(userId), JSON.stringify(list || []));
  }

  function idsEqual(a, b) {
    if (a == null || b == null) return false;
    var sa = String(a).trim();
    var sb = String(b).trim();
    if (!sa || !sb) return false;
    if (sa === sb) return true;
    var na = Number(sa);
    var nb = Number(sb);
    return isFinite(na) && isFinite(nb) && na === nb;
  }

  function recordMatchesId(rec, postId) {
    if (!rec) return false;
    return idsEqual(rec.id, postId) || idsEqual(rec.postId, postId);
  }

  function listBoardStorageKeys(board) {
    var clean = cleanBoardName(board);
    var seen = {};
    var out = [];
    function add(k) {
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(k);
    }
    if (clean) {
      add(normalizeBoardKey(board));
      add("posts_" + clean);
      add("posts_/b/" + clean);
      add("posts_" + clean.toLowerCase());
      add("posts_/b/" + clean.toLowerCase());
    }
    var cleanLower = String(clean || "").toLowerCase();
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf("posts_") !== 0) continue;
      if (!cleanLower || cleanBoardName(k).toLowerCase() === cleanLower) add(k);
    }
    return out;
  }

  function searchPostsKey(key, postId, boardHint) {
    if (!key) return null;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return null; }
    if (!Array.isArray(list)) return null;
    var boardName = cleanBoardName(boardHint || key);
    function walk(replies, parentPost) {
      replies = Array.isArray(replies) ? replies : [];
      for (var r = 0; r < replies.length; r++) {
        var reply = replies[r];
        if (!reply) continue;
        if (recordMatchesId(reply, postId)) {
          return { key: key, board: boardName, post: reply, list: list, isReply: true, parentPost: parentPost };
        }
        var deep = walk(reply.replies, parentPost);
        if (deep) return deep;
      }
      return null;
    }
    for (var i = 0; i < list.length; i++) {
      var rec = list[i];
      if (recordMatchesId(rec, postId)) {
        return { key: key, board: boardName, post: rec, list: list, isReply: false, parentPost: null };
      }
      var nested = walk(rec && rec.replies, rec);
      if (nested) return nested;
    }
    return null;
  }

  function findPostRecord(board, postId) {
    var want = String(postId == null ? "" : postId).trim();
    if (!want || want === "undefined" || want === "null") return null;
    var clean = cleanBoardName(board);
    var seen = {};
    var keys = listBoardStorageKeys(board);
    var i;
    for (i = 0; i < keys.length; i++) {
      if (seen[keys[i]]) continue;
      seen[keys[i]] = true;
      var hit = searchPostsKey(keys[i], want, clean);
      if (hit) return hit;
    }
    // Board empty or case-mismatched: scan every posts_* key by id alone
    for (i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf("posts_") !== 0 || seen[k]) continue;
      seen[k] = true;
      var found = searchPostsKey(k, want, clean);
      if (found) return found;
    }
    return null;
  }

  function createRepost(board, postId) {
    if (!requireSignedIn("repost")) return null;
    var uid = sessionUserId();
    var id = String(postId == null ? "" : postId).trim();
    var found = findPostRecord(board, id);
    if (!found || !found.post) {
      var msg = "Could not find that post";
      if (!_missingRepostToastOnce) {
        _missingRepostToastOnce = true;
        msg = "Could not find that post (id " + (id || "(empty)") + ")";
      }
      showToast(msg);
      return null;
    }
    var existing = getReposts(uid);
    var already = existing.some(function (r) {
      return idsEqual(r.originalPostId, id) && String(r.board) === String(found.board);
    });
    if (already) {
      showToast("Already reposted");
      return existing;
    }
    var userData = {};
    try { userData = JSON.parse(localStorage.getItem("user_" + uid) || "{}"); } catch (e) {}
    var entry = {
      id: "rp-" + Date.now(),
      userId: String(uid),
      username: userData.displayName || userData.username || "Lab",
      timestamp: new Date().toISOString(),
      board: found.board,
      originalPostId: found.post.id,
      snapshot: {
        id: found.post.id,
        userId: found.post.userId,
        username: found.post.username,
        text: found.post.text || "",
        media: found.post.media || null,
        timestamp: found.post.timestamp,
        board: found.board
      ,
        isReply: !!found.isReply,
        parentSnapshot: (found.isReply && found.parentPost) ? {
          id: found.parentPost.id,
          userId: found.parentPost.userId,
          username: found.parentPost.username,
          text: found.parentPost.text || "",
          board: found.board
        } : null
      }
    };
    existing.unshift(entry);
    saveReposts(uid, existing.slice(0, 200));
    showToast("Reposted");
    try { document.dispatchEvent(new CustomEvent("cb-repost", { detail: entry })); } catch (e) {}
    return entry;
  }

  function signedOutComposerHTML(opts) {
    opts = opts || {};
    var verb = opts.verb || "post";
    var extraClass = opts.containerClass ? (" " + opts.containerClass) : "";
    var containerId = opts.containerId ? (' id="' + escapeHtml(opts.containerId) + '"') : "";
    return (
      '<div class="create-post-container cb-composer-signed-out' + extraClass + '"' + containerId + ">" +
        '<div class="cb-composer-gate">' +
          '<p class="cb-composer-gate-title">Sign in to gain rights</p>' +
          '<p class="cb-composer-gate-copy">Labradors need an account to ' + escapeHtml(verb) + " here.</p>" +
          '<a class="post-submit-btn cb-composer-signin" href="/login.html">Sign in</a>' +
        "</div>" +
      "</div>"
    );
  }


  function mediaHTMLFor(post) {
    if (!post || !post.media) return "";
    var list = Array.isArray(post.media) ? post.media : (post.medias || post.mediaItems || [post.media]);
    if (!Array.isArray(list) || !list.length) return "";
    var parts = [];
    list.forEach(function (m) {
      if (!m) return;
      var url = m.url || "";
      if (!url) return;
      if (m.type === "video") {
        parts.push(
          '<div class="post-media-frame post-media-frame-video">' +
          '<video class="post-media-blur" src="' + url + '" muted autoplay loop playsinline aria-hidden="true"></video>' +
          '<video class="post-media" src="' + url + '" muted loop playsinline></video>' +
          "</div>"
        );
      } else if (m.type === "audio" || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) {
        parts.push(
          '<div class="post-media-frame post-media-frame-audio">' +
          '<audio class="post-media" src="' + url + '" preload="metadata"></audio>' +
          "</div>"
        );
      } else {
        parts.push(
          '<div class="post-media-frame">' +
          '<img class="post-media-blur" src="' + url + '" alt="" aria-hidden="true">' +
          '<img class="post-media" src="' + url + '" alt="">' +
          "</div>"
        );
      }
    });
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    return '<div class="post-media-gallery">' + parts.join("") + "</div>";
  }

  function postMenuHTML(opts) {
    opts = opts || {};
    var blockLabel = opts.blocked ? "Unblock user" : "Block user";
    var blockClass = opts.blocked ? "post-menu-unblock" : "post-menu-block";
    var showBlock = opts.showBlock !== false;
    return (
      '<div class="post-menu">' +
        '<button type="button" class="post-menu-btn" aria-label="More options" title="More">' +
          '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>' +
        "</button>" +
        '<div class="post-menu-dropdown" hidden>' +
          '<button type="button" class="post-menu-item post-menu-share">Share</button>' +
          '<button type="button" class="post-menu-item post-menu-embed">Embed</button>' +
          '<button type="button" class="post-menu-item post-menu-community-note">Request community note</button>' +
          (showBlock
            ? '<button type="button" class="post-menu-item ' + blockClass + '" data-block-user="' + escapeHtml(opts.userId || "") + '">' + blockLabel + "</button>"
            : "") +
        "</div>" +
      "</div>"
    );
  }

  function resolvePostId(post) {
    if (!post) return "";
    if (post.id != null && String(post.id).trim() !== "" && String(post.id) !== "undefined") return String(post.id).trim();
    if (post.postId != null && String(post.postId).trim() !== "") return String(post.postId).trim();
    return "";
  }

  function postActionsHTML(post, hasYeah, extraAttrs, hasRepost) {
    var attrs = extraAttrs || "";
    var idAttr = escapeHtml(resolvePostId(post));
    hasRepost = !!hasRepost;
    return (
      '<div class="post-actions">' +
        '<div class="post-action-btns">' +
          '<button type="button" class="action-btn yeah-btn ' + (hasYeah ? "liked" : "") + '" data-id="' + idAttr + '" ' + attrs + ' title="Yeah">' +
            '<i class="fa-solid fa-thumbs-up" aria-hidden="true"></i><span>' + (hasYeah ? "Unyeah" : "Yeah!") + "</span>" +
          "</button>" +
          '<button type="button" class="action-btn repost-btn' + (hasRepost ? ' reposted' : '') + '" data-id="' + idAttr + '" ' + attrs + ' title="Repost">' +
            '<i class="fa-solid fa-retweet" aria-hidden="true"></i><span>' + (hasRepost ? 'Reposted' : 'Repost') + '</span>' +
          "</button>" +
          '<button type="button" class="action-btn comment-btn" data-id="' + idAttr + '" ' + attrs + ' title="Comment">' +
            '<i class="fa-solid fa-comment" aria-hidden="true"></i><span>Comment</span>' +
          "</button>" +
        "</div>" +
        '<div class="stats"><span>' + ((post.replies && post.replies.length) || 0) + " Replies</span><span>" + (post.views || 0) + " Views</span></div>" +
      "</div>"
    );
  }

  function repliesHTML(post) {
    var replies = post.replies || [];
    if (!replies.length) return '<div class="replies" hidden></div>';
    var items = replies.map(function (r) {
      return (
        '<div class="reply">' +
          ('<a class="reply-avatar-link" href="' + profileUrl(r.userId) + '" data-profile="' + escapeHtml(r.userId || "") + '"><img class="reply-avatar" src="' + getPfp(r.userId) + '" alt=""></a>') +
          '<div class="reply-body">' +
            '<strong data-profile="' + escapeHtml(r.userId || "") + '">' + escapeHtml(r.username || "Lab") + "</strong>" +
            '<span class="reply-meta">' + timeAgo(r.timestamp) + "</span>" +
            '<div class="reply-text">' + escapeHtml(r.text || "") + "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");
    return '<div class="replies is-open">' + items + "</div>";
  }

  function yeahSectionHTML(post, hasYeah) {
    var yeahs = post.yeahs || [];
    var yeahCountText = yeahs.length === 1 ? "1 person gave this post a Yeah."
      : yeahs.length > 1 ? yeahs.length + " people gave this post a Yeah." : "";
    return (
      '<div class="yeah-section ' + (hasYeah ? "visible" : "") + '">' +
        (yeahCountText ? '<div class="yeah-label">' + yeahCountText + "</div>" : "") +
        '<div class="yeah-avatars">' +
          yeahs.slice(0, 12).map(function (id) {
            return '<img src="' + getPfp(id) + '" alt="">';
          }).join("") +
          (yeahs.length > 12 ? "<span>+" + (yeahs.length - 12) + "</span>" : "") +
        "</div></div>"
    );
  }

  /**
   * Render a Community-style post card.
   * opts: {
   *   board, showBoard, compact, href, className,
   *   showActions, showYeahSection, showMenu, canEdit,
   *   actionsHtml, headerExtra, textHtml, skipBindData,
   *   repostBy: { userId, username }
   * }
   */
  function renderPostCard(post, opts) {
    opts = opts || {};
    post = post || {};
    post.yeahs = Array.isArray(post.yeahs) ? post.yeahs : [];
    post.replies = Array.isArray(post.replies) ? post.replies : [];
    post.views = post.views || 0;
    try {
      var _bForView = opts && opts.board != null ? opts.board : (post.board || "");
      cbBumpBeeSidView(_bForView, post);
    } catch (_eView) {}

    var boardRaw = opts.board != null ? opts.board : (post.board || "");
    var boardAttr = boardPathAttr(boardRaw);
    var cleanBoard = cleanBoardName(boardRaw || boardAttr);
    if (!boardAttr && cleanBoard) boardAttr = boardPathAttr(cleanBoard);
    var postIdVal = resolvePostId(post);
    var postIdAttr = escapeHtml(postIdVal);
    var boardVal = boardAttr || (cleanBoard ? "/b/" + cleanBoard : "");
    var uid = sessionUserId();
    var hasYeah = post.yeahs.map(String).includes(String(uid));
    var hasRepost = (typeof userHasReposted === 'function') ? !!userHasReposted(post, sessionUserIdSafe()) : false;
    var avatar = opts.avatar || getPfp(post.userId);
    var showBoard = opts.showBoard !== false && !!cleanBoard && !opts.hideBoard;
    var showActions = opts.showActions !== false;
    var showYeah = opts.showYeahSection !== false && showActions;
    var showMenu = opts.showMenu !== false;
    var canEdit = !!opts.canEdit;
    var extraClass = opts.className ? " " + opts.className : "";
    if (opts.compact) extraClass += " post-compact";
    var repostBy = opts.repostBy || post._repost || null;
    if (repostBy && (repostBy.userId || repostBy.username)) extraClass += " is-repost";

    var boardAttrHtml = ' data-board="' + escapeHtml(boardVal) + '"';
    var threadUrl = opts.href || (opts.skipThreadLink ? "" : postThreadUrl(boardRaw || boardAttr, postIdVal || post.id));
    var hrefAttr = threadUrl ? (' data-href="' + escapeHtml(threadUrl) + '"') : "";
    var stretchLink = threadUrl
      ? '<a class="post-stretch-link" href="' + escapeHtml(threadUrl) + '" tabindex="-1" aria-hidden="true"></a>'
      : "";
    var boardLink = showBoard
      ? '<a class="post-board" href="/b/' + encodeURIComponent(cleanBoard) + '/board.html" data-board-name="' + escapeHtml(cleanBoard) + '">' + escapeHtml(cleanBoard) + "</a>"
      : "";

    var editBtns = canEdit
      ? '<button type="button" class="post-edit-btn" data-id="' + postIdAttr + '">Edit</button>' +
        '<button type="button" class="post-del-btn" data-id="' + postIdAttr + '">Delete</button>'
      : "";

    var textInner = opts.textHtml != null
      ? opts.textHtml
      : escapeHtml(post.text || "").replace(/\n/g, "<br>");

    var actionBoard = 'data-board="' + escapeHtml(boardVal) + '"';
    var actions = opts.actionsHtml != null
      ? opts.actionsHtml
      : (showActions ? postActionsHTML(post, hasYeah, actionBoard, hasRepost) : "");

    var repostRow = "";
    if (repostBy && (repostBy.userId || repostBy.username)) {
      var rpUid = String(repostBy.userId || "").trim();
      var rpName = (rpUid && uid && String(rpUid) === String(uid))
        ? "You"
        : (repostBy.username || repostBy.displayName || "Lab");
      var nameInner = "<strong>" + escapeHtml(rpName) + "</strong>";
      if (rpUid) {
        nameInner = '<a class="cb-repost-context-name" href="' + escapeHtml(profileUrl(rpUid)) + '" data-profile="' + escapeHtml(rpUid) + '">' + nameInner + "</a>";
      }
      repostRow = '<div class="cb-repost-context"><i class="fa-solid fa-retweet" aria-hidden="true"></i> ' + nameInner + " reposted</div>";
    }

    var quoteCtx = "";
    try {
      var parentSnap = null;
      if (typeof repostBy !== "undefined" && repostBy && (repostBy.parentSnapshot || (repostBy.snapshot && repostBy.snapshot.parentSnapshot))) {
        parentSnap = repostBy.parentSnapshot || repostBy.snapshot.parentSnapshot;
      }
      if (!parentSnap && post && post._quoteParent) parentSnap = post._quoteParent;
      if (parentSnap && (parentSnap.text || parentSnap.username)) {
        var qBoard = String(parentSnap.board || "").replace(/^\/b\//, "");
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

    return (
      '<div class="post' + extraClass + '" data-id="' + postIdAttr + '"' + boardAttrHtml + hrefAttr + ">" +
        stretchLink +
        repostRow +
        '<div class="post-avatar-col" aria-hidden="false">' +
          '<a class="post-avatar" href="' + escapeHtml(profileUrl(post.userId)) + '" data-profile="' + escapeHtml(post.userId || "") + '" title="Profile">' +
            '<img src="' + avatar + '" alt="">' +
          "</a>" +
        "</div>" +
        '<div class="post-body">' +
          '<div class="post-header">' +
            '<a class="post-author-link" href="' + escapeHtml(profileUrl(post.userId)) + '"><strong data-profile="' + escapeHtml(post.userId || "") + '">' + escapeHtml(post.username || "User") + "</strong></a>" +
            '<span class="post-meta">' + timeAgo(post.timestamp) + "</span>" +
            boardLink +
            (opts.headerExtra || "") +
            editBtns +
            (showMenu ? postMenuHTML({ userId: post.userId, blocked: isBlockedUser(post.userId), showBlock: !!post.userId && String(post.userId) !== String(uid) }) : "") +
          "</div>" +
          '<div class="post-text"' + (canEdit ? ' data-text-id="' + post.id + '"' : "") + ">" + textInner + "</div>" +
          mediaHTMLFor(post) +
          actions +
          (showYeah ? yeahSectionHTML(post, hasYeah) : "") +
        "</div></div>"
    );
  }

  function listStorageKeys(boards) {
    var keys = [];
    if (!boards || boards === "all") {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith("posts_")) keys.push(k);
      }
      return keys;
    }
    var list = Array.isArray(boards) ? boards : [boards];
    list.forEach(function (b) {
      var key = normalizeBoardKey(b);
      if (key) keys.push(key);
    });
    return keys;
  }

  function loadPostsFromStorage(boards) {
    var all = [];
    listStorageKeys(boards).forEach(function (storageKey) {
      var list = [];
      try { list = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (e) { list = []; }
      (list || []).forEach(function (p) {
        if (!p) return;
        p.board = storageKey.replace(/^posts_/, "");
        p.yeahs = p.yeahs || [];
        p.replies = p.replies || [];
        p.views = p.views || 0;
        all.push(p);
      });
    });
    all.sort(function (a, b) { return postSortTs(b) - postSortTs(a); });
    return all;
  }

  function postSortTs(p) {
    var t = Date.parse((p && p.timestamp) || "") || 0;
    if (t) return t;
    var n = Number(p && p.id);
    return isFinite(n) ? n : 0;
  }

  function boardAllowedForFeed(board, boards) {
    if (boards == null || boards === "all") return true;
    var clean = cleanBoardName(board).toLowerCase();
    if (!clean) return true;
    var list = Array.isArray(boards) ? boards : [boards];
    for (var i = 0; i < list.length; i++) {
      if (cleanBoardName(list[i]).toLowerCase() === clean) return true;
    }
    return false;
  }

  function loadAllRepostEntries() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(REPOSTS_PREFIX) !== 0) continue;
      var list = [];
      try { list = JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { list = []; }
      if (!Array.isArray(list)) continue;
      for (var j = 0; j < list.length; j++) {
        if (list[j]) out.push(list[j]);
      }
    }
    return out;
  }

  function feedPostFromRepost(entry) {
    if (!entry) return null;
    var snap = entry.snapshot || {};
    var origId = entry.originalPostId != null ? entry.originalPostId : snap.id;
    var live = findPostRecord(entry.board || snap.board || "", origId);
    var src = (live && live.post) ? live.post : snap;
    var board = entry.board || src.board || snap.board || (live && live.board) || "";
    return {
      id: src.id != null ? src.id : (snap.id != null ? snap.id : origId),
      userId: src.userId != null ? src.userId : snap.userId,
      username: src.username || snap.username || "Lab",
      text: src.text != null ? src.text : (snap.text || ""),
      media: src.media || snap.media || null,
      timestamp: entry.timestamp || src.timestamp || snap.timestamp,
      board: board,
      yeahs: src.yeahs || snap.yeahs || [],
      replies: src.replies || snap.replies || [],
      views: src.views || snap.views || 0,
      _repost: {
        userId: entry.userId,
        username: entry.username,
        id: entry.id,
        originalPostId: origId
      }
    };
  }

  function mergeRepostsIntoPosts(posts, opts) {
    opts = opts || {};
    var list = (posts || []).slice();
    var seenRp = {};
    var entries = loadAllRepostEntries();
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var card = feedPostFromRepost(entry);
      if (!card) continue;
      if (!boardAllowedForFeed(card.board, opts.boards)) continue;
      var rpKey = String(entry.userId || "") + "::" + String(entry.originalPostId || (entry.snapshot && entry.snapshot.id) || "") + "::" + String(entry.board || "");
      if (seenRp[rpKey]) continue;
      seenRp[rpKey] = true;
      list.push(card);
    }
    list.sort(function (a, b) {
      var tb = postSortTs(b);
      var ta = postSortTs(a);
      if (tb !== ta) return tb - ta;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
    return list;
  }

  function loadFeedPosts(opts) {
    opts = opts || {};
    var boards = opts.boards == null ? "all" : opts.boards;
    var posts = loadPostsFromStorage(boards);
    if (opts.includeReposts !== false) {
      posts = mergeRepostsIntoPosts(posts, { boards: boards });
    } else {
      posts.sort(function (a, b) { return postSortTs(b) - postSortTs(a); });
    }
    if (typeof opts.filter === "function") posts = posts.filter(opts.filter);
    posts = filterBlockedPosts(posts);
    try {
      if (window.CoolbradorSensitiveFilter && typeof window.CoolbradorSensitiveFilter.filterPosts === "function") {
        posts = window.CoolbradorSensitiveFilter.filterPosts(posts);
      }
    } catch (_cbSens) {}
    if (opts.sort !== "chrono" && global.CoolbradorFeedAlgo && typeof global.CoolbradorFeedAlgo.rankPosts === "function") {
      try {
        posts = global.CoolbradorFeedAlgo.rankPosts(posts, { diversity: true });
      } catch (eAlgo) {}
    } else if (opts.sort !== "ranked") {
      /* keep prior order from mergeReposts / chrono */
    }
    if (opts.limit) posts = posts.slice(0, opts.limit);
    return posts;
  }

  function savePost(board, post) {
    var key = normalizeBoardKey(board);
    if (!key || !post) return null;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
    list.unshift(post);
    localStorage.setItem(key, JSON.stringify(list));
    cbMirrorChipperIfBeeSid(key);
    return post;
  }


  function paintYeahState(post, yeahBtn) {
    if (!post || !yeahBtn) return;
    var uid = sessionUserId();
    var hasYeah = (post.yeahs || []).map(String).includes(String(uid));
    yeahBtn.classList.toggle("liked", hasYeah);
    yeahBtn.title = hasYeah ? "Unyeah" : "Yeah";
    var label = yeahBtn.querySelector("span");
    if (label) label.textContent = hasYeah ? "Unyeah" : "Yeah!";
    var card = yeahBtn.closest(".post");
    if (!card) return;
    var section = card.querySelector(".yeah-section");
    var html = yeahSectionHTML(post, hasYeah);
    if (section) {
      section.outerHTML = html;
    } else if (hasYeah) {
      var actions = card.querySelector(".post-actions, .action-row, .post-footer");
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      var node = wrap.firstElementChild;
      if (!node) return;
      if (actions && actions.parentNode) actions.parentNode.insertBefore(node, actions.nextSibling);
      else card.appendChild(node);
    }
  }


  function cbMirrorChipperIfBeeSid(board) {
    try {
      var b = String(board || "");
      if (!/BeeSid/i.test(b)) return;
      if (window.CoolbradorChipperFeed) {
        if (typeof window.CoolbradorChipperFeed.onBeeSidWrite === "function") {
          window.CoolbradorChipperFeed.onBeeSidWrite(b);
          return;
        }
        if (typeof window.CoolbradorChipperFeed.mirrorFromBoard === "function") {
          window.CoolbradorChipperFeed.mirrorFromBoard();
        }
      }
    } catch (e) {}
  }


  function cbBumpBeeSidView(board, post) {
    try {
      if (!post || !/BeeSid/i.test(String(board || ""))) return;
      var pid = String(post.id);
      var seenKey = "cb_viewed_/b/BeeSid_" + pid;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
      post.views = (Number(post.views) || 0) + 1;
      var key = "posts_/b/BeeSid";
      var raw = localStorage.getItem(key);
      if (!raw) return;
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === pid) {
          list[i].views = post.views;
          break;
        }
      }
      localStorage.setItem(key, JSON.stringify(list));
      cbMirrorChipperIfBeeSid(board);
    } catch (e) {}
  }

  function toggleYeah(board, postId) {
    if (!requireSignedIn("Yeah a post")) return null;
    var uid = sessionUserId();
    var found = findPostRecord(board, postId);
    if (!found || !found.post) found = findPostRecord("", postId);
    if (!found || !found.post) return null;
    var post = found.post;
    post.yeahs = post.yeahs || [];
    var idx = post.yeahs.findIndex(function (id) { return String(id) === String(uid); });
    var added = false;
    if (idx > -1) post.yeahs.splice(idx, 1);
    else {
      post.yeahs.push(uid);
      added = true;
    }
    try { localStorage.setItem(found.key, JSON.stringify(found.list)); } catch (e) { return null; }
    cbMirrorChipperIfBeeSid(found.board || board);
    if (added && global.CoolbradorNotifications && typeof global.CoolbradorNotifications.notifyYeah === "function") {
      var actorName = "Lab";
      try {
        var u = JSON.parse(localStorage.getItem("user_" + uid) || "{}");
        actorName = u.displayName || u.username || actorName;
      } catch (e) {}
      var rootId = (found.parentPost && found.parentPost.id != null) ? found.parentPost.id : post.id;
      try {
        global.CoolbradorNotifications.notifyYeah(
          uid,
          actorName,
          post.userId,
          postThreadUrl(found.board, rootId) || "/notifications",
          post.text || "",
          {
            board: found.board,
            postN: getPostNumber(found.board, rootId),
            postSnippet: post.text || ""
          }
        );
      } catch (_) {}
    }
    return post;
  }


  function bindFeedInteractions(container, opts) {
    opts = opts || {};
    if (!container || container._cbPostsBound) return;
    container._cbPostsBound = true;

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".post-menu")) {
        document.querySelectorAll(".post-menu-dropdown:not([hidden])").forEach(function (d) { d.hidden = true; });
      }
    });

    bindHoverCards(container);

    document.addEventListener("cb-repost", function () {
      if (typeof opts.reload === "function") opts.reload();
    });

    container.addEventListener("auxclick", function (e) {
      // Middle-click profile photo / name -> open profile in new tab
      if (e.button !== 1) return;
      var profileHit = e.target.closest(".post-avatar[data-profile], a.post-avatar[data-profile], .post-header > strong[data-profile], .post-author-link");
      if (!profileHit) return;
      var a = profileHit.closest("a[href]") || profileHit;
      var href = (a && a.getAttribute && a.getAttribute("href")) || "";
      if (!href) {
        var pid = profileHit.getAttribute("data-profile") || "";
        if (pid) href = profileUrl(pid);
      }
      if (!href) return;
      // If already a real <a>, browser handles middle-click; only force for non-anchor wrappers
      if (a && a.tagName === "A") return;
      e.preventDefault();
      window.open(href, "_blank", "noopener");
    });

    container.addEventListener("click", function (e) {
      // Profile navigation from avatar or display name (left-click only; middle/ctrl use native <a>)
      var profileHit = e.target.closest(".post-avatar[data-profile], a.post-avatar[data-profile], .post-header > strong[data-profile], .post-author-link, .reply-body > strong[data-profile]");
      if (profileHit) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var anchor = profileHit.closest("a[href]") || profileHit;
        var pid = profileHit.getAttribute("data-profile") || (anchor.getAttribute && anchor.getAttribute("data-profile")) || "";
        if (!pid && profileHit.querySelector) {
          var nested = profileHit.querySelector("[data-profile]");
          if (nested) pid = nested.getAttribute("data-profile") || "";
        }
        if (anchor && anchor.tagName === "A" && anchor.getAttribute("href")) {
          e.preventDefault();
          e.stopPropagation();
          location.href = anchor.getAttribute("href");
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (pid) location.href = profileUrl(pid);
        return;
      }

      var mediaFrame = e.target.closest(".post-media-frame");
      if (mediaFrame) {
        // Allow native video control clicks (progress/volume) without hijacking
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "video" && e.target.controls) {
          var rect = e.target.getBoundingClientRect();
          var y = e.clientY - rect.top;
          if (y > rect.height * 0.72) return; // bottom control strip
        }
        e.preventDefault();
        e.stopPropagation();
        openPostMedia(mediaFrame);
        return;
      }

      var menuBtn = e.target.closest(".post-menu-btn");
      if (menuBtn) {
        e.preventDefault();
        e.stopPropagation();
        var drop = menuBtn.parentElement.querySelector(".post-menu-dropdown");
        var open = drop && !drop.hidden;
        document.querySelectorAll(".post-menu-dropdown").forEach(function (d) { d.hidden = true; });
        if (drop) drop.hidden = open;
        return;
      }
      
      var blockBtn = e.target.closest(".post-menu-block, .post-menu-unblock");
      if (blockBtn) {
        e.preventDefault();
        e.stopPropagation();
        var uidBlock = blockBtn.getAttribute("data-block-user") || "";
        var postElB = blockBtn.closest(".post");
        if (!uidBlock && postElB) {
          var av = postElB.querySelector("[data-profile]");
          if (av) uidBlock = av.getAttribute("data-profile") || "";
        }
        if (!uidBlock) return;
        var willBlock = blockBtn.classList.contains("post-menu-block");
        var nameEl = postElB && postElB.querySelector(".post-header strong");
        var uname = nameEl ? nameEl.textContent.trim() : "this Labrador";
        if (willBlock) {
          if (!confirm("Block " + uname + "? Their posts will hide from your feeds.")) return;
          setUserBlocked(uidBlock, true);
          showToast("Blocked " + uname);
        } else {
          setUserBlocked(uidBlock, false);
          showToast("Unblocked " + uname);
        }
        var dropB = blockBtn.closest(".post-menu-dropdown");
        if (dropB) dropB.hidden = true;
        if (typeof opts.reload === "function") opts.reload();
        else if (typeof opts.onBlockChange === "function") opts.onBlockChange(uidBlock, willBlock);
        return;
      }

      var shareBtn = e.target.closest(".post-menu-community-note");
      if (e.target.closest(".post-menu-community-note")) {
        e.preventDefault();
        e.stopPropagation();
        openCommunityNoteModal(e.target.closest(".post"));
        var noteDrop = e.target.closest(".post-menu-dropdown");
        if (noteDrop) noteDrop.hidden = true;
        return;
      }
      e.target.closest(".post-menu-share");
      if (shareBtn) {
        e.preventDefault();
        e.stopPropagation();
        var postEl = shareBtn.closest(".post");
        copyText(postPermalink(postEl), "Link copied");
        shareBtn.closest(".post-menu-dropdown").hidden = true;
        return;
      }
      var embedBtn = e.target.closest(".post-menu-embed");
      if (embedBtn) {
        e.preventDefault();
        e.stopPropagation();
        var postEl2 = embedBtn.closest(".post");
        var link = postPermalink(postEl2);
        var boardName = (postEl2.getAttribute("data-board") || "").replace(/^\/b\//, "").replace(/\/.*$/, "") || "Coolbrador";
        var textEl = postEl2.querySelector(".post-text");
        var title = ((textEl && textEl.innerText) || "Post").replace(/\s+/g, " ").trim().slice(0, 120);
        var img = postEl2.querySelector(".post-media img, .post-body img");
        var imgUrl = img && img.getAttribute("src") ? img.getAttribute("src") : "";
        if (imgUrl && imgUrl.charAt(0) === "/") imgUrl = location.origin + imgUrl;
        var snippet =
          "<!-- Coolbrador embed: " + boardName + " -->\n" +
          '<blockquote class="coolbrador-embed">' +
          '<strong>' + boardName.replace(/</g, "&lt;") + "</strong> - " +
          title.replace(/</g, "&lt;") +
          (imgUrl ? '<br><img src="' + imgUrl + '" alt="">' : "") +
          '<br><a href="' + link + '">View on Coolbrador</a></blockquote>';
        copyText(snippet, "Embed snippet copied");
        // refresh OG tags on this page for good measure
        if (window.CoolbradorOg) {
          window.CoolbradorOg.apply({
            title: boardName + " - " + title.slice(0, 90),
            description: title,
            image: imgUrl || "/img/PlanetChipperHomepage.png",
            url: link
          });
        }
        embedBtn.closest(".post-menu-dropdown").hidden = true;
        return;
      }

      var noteVote = e.target.closest("[data-note-vote]");
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

      var yeahBtn = e.target.closest(".yeah-btn");
      if (yeahBtn && !yeahBtn.closest(".post-poll") && !yeahBtn.hasAttribute("data-vote")) {
        e.stopPropagation();
        var board = yeahBtn.dataset.board || (yeahBtn.closest(".post") && yeahBtn.closest(".post").dataset.board);
        var postCard = yeahBtn.closest(".post");
        var yScroll = window.scrollY || window.pageYOffset || 0;
        var topBefore = postCard ? postCard.getBoundingClientRect().top : null;
        var updated = toggleYeah(board, yeahBtn.dataset.id);
        if (updated) {
          paintYeahState(updated, yeahBtn);
          if (typeof opts.onYeah === "function") opts.onYeah(updated, yeahBtn);
          requestAnimationFrame(function () {
            var card = (postCard && postCard.isConnected) ? postCard : document.querySelector('.post[data-id="' + (yeahBtn.dataset.id || "") + '"]');
            if (card && topBefore != null) {
              var delta = card.getBoundingClientRect().top - topBefore;
              if (Math.abs(delta) > 1) window.scrollTo(0, (window.scrollY || 0) + delta);
              else if (Math.abs((window.scrollY || 0) - yScroll) > 2) window.scrollTo(0, yScroll);
            } else if (Math.abs((window.scrollY || 0) - yScroll) > 2) {
              window.scrollTo(0, yScroll);
            }
          });
        }
        return;
      }

      var repostBtn = e.target.closest(".repost-btn");
      if (repostBtn) {
        e.preventDefault();
        e.stopPropagation();
        var pe = repostBtn.closest(".post");
        var board = String(
          (repostBtn.getAttribute && repostBtn.getAttribute("data-board")) ||
          (pe && pe.getAttribute && pe.getAttribute("data-board")) ||
          ""
        ).trim();
        var id = String(
          (repostBtn.getAttribute && repostBtn.getAttribute("data-id")) ||
          (pe && pe.getAttribute && pe.getAttribute("data-id")) ||
          ""
        ).trim();
        createRepost(board, id);
        if (typeof opts.onRepost === "function") opts.onRepost(board, id);
        return;
      }
      var commentBtn = e.target.closest(".comment-btn");
      if (commentBtn) {
        if (commentBtn.closest(".post-poll") || commentBtn.hasAttribute("data-open")) return;
        e.preventDefault();
        e.stopPropagation();
        var pe2 = commentBtn.closest(".post");
        if (typeof opts.onComment === "function" && opts.onComment(e, pe2, commentBtn) === true) {
          return;
        }
        var threadHref = (pe2 && pe2.dataset.href) || postThreadUrl((pe2 && pe2.dataset.board) || "", pe2 && pe2.dataset.id);
        if (threadHref) {
          location.href = threadHref;
          return;
        }
        showToast("Comments unavailable");
        return;
      }


      if (typeof opts.onClick === "function") {
        if (opts.onClick(e) === true) return;
      }

      if (e.target.closest(".post-board") || e.target.closest(".post-menu") ||
          e.target.closest(".post-actions") ||
          e.target.closest(".post-edit-btn") || e.target.closest(".post-del-btn") ||
          e.target.closest(".post-stretch-link") || e.target.closest("a[href]")) return;

      // Real link handles middle-click / ctrl-click / open-in-new-tab; skip JS nav for modified clicks
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var postDiv = e.target.closest(".post");
      if (!postDiv || e.target.closest("a") || e.target.closest("button") || e.target.closest("textarea") || e.target.closest("input")) return;
      if (postDiv.classList.contains("post-poll")) return;
      if (postDiv.dataset.href) {
        location.href = postDiv.dataset.href;
        return;
      }
      var computed = postThreadUrl(postDiv.dataset.board || "", postDiv.dataset.id);
      if (computed) {
        location.href = computed;
        return;
      }
      if (opts.navigateToBoard !== false) {
        var b = cleanBoardName(postDiv.dataset.board || "");
        if (b) location.href = "/b/" + b + "/board.html";
      }
    });
  }

  /**
   * Mount a vertical Community-style feed.
   * opts: { boards?: string[]|"all", filter?: fn, limit?, emptyHtml?, showBoard?, className?, reloadable, includeReposts? }
   */
  function mountFeed(container, opts) {
    opts = opts || {};
    if (!container) return { reload: function () {} };

    function render() {
      try {
        var posts = loadFeedPosts({
          boards: opts.boards == null ? "all" : opts.boards,
          filter: opts.filter,
          limit: opts.limit,
          includeReposts: opts.includeReposts
        });

        if (!posts.length) {
          container.innerHTML = opts.emptyHtml || '<p class="empty-feed">No posts yet. Be the first Labrador to share something!</p>';
          return;
        }

        container.innerHTML = posts.map(function (post) {
          try {
            return renderPostCard(post, {
              board: post.board,
              showBoard: opts.showBoard !== false,
              className: opts.cardClass || "",
              compact: !!opts.compact,
              repostBy: post._repost || null
            });
          } catch (cardErr) {
            try { console.warn("CoolbradorPosts: skip bad post", post && post.id, cardErr); } catch (_) {}
            return "";
          }
        }).join("");
        if (!String(container.innerHTML || "").trim()) {
          container.innerHTML = opts.emptyHtml || '<p class="empty-feed">No posts yet. Be the first Labrador to share something!</p>';
        }
      } catch (err) {
        try { console.error("CoolbradorPosts.mountFeed failed", err); } catch (_) {}
        container.innerHTML = opts.emptyHtml || '<p class="empty-feed">Could not load posts. Refresh and try again.</p>';
      }
    }

    bindFeedInteractions(container, {
      reload: render,
      onYeah: function () { /* in-place paintYeahState keeps scroll */ },
      onClick: opts.onClick,
      navigateToBoard: opts.navigateToBoard
    });

    render();
    return { reload: render, container: container };
  }


  /**
   * Shared create-post / comment composer markup.
   * opts: {
   *   mode: "post"|"comment",
   *   showBoard?: bool (default true for post, false for comment),
   *   showMedia?: bool (default true),
   *   placeholder?, submitLabel?,
   *   pfpId?, textId?, submitId?, mediaInputId?, attachId?, previewId?, boardInputId?,
   *   containerClass?, containerId?
   * }
   */
  function composerHTML(opts) {
    opts = opts || {};
    var mode = opts.mode || "post";
    var showBoard = opts.showBoard != null ? !!opts.showBoard : mode === "post";
    var showMedia = opts.showMedia !== false;
    var placeholder = opts.placeholder || "Say something and watch what happens...";
    var submitLabel = opts.submitLabel || (mode === "comment" ? "Reply" : "Post");
    var pfpId = opts.pfpId || "currentUserPfp";
    var textId = opts.textId || "newPostText";
    var submitId = opts.submitId || "submitPost";
    var mediaInputId = opts.mediaInputId || "mediaInput";
    var attachId = opts.attachId || "attachMedia";
    var previewId = opts.previewId || "mediaPreview";
    var boardInputId = opts.boardInputId || "boardInput";
    var containerId = opts.containerId ? (' id="' + escapeHtml(opts.containerId) + '"') : "";
    var extraClass = opts.containerClass ? (" " + opts.containerClass) : "";

    var boardBlock = showBoard
      ? '<div class="board-input-wrapper">' +
          '<input type="text" id="' + boardInputId + '" value="' + escapeHtml(opts.defaultBoard || "General") + '" placeholder="Pick a community / your board" autocomplete="off">' +
          '<div id="suggestions"></div>' +
        "</div>"
      : "";

    var tools = showMedia
      ? '<div class="post-tools">' +
          '<button type="button" class="tool-btn tool-btn-photo" id="' + attachId + '" title="Add photo" data-media-kind="image">' +
            '<i class="fa-regular fa-image" aria-hidden="true"></i> Photo' +
          "</button>" +
          '<button type="button" class="tool-btn tool-btn-video" id="' + attachId + 'Video" title="Add video" data-media-kind="video">' +
            '<i class="fa-solid fa-video" aria-hidden="true"></i> Video' +
          "</button>" +
        "</div>"
      : '<div class="post-tools"></div>';

    var preview = showMedia
      ? '<div class="media-preview" id="' + previewId + '" style="display:none; position:relative;"></div>'
      : "";

    var fileInput = showMedia
      ? '<input type="file" id="' + mediaInputId + '" accept="image/*,video/*" style="display:none;">'
      : "";

    return (
      '<div class="create-post-container' + extraClass + '"' + containerId + ">" +
        '<div class="create-post">' +
          '<div class="post-avatar">' +
            '<img id="' + pfpId + '" src="/users/default/pfp.jpg" alt="You">' +
          "</div>" +
          '<textarea id="' + textId + '" placeholder="' + escapeHtml(placeholder) + '"></textarea>' +
        "</div>" +
        preview +
        '<div class="create-post-footer">' +
          tools +
          boardBlock +
          '<button type="button" class="post-submit-btn" id="' + submitId + '" disabled>' + escapeHtml(submitLabel) + "</button>" +
        "</div>" +
        fileInput +
      "</div>"
    );
  }
  /**
   * Optional composer helper. Community / boards may keep their own wiring.
   * opts: { boardInput?, defaultBoard, onPosted, getBoardName }
   */
  function mountComposer(container, opts) {
    opts = opts || {};
    if (!container) return null;
    var mode = opts.mode || "post";
    // Local session first: show real composer even while Firebase authReady is still false.
    if (!hasLocalSession() && !isSignedIn() && opts.allowSignedOut !== true) {
      var gateVerb = opts.signInVerb || (mode === "comment" ? "reply" : "post");
      var keepId = container.id || opts.containerId || "";
      var parent = container.parentNode;
      container.outerHTML = signedOutComposerHTML({
        verb: gateVerb,
        containerId: keepId,
        containerClass: opts.containerClass || ""
      });
      // If auth resolves later with a local session, swap gate for real composer once.
      try {
        var retry = function () {
          if (!hasLocalSession() && !isSignedIn()) return;
          var el = keepId ? document.getElementById(keepId) : null;
          if (!el && parent) el = parent.querySelector(".cb-composer-signed-out");
          if (!el) return;
          var html = composerHTML({
            mode: mode,
            showBoard: opts.requireBoard !== false && mode !== "comment",
            containerId: keepId,
            containerClass: opts.containerClass || "",
            defaultBoard: opts.defaultBoard || "General"
          });
          el.outerHTML = html;
          var fresh = keepId ? document.getElementById(keepId) : (parent && parent.querySelector(".create-post-container"));
          if (fresh) mountComposer(fresh, opts);
        };
        window.addEventListener("cb-auth-ready", retry, { once: true });
        window.addEventListener("cb-auth-changed", retry, { once: true });
      } catch (e) {}
      return { updateButton: function () {}, signedOut: true };
    }
    var textarea = container.querySelector("#newPostText") || container.querySelector("textarea");
    var submitBtn = container.querySelector("#submitPost") || container.querySelector(".post-submit-btn");
    var boardInput = opts.boardInput || container.querySelector("#boardInput");
    var mediaPreview = container.querySelector("#mediaPreview") || container.querySelector(".media-preview");
    var mediaInput = container.querySelector("#mediaInput") || container.querySelector('input[type="file"]') || document.getElementById("mediaInput");
    var attachBtn = container.querySelector("#attachMedia") || container.querySelector(".post-tools .tool-btn-photo") || container.querySelector(".post-tools .tool-btn");
    var attachVideoBtn = container.querySelector("#attachMediaVideo") || container.querySelector(".post-tools .tool-btn-video");
    var pfp = container.querySelector("#currentUserPfp") || container.querySelector(".post-avatar img");
    if (pfp) pfp.src = getPfp(sessionUserId());

    var attachedMedia = null;
    var defaultBoard = opts.defaultBoard || "General";
    var needsBoard = mode !== "comment" && opts.requireBoard !== false && !!boardInput;

    function updateButton() {
      if (!submitBtn) return;
      var hasText = textarea && textarea.value.trim();
      var boardOk = !needsBoard || !!(boardInput && boardInput.value.trim());
      submitBtn.disabled = !(hasText || attachedMedia) || !boardOk;
    }

    function bindMediaPicker(btn, kind) {
      if (!btn || !mediaInput) return;
      btn.onclick = function () {
        if (kind === "video") mediaInput.setAttribute("accept", "video/*");
        else if (kind === "image") mediaInput.setAttribute("accept", "image/*");
        else mediaInput.setAttribute("accept", "image/*,video/*");
        mediaInput.click();
      };
    }
    bindMediaPicker(attachBtn, "image");
    bindMediaPicker(attachVideoBtn, "video");
    if (mediaInput) {
      mediaInput.onchange = function () {
        var file = mediaInput.files[0];
        if (!file) return;
        var captionGuess = (textarea && textarea.value) || "";
        function __cbAfterScan(scanResult) {
          if (scanResult && scanResult.blocked) {
            attachedMedia = null;
            if (mediaPreview) { mediaPreview.innerHTML = ""; mediaPreview.style.display = "none"; }
            mediaInput.value = "";
            updateButton();
            return;
          }
          var reader = new FileReader();
          reader.onload = function (e) {
            attachedMedia = {
              type: file.type.indexOf("video") === 0 ? "video" : "image",
              url: e.target.result,
              contentWarnings: (scanResult && scanResult.contentWarnings) || []
            };
            if (mediaPreview) {
              mediaPreview.innerHTML = "";
              var el = attachedMedia.type === "image"
                ? Object.assign(document.createElement("img"), { src: attachedMedia.url })
                : Object.assign(document.createElement("video"), { src: attachedMedia.url, controls: true, muted: true, loop: true });
              mediaPreview.appendChild(el);
              var removeBtn = Object.assign(document.createElement("button"), { textContent: "x", className: "remove-media", type: "button" });
              removeBtn.onclick = function () {
                attachedMedia = null;
                mediaPreview.style.display = "none";
                mediaInput.value = "";
                updateButton();
              };
              mediaPreview.appendChild(removeBtn);
              mediaPreview.style.display = "block";
            }
            updateButton();
          };
          reader.readAsDataURL(file);
        }
        if (window.CoolbradorMediaSafety && typeof window.CoolbradorMediaSafety.scan === "function") {
          window.CoolbradorMediaSafety.scan(file, captionGuess).then(__cbAfterScan).catch(function () { __cbAfterScan({ ok: true }); });
        } else {
          __cbAfterScan({ ok: true });
        }
      };
    }

    if (textarea) textarea.addEventListener("input", updateButton);
    if (boardInput) boardInput.addEventListener("input", updateButton);
    updateButton();

    if (submitBtn) {
      submitBtn.addEventListener("click", function () {
        var text = (textarea && textarea.value.trim()) || "";
        var media = attachedMedia ? { type: attachedMedia.type, url: attachedMedia.url, contentWarnings: attachedMedia.contentWarnings || [] } : null;
        if (!text && !media) return;
        try {
          if (window.CoolbradorMediaSafety && typeof window.CoolbradorMediaSafety.scanText === "function") {
            var __cbTx = window.CoolbradorMediaSafety.scanText(text);
            if (__cbTx && __cbTx.blocked) {
              window.CoolbradorMediaSafety.toast("This content isn't allowed.");
              return;
            }
          }
        } catch (__cbGate) {}

        if (mode === "comment" || typeof opts.onSubmit === "function") {
          if (!requireSignedIn(opts.signInVerb || "Reply")) return;
          function clearComposer() {
            if (textarea) textarea.value = "";
            attachedMedia = null;
            if (mediaInput) mediaInput.value = "";
            if (mediaPreview) mediaPreview.style.display = "none";
            updateButton();
          }
          if (typeof opts.onSubmit === "function") {
            opts.onSubmit({ text: text, media: media, clear: clearComposer, textarea: textarea });
            return;
          }
        }

        var boardName = typeof opts.getBoardName === "function"
          ? opts.getBoardName()
          : ((boardInput && boardInput.value.trim()) || defaultBoard);
        if (!boardName) return;
        if (!requireSignedIn("post")) return;
        var uid = sessionUserId();
        var userData = {};
        try { userData = JSON.parse(localStorage.getItem("user_" + uid) || "{}"); } catch (e) {}
        var post = {
          id: Date.now(),
          username: userData.username || userData.displayName || "User",
          userId: uid,
          text: text,
          media: media,
          contentWarnings: (media && media.contentWarnings) ? media.contentWarnings.slice() : [],
          timestamp: new Date().toISOString(),
          yeahs: [],
          replies: [],
          views: 0,
          inGame: false
        };
        try {
          if (window.CoolbradorSensitiveFilter && typeof window.CoolbradorSensitiveFilter.enrichPost === "function") {
            post = window.CoolbradorSensitiveFilter.enrichPost(post);
          }
        } catch (__cbEn) {}
        savePost(boardName, post);
        if (textarea) textarea.value = "";
        if (boardInput) boardInput.value = defaultBoard;
        attachedMedia = null;
        if (mediaInput) mediaInput.value = "";
        if (mediaPreview) mediaPreview.style.display = "none";
        updateButton();
        if (typeof opts.onPosted === "function") opts.onPosted(post, boardName);
      });
    }

    return { updateButton: updateButton };
  }

  function remountComposersFromCache() {
    if (!hasLocalSession() && !isSignedIn()) return;
    document.querySelectorAll(".cb-composer-signed-out, .create-post-container").forEach(function (el) {
      if (!el || el.dataset.cbComposerLocked === "1") return;
      if (el.classList.contains("cb-composer-signed-out") || el.querySelector(".cb-composer-gate")) {
        var keepId = el.id || "";
        var parent = el.parentNode;
        var html = composerHTML({
          mode: "post",
          showBoard: !!el.querySelector("#boardInput") || !!document.getElementById("boardInput"),
          containerId: keepId,
          defaultBoard: "General"
        });
        el.outerHTML = html;
        var fresh = keepId ? document.getElementById(keepId) : (parent && parent.querySelector(".create-post-container"));
        if (fresh) {
          mountComposer(fresh, {
            defaultBoard: "General",
            boardInput: document.getElementById("boardInput")
          });
        }
      } else {
        // Already signed-in markup: refresh pfp from cache
        var pfp = el.querySelector("#currentUserPfp") || el.querySelector(".post-avatar img");
        if (pfp) pfp.src = getPfp(sessionUserId());
      }
    });
  }

  function bootComposerAuthBridge() {
    if (document.documentElement.dataset.cbComposerAuthBoot === "1") return;
    document.documentElement.dataset.cbComposerAuthBoot = "1";
    var run = function () { try { remountComposersFromCache(); } catch (e) {} };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        // BEFORE firebase settle: trust localStorage
        run();
      });
    } else {
      run();
    }
    window.addEventListener("cb-auth-ready", run);
    window.addEventListener("cb-auth-changed", run);
  }
  bootComposerAuthBridge();


  function loadCommunityNotes() {
    try { return JSON.parse(localStorage.getItem("cb_community_notes_v1") || "[]"); } catch (e) { return []; }
  }
  function saveCommunityNotes(list) {
    try { localStorage.setItem("cb_community_notes_v1", JSON.stringify(list || [])); } catch (e) {}
  }
  function notesForPost(postId) {
    var id = String(postId || "");
    return loadCommunityNotes().filter(function (n) {
      return n && String(n.postId) === id && n.status !== "rejected";
    });
  }
  function renderCommunityNotesForPost(postEl) {
    if (!postEl) return;
    var id = postEl.getAttribute("data-id") || "";
    var notes = notesForPost(id);
    var host = postEl.querySelector(".cb-community-notes");
    if (!notes.length) { if (host) host.remove(); return; }
    if (!host) {
      host = document.createElement("div");
      host.className = "cb-community-notes";
      var anchor = postEl.querySelector(".yeah-section") || postEl.querySelector(".post-actions") || postEl.querySelector(".post-body");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor.nextSibling);
      else postEl.appendChild(host);
    }
    host.innerHTML = notes.map(function (n) {
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
    }).join("");
  }
  function openCommunityNoteModal(postEl) {
    if (!requireSignedIn("request a community note")) return;
    var existing = document.getElementById("cbCommunityNoteModal");
    if (existing) existing.remove();
    var postId = postEl ? (postEl.getAttribute("data-id") || "") : "";
    var board = postEl ? (postEl.getAttribute("data-board") || "") : "";
    var modal = document.createElement("div");
    modal.id = "cbCommunityNoteModal";
    modal.className = "cb-modal";
    modal.innerHTML =
      '<div class="cb-modal-card">' +
        "<h2>Request community note</h2>" +
        "<p class=\"cb-muted\">Add context for Labradors reading this post. Notes show under the post after you submit.</p>" +
        '<label>Note<textarea id="cbCommunityNoteText" rows="4" maxlength="500" placeholder="What should people know?"></textarea></label>' +
        '<div class="cb-modal-actions">' +
          '<button type="button" class="secondary" data-note-cancel>Cancel</button>' +
          '<button type="button" data-note-save>Submit note</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(modal);
    modal.querySelector("[data-note-cancel]").onclick = function () { modal.remove(); };
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.remove(); });
    modal.querySelector("[data-note-save]").onclick = function () {
      var text = (modal.querySelector("#cbCommunityNoteText").value || "").trim();
      if (!text) { showToast("Write a short note first"); return; }
      var uid = sessionUserId();
      var byName = "Lab";
      try {
        var u = JSON.parse(localStorage.getItem("user_" + uid) || "{}");
        byName = u.displayName || u.username || byName;
      } catch (e) {}
      var list = loadCommunityNotes();
      list.unshift({
        id: "cn-" + Date.now(),
        postId: postId,
        board: board,
        text: text,
        by: uid,
        byName: byName,
        ts: new Date().toISOString(),
        status: "pending"
      });
      saveCommunityNotes(list);
      modal.remove();
      showToast("Community note requested");
      renderCommunityNotesForPost(postEl);
    };
  }


  global.CoolbradorPosts = {
    escapeHtml: escapeHtml,
    timeAgo: timeAgo,
    getPfp: getPfp,
    profileUrl: profileUrl,
    isSignedIn: isSignedIn,
    hasLocalSession: hasLocalSession,
    sessionUserId: sessionUserId,
    requireSignedIn: requireSignedIn,
    showToast: showToast,
    copyText: copyText,
    cleanBoardName: cleanBoardName,
    mediaHTMLFor: mediaHTMLFor,
    postMenuHTML: postMenuHTML,
    postActionsHTML: postActionsHTML,
    renderPostCard: renderPostCard,
    mountFeed: mountFeed,
    composerHTML: composerHTML,
    signedOutComposerHTML: signedOutComposerHTML,
    mountComposer: mountComposer,
    remountComposersFromCache: remountComposersFromCache,
    loadPostsFromStorage: loadPostsFromStorage,
    loadFeedPosts: loadFeedPosts,
    findPostRecord: findPostRecord,
    loadBoardPostsChronological: loadBoardPostsChronological,
    openCommunityNoteModal: openCommunityNoteModal,
    renderCommunityNotesForPost: renderCommunityNotesForPost,
    savePost: savePost,
    toggleYeah: toggleYeah,
    bindFeedInteractions: bindFeedInteractions,
    postPermalink: postPermalink,
    postThreadUrl: postThreadUrl,
    getPostNumber: getPostNumber,
    DEMO_AVATARS: DEMO_AVATARS,
    getBlockedUsers: getBlockedUsers,
    isBlockedUser: isBlockedUser,
    setUserBlocked: setUserBlocked,
    filterBlockedPosts: filterBlockedPosts,
    getReposts: getReposts,
    createRepost: createRepost,
    loadUserSummary: loadUserSummary,
    loadBoardSummary: loadBoardSummary,
    openPostMedia: openPostMedia
  };
})(typeof window !== "undefined" ? window : this);
