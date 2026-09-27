# -*- coding: utf-8 -*-
"""Coolbrador batch patch: auth gate, sidebar, share, card, unblock, support, gift."""
import os, re

ROOT = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"

def read(rel):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def write(rel, text):
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", rel, "bytes", len(text))

# ========== 1) layout.js ==========
js = read("js/layout.js")

# Insert hasLocalSession before isSignedIn
old_is = '''  function isSignedIn() {
    try {
      if (window.CoolbradorAuth && window.CoolbradorAuth.currentUser) return true;
    } catch (_) {}
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    if (id && uid && id !== uid) return localStorage.getItem("loggedIn") === "true";
    return localStorage.getItem("loggedIn") === "true" && !!id;
  }

  function getSessionUserId() {
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    if (id && id !== uid) return String(id);
    if (id && /^\\d+$/.test(String(id))) return String(id);
    if (id) return String(id);
    return "";
  }

  function requireSignedIn(what) {
    if (authLoading && !authReady) {
      alert("Hang on, finishing sign-in.");
      return false;
    }
    if (isSignedIn()) {
      if (getSessionUserId()) return true;
      alert("Hang on, finishing sign-in.");
      return false;
    }
    alert("Log in to " + (what || "do that") + ".");
    return false;
  }'''

new_is = '''  function hasLocalSession() {
    try {
      var loggedIn = localStorage.getItem("loggedIn") === "true";
      var id = String(localStorage.getItem("currentUserId") || "").trim();
      return loggedIn && !!id;
    } catch (_) {
      return false;
    }
  }

  function isSignedIn() {
    if (hasLocalSession()) return true;
    try {
      if (window.CoolbradorAuth && window.CoolbradorAuth.currentUser) return true;
    } catch (_) {}
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    if (id && uid && id !== uid) return localStorage.getItem("loggedIn") === "true";
    return localStorage.getItem("loggedIn") === "true" && !!id;
  }

  function getSessionUserId() {
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    if (id && id !== uid) return String(id);
    if (id && /^\\d+$/.test(String(id))) return String(id);
    if (id) return String(id);
    return "";
  }

  function requireSignedIn(what) {
    // Local session first: never block repost/discuss/compose when browser already knows the Labrador.
    if (hasLocalSession()) return true;
    if (isSignedIn() && getSessionUserId()) return true;
    if (authLoading && !authReady) {
      alert("Hang on, finishing sign-in.");
      return false;
    }
    alert("Log in to " + (what || "do that") + ".");
    return false;
  }'''

if old_is not in js:
    raise SystemExit("layout.js: isSignedIn/requireSignedIn block not found")
js = js.replace(old_is, new_is, 1)

# signOutFully: redirect to login
old_so = '''  async function signOutFully() {
    try {
      const mod = await import("/js/firebase.js");
      const auth = mod.auth;
      if (auth) {
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
        await signOut(auth);
      }
    } catch (_) {}
    clearLocalSession();
    clearAuthChromeCache();
    authReady = true;
    authLoading = false;
    renderLoginLinks();
    try {
      window.dispatchEvent(new CustomEvent("cb-auth-changed", { detail: { signedIn: false } }));
    } catch (_) {}
  }'''

new_so = '''  async function signOutFully() {
    try {
      const mod = await import("/js/firebase.js");
      const auth = mod.auth;
      if (auth) {
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
        await signOut(auth);
      }
    } catch (_) {}
    clearLocalSession();
    clearAuthChromeCache();
    authReady = true;
    authLoading = false;
    renderLoginLinks();
    try {
      window.dispatchEvent(new CustomEvent("cb-auth-changed", { detail: { signedIn: false } }));
    } catch (_) {}
    try { location.href = "/login.html"; } catch (_) {}
  }'''

if old_so not in js:
    raise SystemExit("layout.js: signOutFully not found")
js = js.replace(old_so, new_so, 1)

# Replace updateSidebarProfile with reserved slot + Settings/Log out menu
old_usp = '''  function updateSidebarProfile(profileUrl, username) {
    const link = document.getElementById("cbSideProfile");
    const userEl = document.getElementById("cbSidebarUser");
    let name = username;
    if (!name) {
      const local = getLocalUser();
      if (local) name = local.username;
    }
    if (userEl) {
      userEl.classList.remove("cb-sidebar-user-skel");
      userEl.removeAttribute("aria-busy");
      if (name && (profileUrl || isSignedIn())) {
        userEl.hidden = false;
        userEl.textContent = name;
        if (profileUrl) {
          userEl.onclick = function () { location.href = profileUrl; };
          userEl.style.cursor = "pointer";
          userEl.title = "Your profile";
        }
      } else {
        userEl.hidden = true;
        userEl.textContent = "";
        userEl.onclick = null;
        userEl.style.cursor = "";
        userEl.title = "";
      }
    }
    if (!link) return;
    if (profileUrl) {
      link.href = profileUrl;
      link.setAttribute("data-signed-in", "1");
    } else {
      const sid = getSessionUserId();
      if (isSignedIn() && sid) {
        link.href = "/users/" + encodeURIComponent(sid);
        link.setAttribute("data-signed-in", "1");
      } else {
        link.href = "/login.html";
        link.removeAttribute("data-signed-in");'''

# Find the rest of the function end
m = re.search(r"  function updateSidebarProfile\(profileUrl, username\) \{.*?\n  \}\n\n  function pathMatches", js, re.S)
if not m:
    raise SystemExit("layout.js: updateSidebarProfile full block not found")

new_usp = r'''  function initialsFromName(name) {
    var s = String(name || "L").trim();
    if (!s) return "L";
    var parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    return s.slice(0, 2).toUpperCase();
  }

  function closeSidebarUserMenu() {
    document.querySelectorAll(".cb-side-user-menu").forEach(function (p) { p.hidden = true; });
    document.querySelectorAll("#cbSidebarUser, .cb-sidebar-user-collapsed").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
    });
  }

  function ensureSidebarUserMenuDoc() {
    if (document.documentElement.dataset.cbSideUserMenuDoc) return;
    document.documentElement.dataset.cbSideUserMenuDoc = "1";
    document.addEventListener("click", function () { closeSidebarUserMenu(); });
  }

  function wireSidebarUserMenu(userEl, profileUrl, name) {
    if (!userEl) return;
    ensureSidebarUserMenuDoc();
    var menu = userEl.querySelector(".cb-side-user-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "cb-side-user-menu";
      menu.hidden = true;
      menu.setAttribute("role", "menu");
      userEl.appendChild(menu);
    }
    menu.innerHTML =
      '<a role="menuitem" href="/settings.html">Settings</a>' +
      '<button type="button" role="menuitem" data-cb-side-signout>Log out</button>';
    menu.onclick = function (e) { e.stopPropagation(); };
    var out = menu.querySelector("[data-cb-side-signout]");
    if (out) {
      out.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeSidebarUserMenu();
        signOutFully();
      };
    }
    userEl.setAttribute("aria-haspopup", "true");
    userEl.setAttribute("aria-expanded", "false");
    userEl.style.cursor = "pointer";
    userEl.title = "Account menu";
    userEl.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = menu.hidden;
      closeSidebarUserMenu();
      menu.hidden = !open;
      userEl.setAttribute("aria-expanded", open ? "true" : "false");
    };
  }

  function updateSidebarProfile(profileUrl, username) {
    const link = document.getElementById("cbSideProfile");
    const userEl = document.getElementById("cbSidebarUser");
    let name = username;
    let url = profileUrl || "";
    const local = getLocalUser();
    const cache = readAuthChromeCache();
    if (!name) {
      if (local) name = local.username;
      else if (cache && cache.username) name = cache.username;
    }
    if (!url) {
      if (local && local.profileUrl) url = local.profileUrl;
      else {
        const sid = getSessionUserId() || (cache && cache.userId) || "";
        if (sid) url = "/users/" + encodeURIComponent(sid);
      }
    }
    const signedHint = !!(hasLocalSession() || isSignedIn() || (cache && cache.signedIn && cache.userId) || (name && url));
    if (userEl) {
      userEl.classList.remove("cb-sidebar-user-skel");
      userEl.removeAttribute("aria-busy");
      // Keep slot in document flow so Home/Profile never jump (never use hidden while signed-in/loading).
      userEl.removeAttribute("hidden");
      if (signedHint && name) {
        userEl.classList.add("is-signed-in");
        userEl.classList.remove("is-signed-out");
        userEl.innerHTML =
          '<span class="cb-sidebar-user-name">' + escapeHtml(name) + "</span>" +
          '<span class="cb-sidebar-user-initials" aria-hidden="true">' + escapeHtml(initialsFromName(name)) + "</span>";
        wireSidebarUserMenu(userEl, url, name);
      } else if (signedHint) {
        // Known signed-in but name still resolving: reserve slot, optional shimmer over text area.
        userEl.classList.add("is-signed-in", "cb-sidebar-user-skel");
        userEl.classList.remove("is-signed-out");
        userEl.setAttribute("aria-busy", "true");
        userEl.innerHTML = '<span class="cb-skel-line cb-skel-line-side"></span><span class="cb-sidebar-user-initials" aria-hidden="true">L</span>';
        userEl.onclick = null;
        userEl.style.cursor = "default";
        userEl.title = "";
      } else {
        userEl.classList.remove("is-signed-in");
        userEl.classList.add("is-signed-out");
        userEl.innerHTML = "";
        userEl.onclick = null;
        userEl.style.cursor = "";
        userEl.title = "";
      }
    }
    if (!link) return;
    if (url && signedHint) {
      link.href = url;
      link.setAttribute("data-signed-in", "1");
    } else {
      const sid = getSessionUserId();
      if ((hasLocalSession() || isSignedIn()) && sid) {
        link.href = "/users/" + encodeURIComponent(sid);
        link.setAttribute("data-signed-in", "1");
      } else {
        link.href = "/login.html";
        link.removeAttribute("data-signed-in");
'''

# Keep the rest of the original function's else branch ending
# Actually replace entire matched block
rest_end = '''      }
    }
  }

  function pathMatches'''

# Reconstruct: my new_usp already has the profile link logic partially - need to close properly
new_full = new_usp + '''      }
    }
  }

  function pathMatches'''

js = js[:m.start()] + new_full + js[m.end():]

# Fix renderAuthSkeleton: do not clear known name; reserve slot
old_skel_side = '''    // Same shimmer on left sidebar name while auth settles
    var sideUser = document.getElementById("cbSidebarUser");
    if (sideUser) {
      sideUser.hidden = false;
      sideUser.classList.add("cb-sidebar-user-skel");
      sideUser.setAttribute("aria-busy", "true");
      sideUser.innerHTML = '<span class="cb-skel-line cb-skel-line-side"></span>';
      sideUser.onclick = null;
      sideUser.style.cursor = "default";
      sideUser.title = "";
    }
  }'''

new_skel_side = '''    // Keep sidebar name slot stable; shimmer only if we have no cached name.
    var sideUser = document.getElementById("cbSidebarUser");
    if (sideUser) {
      sideUser.removeAttribute("hidden");
      var cacheName = "";
      try {
        var c = readAuthChromeCache();
        if (c && c.username) cacheName = c.username;
      } catch (_) {}
      if (!cacheName) {
        try {
          var loc = getLocalUser();
          if (loc && loc.username) cacheName = loc.username;
        } catch (_) {}
      }
      if (cacheName) {
        sideUser.classList.remove("cb-sidebar-user-skel");
        sideUser.removeAttribute("aria-busy");
        sideUser.classList.add("is-signed-in");
        sideUser.innerHTML =
          '<span class="cb-sidebar-user-name">' + escapeHtml(cacheName) + "</span>" +
          '<span class="cb-sidebar-user-initials" aria-hidden="true">' + escapeHtml(initialsFromName(cacheName)) + "</span>";
      } else {
        sideUser.classList.add("cb-sidebar-user-skel", "is-signed-in");
        sideUser.setAttribute("aria-busy", "true");
        sideUser.innerHTML = '<span class="cb-skel-line cb-skel-line-side"></span><span class="cb-sidebar-user-initials" aria-hidden="true">L</span>';
        sideUser.onclick = null;
        sideUser.style.cursor = "default";
        sideUser.title = "";
      }
    }
  }'''

if old_skel_side not in js:
    raise SystemExit("layout.js: skel side block not found")
js = js.replace(old_skel_side, new_skel_side, 1)

# Expose hasLocalSession on CoolbradorSession
old_exp = "window.CoolbradorSession = { isSignedIn, getSessionUserId, requireSignedIn, signOut: signOutFully, whenAuthReady, get authReady() { return authReady; }, get authLoading() { return authLoading; } };"
new_exp = "window.CoolbradorSession = { isSignedIn, hasLocalSession, getSessionUserId, requireSignedIn, signOut: signOutFully, whenAuthReady, get authReady() { return authReady; }, get authLoading() { return authLoading; } };"
if old_exp not in js:
    raise SystemExit("layout.js: CoolbradorSession export not found")
js = js.replace(old_exp, new_exp, 1)

# Early paint: after header inject, paint sidebar name from cache synchronously in loadLayout - already does paintAuthChromeFromCache. Also update wireSidebar to not clobber with null when signed out cache.
# Change wireSidebar's updateSidebarProfile(null) to prefer cache paint
js = js.replace(
    "    updateSidebarProfile(null);\n    markActiveSidebar();",
    "    // Prefer cache/local so Profile href and name never wait on Firebase.\n    var bootLocal = getLocalUser();\n    if (bootLocal) updateSidebarProfile(bootLocal.profileUrl, bootLocal.username);\n    else updateSidebarProfile(null);\n    markActiveSidebar();",
    1
)

write("js/layout.js", js)
print("layout.js OK")
