# -*- coding: utf-8 -*-
import os, re
ROOT = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"

def read(rel):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def write(rel, text):
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", rel)

# ========== posts.js ==========
ps = read("js/posts.js")
old = '''  function isSignedIn() {
    if (global.CoolbradorSession) return global.CoolbradorSession.isSignedIn();
    try { if (global.CoolbradorAuth && global.CoolbradorAuth.currentUser) return true; } catch (e) {}
    var id = localStorage.getItem("currentUserId") || "";
    return localStorage.getItem("loggedIn") === "true" && !!id;
  }

  function sessionUserId() {
    if (global.CoolbradorSession) return global.CoolbradorSession.getSessionUserId();
    return localStorage.getItem("currentUserId") || "";
  }

  function requireSignedIn(what) {
    if (global.CoolbradorSession) return global.CoolbradorSession.requireSignedIn(what);
    if (isSignedIn() && sessionUserId()) return true;
    alert("Log in to " + (what || "do that") + ".");
    return false;
  }'''

new = '''  function hasLocalSession() {
    if (global.CoolbradorSession && typeof global.CoolbradorSession.hasLocalSession === "function") {
      return global.CoolbradorSession.hasLocalSession();
    }
    try {
      var loggedIn = localStorage.getItem("loggedIn") === "true";
      var id = String(localStorage.getItem("currentUserId") || "").trim();
      return loggedIn && !!id;
    } catch (e) {
      return false;
    }
  }

  function isSignedIn() {
    if (hasLocalSession()) return true;
    if (global.CoolbradorSession) return global.CoolbradorSession.isSignedIn();
    try { if (global.CoolbradorAuth && global.CoolbradorAuth.currentUser) return true; } catch (e) {}
    var id = localStorage.getItem("currentUserId") || "";
    return localStorage.getItem("loggedIn") === "true" && !!id;
  }

  function sessionUserId() {
    if (global.CoolbradorSession) return global.CoolbradorSession.getSessionUserId();
    return localStorage.getItem("currentUserId") || "";
  }

  function requireSignedIn(what) {
    if (hasLocalSession()) return true;
    if (global.CoolbradorSession) return global.CoolbradorSession.requireSignedIn(what);
    if (isSignedIn() && sessionUserId()) return true;
    alert("Log in to " + (what || "do that") + ".");
    return false;
  }'''

if old not in ps:
    raise SystemExit("posts.js auth block not found")
ps = ps.replace(old, new, 1)

# mountComposer: also listen for auth ready to upgrade gate if local session appears
old_mount = '''  function mountComposer(container, opts) {
    opts = opts || {};
    if (!container) return null;
    var mode = opts.mode || "post";
    if (!isSignedIn() && opts.allowSignedOut !== true) {
      var gateVerb = opts.signInVerb || (mode === "comment" ? "reply" : "post");
      var keepId = container.id || opts.containerId || "";
      container.outerHTML = signedOutComposerHTML({
        verb: gateVerb,
        containerId: keepId,
        containerClass: opts.containerClass || ""
      });
      return { updateButton: function () {}, signedOut: true };
    }'''

new_mount = '''  function mountComposer(container, opts) {
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
          // Restore a basic composer shell then remount.
          el.className = "create-post-container" + (opts.containerClass ? (" " + opts.containerClass) : "");
          el.innerHTML = composerHTML({ mode: mode, boardInput: !!opts.boardInput || opts.requireBoard !== false });
          mountComposer(el, opts);
        };
        window.addEventListener("cb-auth-ready", retry, { once: true });
        window.addEventListener("cb-auth-changed", retry, { once: true });
      } catch (e) {}
      return { updateButton: function () {}, signedOut: true };
    }'''

if old_mount not in ps:
    raise SystemExit("posts.js mountComposer gate not found")
ps = ps.replace(old_mount, new_mount, 1)

# Export hasLocalSession if exports object exists
if "getBlockedUsers: getBlockedUsers," in ps and "hasLocalSession:" not in ps:
    ps = ps.replace(
        "isSignedIn: isSignedIn,",
        "isSignedIn: isSignedIn,\n    hasLocalSession: hasLocalSession,",
        1
    )

write("js/posts.js", ps)

# ========== header.html ==========
hdr = read("shared/header.html")
old_h = '<div class="cb-sidebar-user" id="cbSidebarUser" hidden></div>'
new_h = '<div class="cb-sidebar-user is-pending" id="cbSidebarUser" aria-live="polite"><span class="cb-sidebar-user-name"></span><span class="cb-sidebar-user-initials" aria-hidden="true"></span></div>'
if old_h not in hdr:
    raise SystemExit("header sidebar user not found")
hdr = hdr.replace(old_h, new_h, 1)
write("shared/header.html", hdr)

# ========== profile.js share + unblock ==========
pj = read("js/profile.js")

old_actions = '''      var actions = document.getElementById("profileActions");
      actions.innerHTML =
        (isOwn ? '<button type="button" class="primary" id="editToggle">Edit</button>' : "") +
        '<div class="cb-share-wrap" id="shareWrap">' +
          '<button type="button" class="cb-icon-btn ghost" id="shareToggle" title="Share" aria-label="Share"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
        "</div>";
      var shareMenuEl = document.getElementById("shareMenu");
      var shareWrapEl = document.getElementById("shareWrap");
      if (shareMenuEl && shareWrapEl && shareMenuEl.parentElement !== shareWrapEl) {
        shareWrapEl.appendChild(shareMenuEl);
      }'''

new_actions = '''      var actions = document.getElementById("profileActions");
      var blockedThem = false;
      try {
        if (!isOwn && window.CoolbradorPosts && typeof window.CoolbradorPosts.isBlockedUser === "function") {
          blockedThem = !!window.CoolbradorPosts.isBlockedUser(viewId);
        }
      } catch (e) {}
      var blockBtnHtml = "";
      if (!isOwn && viewId) {
        blockBtnHtml = blockedThem
          ? '<button type="button" class="ghost" id="profileUnblockBtn">Unblock</button>'
          : '<button type="button" class="ghost" id="profileBlockBtn">Block</button>';
      }
      // Build share menu inside wrap so re-renders never destroy a reparented orphan menu.
      actions.innerHTML =
        (isOwn ? '<button type="button" class="primary" id="editToggle">Edit</button>' : "") +
        blockBtnHtml +
        '<div class="cb-share-wrap" id="shareWrap">' +
          '<button type="button" class="cb-icon-btn ghost" id="shareToggle" title="Share" aria-label="Share" aria-haspopup="true" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
          '<div class="cb-share-menu" id="shareMenu" hidden role="menu">' +
            '<button type="button" data-share="profile">Share Profile <span class="cb-share-eg">/users/<span data-share-id>' + escapeHtml(String(viewId)) + '</span></span></button>' +
            '<button type="button" data-share="card">Share Card <span class="cb-share-eg">/users/<span data-share-id>' + escapeHtml(String(viewId)) + '</span>/card</span></button>' +
            '<button type="button" data-share="links">Share Links <span class="cb-share-eg">/users/<span data-share-id>' + escapeHtml(String(viewId)) + '</span>/links</span></button>' +
          "</div>" +
        "</div>";'''

if old_actions not in pj:
    raise SystemExit("profile.js actions block not found")
pj = pj.replace(old_actions, new_actions, 1)

old_share_wire = '''            var shareBtn = document.getElementById("shareToggle");
      var shareMenu = document.getElementById("shareMenu");
      var shareWrap = document.getElementById("shareWrap");
      if (shareMenu && shareWrap && shareMenu.parentElement !== shareWrap) {
        shareWrap.appendChild(shareMenu);
      }
      if (shareBtn && shareMenu) {
        shareMenu.querySelectorAll("[data-share-id]").forEach(function (el) { el.textContent = viewId; });
        shareMenu.style.top = "";
        shareMenu.style.left = "";
        shareBtn.onclick = function (e) {
          e.stopPropagation();
          shareMenu.hidden = !shareMenu.hidden;
        };
        shareMenu.onclick = function (e) { e.stopPropagation(); };
        shareMenu.querySelectorAll("[data-share]").forEach(function (btn) {
          btn.onclick = function () {
            var kind = btn.getAttribute("data-share");
            var path = "/users/" + encodeURIComponent(viewId) + (kind === "profile" ? "" : ("/" + kind));
            var url = location.origin + path;
            var done = function () {
              toast("Copied " + path);
              shareMenu.hidden = true;
            };
            if (window.CoolbradorPosts && typeof window.CoolbradorPosts.copyText === "function") {
              window.CoolbradorPosts.copyText(url, "Copied " + path);
              shareMenu.hidden = true;
              return;
            }
            copyText(url).then(done).catch(function () {
              try {
                var ta = document.createElement("textarea");
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
                done();
              } catch (err) {
                toast("Could not copy link");
              }
            });
          };
        });
        document.addEventListener("click", function () { shareMenu.hidden = true; });
      }

      if (!isOwn) return;'''

new_share_wire = '''      var shareBtn = document.getElementById("shareToggle");
      var shareMenu = document.getElementById("shareMenu");
      var shareWrap = document.getElementById("shareWrap");
      if (shareMenu && shareWrap && shareMenu.parentElement !== shareWrap) {
        shareWrap.appendChild(shareMenu);
      }
      if (shareBtn && shareMenu) {
        shareMenu.querySelectorAll("[data-share-id]").forEach(function (el) { el.textContent = viewId; });
        shareMenu.style.top = "";
        shareMenu.style.left = "";
        shareMenu.style.zIndex = "4000";
        shareBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          var open = shareMenu.hasAttribute("hidden") || shareMenu.hidden;
          if (open) {
            shareMenu.hidden = false;
            shareMenu.removeAttribute("hidden");
            shareBtn.setAttribute("aria-expanded", "true");
          } else {
            shareMenu.hidden = true;
            shareMenu.setAttribute("hidden", "");
            shareBtn.setAttribute("aria-expanded", "false");
          }
        };
        shareMenu.onclick = function (e) { e.stopPropagation(); };
        shareMenu.querySelectorAll("[data-share]").forEach(function (btn) {
          btn.onclick = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var kind = btn.getAttribute("data-share");
            var path = "/users/" + encodeURIComponent(viewId) + (kind === "profile" ? "" : ("/" + kind));
            var url = location.origin + path;
            var done = function () {
              toast("Copied " + path);
              shareMenu.hidden = true;
              shareMenu.setAttribute("hidden", "");
              shareBtn.setAttribute("aria-expanded", "false");
            };
            if (window.CoolbradorPosts && typeof window.CoolbradorPosts.copyText === "function") {
              window.CoolbradorPosts.copyText(url, "Copied " + path);
              shareMenu.hidden = true;
              shareMenu.setAttribute("hidden", "");
              shareBtn.setAttribute("aria-expanded", "false");
              toast("Copied " + path);
              return;
            }
            copyText(url).then(done).catch(function () {
              try {
                var ta = document.createElement("textarea");
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
                done();
              } catch (err) {
                toast("Could not copy link");
              }
            });
          };
        });
        if (!document.documentElement.dataset.cbShareMenuDoc) {
          document.documentElement.dataset.cbShareMenuDoc = "1";
          document.addEventListener("click", function () {
            var m = document.getElementById("shareMenu");
            var b = document.getElementById("shareToggle");
            if (m) { m.hidden = true; m.setAttribute("hidden", ""); }
            if (b) b.setAttribute("aria-expanded", "false");
          });
        }
      }

      var blockBtn = document.getElementById("profileBlockBtn");
      var unblockBtn = document.getElementById("profileUnblockBtn");
      function refreshBlockActions() {
        // Re-paint action row block/unblock label without full profile reload.
        try {
          if (typeof paint === "function") paint();
        } catch (e) {}
      }
      if (blockBtn && window.CoolbradorPosts && window.CoolbradorPosts.setUserBlocked) {
        blockBtn.onclick = function () {
          window.CoolbradorPosts.setUserBlocked(viewId, true);
          toast("Blocked");
          refreshBlockActions();
        };
      }
      if (unblockBtn && window.CoolbradorPosts && window.CoolbradorPosts.setUserBlocked) {
        unblockBtn.onclick = function () {
          window.CoolbradorPosts.setUserBlocked(viewId, false);
          toast("Unblocked");
          refreshBlockActions();
        };
      }

      if (!isOwn) return;'''

if old_share_wire not in pj:
    raise SystemExit("profile.js share wire not found")
pj = pj.replace(old_share_wire, new_share_wire, 1)
write("js/profile.js", pj)

print("part2 OK")
