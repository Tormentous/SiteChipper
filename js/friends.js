(function () {
  function escapeHtml(s) {
    if (window.CoolbradorPosts && window.CoolbradorPosts.escapeHtml) {
      return window.CoolbradorPosts.escapeHtml(s);
    }
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPfp(id) {
    if (window.CoolbradorPosts && window.CoolbradorPosts.getPfp) {
      return window.CoolbradorPosts.getPfp(id);
    }
    try {
      return localStorage.getItem("pfp_" + id) || "/users/default/pfp.jpg";
    } catch (_) {
      return "/users/default/pfp.jpg";
    }
  }

  function profileUrl(id) {
    if (window.CoolbradorPosts && window.CoolbradorPosts.profileUrl) {
      return window.CoolbradorPosts.profileUrl(id);
    }
    return "/users/" + encodeURIComponent(String(id));
  }

  function sessionUserId() {
    try {
      if (window.CoolbradorSession && window.CoolbradorSession.getSessionUserId) {
        return String(window.CoolbradorSession.getSessionUserId() || "");
      }
    } catch (_) {}
    try {
      return String(localStorage.getItem("currentUserId") || "");
    } catch (_) {
      return "";
    }
  }

  function isCardbrador(id, name, handle) {
    var n = String(name || "").toLowerCase();
    var h = String(handle || "").toLowerCase().replace(/^@/, "");
    var i = String(id || "");
    return n === "cardbrador" || h === "cardbrador" || i === "2" && n.indexOf("card") === 0;
  }

  function loadProfile(id) {
    try {
      var raw = localStorage.getItem("profile_" + id) || localStorage.getItem("user_" + id);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function presenceFor(id, profile) {
    // Demo presence: stable per id, not a live server.
    var n = Number(id);
    if (!isFinite(n)) n = String(id).length;
    var bucket = Math.abs(n) % 5;
    var bio = (profile && (profile.bio || profile.about)) || "";
    if (bucket === 0) {
      return { online: true, playingChipper: true, label: "Playing Chipper", cls: "is-chipper" };
    }
    if (bucket === 1 || bucket === 2) {
      return { online: true, playingChipper: false, label: "Online", cls: "is-online" };
    }
    var status = bio ? String(bio).trim() : "Offline";
    if (status.length > 72) status = status.slice(0, 69) + "…";
    return { online: false, playingChipper: false, label: status || "Offline", cls: "is-offline" };
  }

  function resolveFriend(fid) {
    var id = String(fid);
    if (window.CoolbradorLayout && typeof window.CoolbradorLayout.resolveFriendEntry === "function") {
      try {
        var ent = window.CoolbradorLayout.resolveFriendEntry(id);
        if (ent && ent.id) return ent;
      } catch (_) {}
    }
    var p = loadProfile(id) || {};
    var name = p.displayName || p.username || p.name || ("Labrador " + id);
    var handle = p.handle || p.username || ("user" + id);
    handle = String(handle).replace(/^@/, "");
    return {
      id: id,
      name: name,
      handle: handle,
      bio: p.bio || p.about || "",
      pfp: p.avatar || p.profilePicture || getPfp(id)
    };
  }

  function loadFriendIds() {
    var me = sessionUserId() || "0";
    var ids = [];
    try {
      var raw = JSON.parse(localStorage.getItem("friends_" + me) || "[]");
      if (Array.isArray(raw)) ids = raw.map(String);
    } catch (_) {}
    if (!ids.length && window.CoolbradorLayout && window.CoolbradorLayout.DEMO_SEED_NAMES) {
      ids = Object.keys(window.CoolbradorLayout.DEMO_SEED_NAMES);
    }
    if (!ids.length) {
      // Fallback demo pack (skip reserved 0/1 and Cardbrador id 2)
      for (var i = 3; i <= 12; i++) ids.push(String(i));
    }
    var seen = {};
    var out = [];
    ids.forEach(function (id) {
      id = String(id);
      if (!id || id === me || seen[id]) return;
      if (id === "2") return; // Cardbrador reserved for testing
      var ent = resolveFriend(id);
      if (ent && isCardbrador(ent.id, ent.name, ent.handle)) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function cardHtml(f) {
    if (isCardbrador(f.id, f.name, f.handle)) return "";
    var p = loadProfile(f.id) || {};
    var presence = presenceFor(f.id, p);
    var bioLine = presence.playingChipper
      ? '<i class="fa-solid fa-gamepad" aria-hidden="true"></i> Playing Chipper'
      : escapeHtml(presence.label);
    var href = profileUrl(f.id);
    return (
      '<a class="friends-card ' + presence.cls + '" href="' + href + '">' +
        '<div class="friends-card-avatar-wrap">' +
          '<img class="friends-card-avatar" src="' + escapeHtml(f.pfp || getPfp(f.id)) + '" alt="">' +
          '<span class="friends-card-dot" title="' + (presence.online ? "Online" : "Offline") + '"></span>' +
        "</div>" +
        '<div class="friends-card-meta">' +
          '<div class="friends-card-name">' + escapeHtml(f.name) + "</div>" +
          '<div class="friends-card-handle">@' + escapeHtml(f.handle) + "</div>" +
          '<div class="friends-card-status">' + bioLine + "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function paint(filter) {
    var grid = document.getElementById("friendsGrid");
    var countEl = document.getElementById("friendsCount");
    if (!grid) return;
    var q = String(filter || "").trim().toLowerCase();
    var friends = loadFriendIds()
      .map(resolveFriend)
      .filter(Boolean)
      .filter(function (f) {
        if (isCardbrador(f.id, f.name, f.handle)) return false;
        if (!q) return true;
        return (
          String(f.name).toLowerCase().indexOf(q) >= 0 ||
          String(f.handle).toLowerCase().indexOf(q) >= 0 ||
          String(f.bio || "").toLowerCase().indexOf(q) >= 0
        );
      });
    if (countEl) countEl.textContent = "Friends (" + friends.length + ")";
    if (!friends.length) {
      grid.innerHTML = '<p class="friends-empty">No friends match. Add Labradors from Community.</p>';
      return;
    }
    grid.innerHTML = friends.map(cardHtml).join("");
  }

  function boot() {
    paint("");
    var search = document.getElementById("friendsSearch");
    if (search) {
      search.addEventListener("input", function () {
        paint(search.value);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* batch2 friends auxclick */
  document.addEventListener("auxclick", function (e) {
    if (e.button !== 1) return;
    var card = e.target && e.target.closest && e.target.closest("a.friends-card");
    if (!card) return;
    // default middle-click already opens href on <a>; ensure not prevented
  }, true);

})();
