# -*- coding: utf-8 -*-
"""Coolbrador patches: demo IDs off 0, auth chrome cache, labradorsim placeholder."""
from __future__ import annotations
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
TS = datetime.now().strftime("%Y%m%d_%H%M%S")
changed = []

def backup(p: Path) -> None:
    bak = p.with_suffix(p.suffix + f".bak_{TS}")
    if not bak.exists():
        shutil.copy2(p, bak)

def write(p: Path, text: str) -> None:
    backup(p)
    p.write_text(text, encoding="utf-8", newline="\n")
    changed.append(str(p))
    print("wrote", p)

# ---------- seed-demo.js ----------
seed_path = ROOT / "js" / "seed-demo.js"
seed = seed_path.read_text(encoding="utf-8")

# Bump version
seed = seed.replace('var SEED_VERSION = "13";', 'var SEED_VERSION = "14";', 1)

# Insert DEMO_ID_BASE after verKey lines
if "DEMO_ID_BASE" not in seed:
    seed = seed.replace(
        'var verKey = "cb_seed_demo_v";\n  var needReseed = localStorage.getItem(verKey) !== SEED_VERSION;',
        'var verKey = "cb_seed_demo_v";\n  var DEMO_ID_BASE = 9000;\n  var needReseed = localStorage.getItem(verKey) !== SEED_VERSION;',
        1,
    )

# Remap AVATARS keys "0".."21" -> "9000".."9021"
def remap_avatar_keys(m):
    body = m.group(1)
    def key_repl(km):
        n = int(km.group(1))
        return f'"{9000 + n}":'
    body2 = re.sub(r'"(\d+)":', key_repl, body)
    return "var AVATARS = {" + body2 + "};"

seed = re.sub(r"var AVATARS = \{([\s\S]*?)\};", remap_avatar_keys, seed, count=1)

# Remap demos id fields
def remap_demo_ids(m):
    body = m.group(1)
    body2 = re.sub(r'id:\s*"(\d+)"', lambda km: f'id: "{9000 + int(km.group(1))}"', body)
    return "var demos = [" + body2 + "];"

seed = re.sub(r"var demos = \[([\s\S]*?)\];", remap_demo_ids, seed, count=1)

# Remap literal userId: "N" for N in 0..21 in seed file (posts, yeahs stay as strings in arrays)
def remap_userid_literal(m):
    n = int(m.group(1))
    if 0 <= n <= 21:
        return f'userId: "{9000 + n}"'
    return m.group(0)

seed = re.sub(r'userId:\s*"(\d+)"', remap_userid_literal, seed)

# Remap String([0, 1, 2, ...]) arrays used for EXTRA_BOARDS
seed = seed.replace(
    "userId: String([0, 1, 2, 3, 12, 8][idx % 6]),",
    "userId: String([9000, 9001, 9002, 9003, 9012, 9008][idx % 6]),",
)
seed = seed.replace(
    "userId: String([4, 5, 13, 9, 7, 11][idx % 6]),",
    "userId: String([9004, 9005, 9013, 9009, 9007, 9011][idx % 6]),",
)
seed = seed.replace(
    'yeahs: ["0", "1"].slice(0, (idx % 2) + 1),',
    'yeahs: ["9000", "9001"].slice(0, (idx % 2) + 1),',
)

# Remap yeahs arrays with low ids - careful with patterns like ["0", "3"]
def remap_yeahs(m):
    inner = m.group(1)
    parts = re.findall(r'"(\d+)"', inner)
    mapped = []
    for p in parts:
        n = int(p)
        if 0 <= n <= 21:
            mapped.append(f'"{9000 + n}"')
        else:
            mapped.append(f'"{p}"')
    return "yeahs: [" + ", ".join(mapped) + "]"

seed = re.sub(r"yeahs:\s*\[([^\]]*)\]", remap_yeahs, seed)

# Remap authors array ids
seed = seed.replace('{ id: "14", name: "PantsWetterLabrador" }', '{ id: "9014", name: "PantsWetterLabrador" }')
seed = seed.replace('{ id: "1", name: "BeeSid" }', '{ id: "9001", name: "BeeSid" }')
seed = seed.replace('{ id: "12", name: "CoolDog" }', '{ id: "9012", name: "CoolDog" }')
seed = seed.replace('{ id: "3", name: "GyattToad" }', '{ id: "9003", name: "GyattToad" }')
seed = seed.replace('{ id: "16", name: "SnackBandit" }', '{ id: "9016", name: "SnackBandit" }')
seed = seed.replace('{ id: "17", name: "BarTabby" }', '{ id: "9017", name: "BarTabby" }')
seed = seed.replace('{ id: "0", name: "Cardbrador" }', '{ id: "9000", name: "Cardbrador" }')

# legacy map demo -> 9000 band
seed = seed.replace(
    'var map = { demo: "0", demo2: "1", demo3: "2", demo4: "3", demo5: "4" };',
    'var map = { demo: "9000", demo2: "9001", demo3: "9002", demo4: "9003", demo5: "9004" };',
)

# friend lists loop
seed = seed.replace(
    "for (var i = 0; i <= 21; i++) allIds.push(String(i));",
    "for (var i = 0; i <= 21; i++) allIds.push(String(DEMO_ID_BASE + i));",
)

# pants check references userId === "14"
seed = seed.replace(
    'return p && (p.id === pantsId || (p.userId === "14" && /check your pants/i.test(p.text || "")));',
    'return p && (p.id === pantsId || (p.userId === "9014" && /check your pants/i.test(p.text || "")));',
)

# When creating user records, add demo:true; also update kill list on reseed
# Replace demos.forEach user create block to include demo:true
old_user_set = '''localStorage.setItem("user_" + d.id, JSON.stringify({
        username: d.displayName,
        displayName: d.displayName,
        bio: d.bio,
        about: d.about,
        profilePicture: avatar,
        joined: Date.now() - 86400000 * 40
      }));'''
new_user_set = '''localStorage.setItem("user_" + d.id, JSON.stringify({
        username: d.displayName,
        displayName: d.displayName,
        bio: d.bio,
        about: d.about,
        profilePicture: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true
      }));'''
if old_user_set not in seed:
    raise SystemExit("user set block not found")
seed = seed.replace(old_user_set, new_user_set, 1)

old_profile_set = '''localStorage.setItem("profile_" + d.id, JSON.stringify({
        id: d.id,
        displayName: d.displayName,
        handle: d.handle,
        bio: d.bio,
        about: d.about,
        avatar: avatar,
        joined: Date.now() - 86400000 * 40,
        card: { width: 880, height: 520, background: "#0d001f" },
        sections: []
      }));'''
new_profile_set = '''localStorage.setItem("profile_" + d.id, JSON.stringify({
        id: d.id,
        displayName: d.displayName,
        handle: d.handle,
        bio: d.bio,
        about: d.about,
        avatar: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true,
        card: { width: 880, height: 520, background: "#0d001f" },
        sections: []
      }));'''
if old_profile_set not in seed:
    raise SystemExit("profile set block not found")
seed = seed.replace(old_profile_set, new_profile_set, 1)

# Expand reseed kill to also clear legacy 0-21 demo band (but protect signed-in session id)
old_kill = '''Object.keys(AVATARS).forEach(function (id) {
        localStorage.removeItem("user_" + id);
        localStorage.removeItem("profile_" + id);
        localStorage.removeItem("pfp_" + id);
        localStorage.removeItem("friends_" + id);
      });'''
new_kill = '''Object.keys(AVATARS).forEach(function (id) {
        localStorage.removeItem("user_" + id);
        localStorage.removeItem("profile_" + id);
        localStorage.removeItem("pfp_" + id);
        localStorage.removeItem("friends_" + id);
      });
      // Also clear legacy low-band demo IDs (0-21) unless the signed-in Labrador owns that id
      (function clearLegacyDemoBand() {
        var sid = "";
        try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        for (var li = 0; li <= 21; li++) {
          var lid = String(li);
          if (sid && sid === lid) continue;
          localStorage.removeItem("user_" + lid);
          localStorage.removeItem("profile_" + lid);
          localStorage.removeItem("pfp_" + lid);
          localStorage.removeItem("friends_" + lid);
        }
      })();'''
if old_kill not in seed:
    raise SystemExit("kill block not found")
seed = seed.replace(old_kill, new_kill, 1)

# Add always-on migration before demos.forEach to move leftover demo off 0-21
migration = '''
  // Migrate leftover low-band (0-21) demo NPCs to 9000+ so id 0 stays free for the first real Labrador.
  (function migrateDemoOffZero() {
    var sid = "";
    try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    var DEMO_NAMES = {
      Cardbrador: 1, BeeSid: 1, Miguel: 1, GyattToad: 1, AnthonySpade: 1, Barcat: 1,
      EvilRobot: 1, AbovegroundBro: 1, NerdDog: 1, OrangeTabby: 1, EvilKid23: 1, NoFilterBro: 1,
      CoolDog: 1, ANIMEGIRL: 1, PantsWetterLabrador: 1, RhombusRex: 1, SnackBandit: 1,
      BarTabby: 1, PuddlePirate: 1, TreatTaxer: 1, SofaThief: 1, BarkBroker: 1
    };
    function looksDemo(u) {
      if (!u || typeof u !== "object") return false;
      if (u.demo === true) return true;
      var name = u.username || u.displayName || "";
      if (DEMO_NAMES[name] && !u.uid && !u.firebaseUid) return true;
      return false;
    }
    function moveKey(prefix, oldId, newId) {
      var raw = localStorage.getItem(prefix + oldId);
      if (!raw) return;
      if (!localStorage.getItem(prefix + newId)) {
        try {
          if (prefix === "user_" || prefix === "profile_") {
            var o = JSON.parse(raw);
            o.demo = true;
            if (prefix === "profile_") o.id = newId;
            localStorage.setItem(prefix + newId, JSON.stringify(o));
          } else {
            localStorage.setItem(prefix + newId, raw);
          }
        } catch (e) {
          localStorage.setItem(prefix + newId, raw);
        }
      }
      localStorage.removeItem(prefix + oldId);
    }
    for (var i = 0; i <= 21; i++) {
      var oldId = String(i);
      var newId = String(DEMO_ID_BASE + i);
      if (sid && sid === oldId) continue;
      var rawU = localStorage.getItem("user_" + oldId);
      if (!rawU) {
        // still scrub orphan profile/pfp/friends for vacated demo slots
        var rawP = localStorage.getItem("profile_" + oldId);
        if (rawP) {
          try {
            var p = JSON.parse(rawP);
            if (p && (p.demo === true || DEMO_NAMES[p.displayName || ""])) {
              moveKey("profile_", oldId, newId);
              moveKey("pfp_", oldId, newId);
              moveKey("friends_", oldId, newId);
            }
          } catch (e) {}
        }
        continue;
      }
      var u = {};
      try { u = JSON.parse(rawU); } catch (e) { continue; }
      if (!looksDemo(u)) continue;
      moveKey("user_", oldId, newId);
      moveKey("profile_", oldId, newId);
      moveKey("pfp_", oldId, newId);
      moveKey("friends_", oldId, newId);
    }
    // Remap post authors that still point at vacated low-band demo ids (by username match)
    try {
      for (var pi = 0; pi < localStorage.length; pi++) {
        var pk = localStorage.key(pi);
        if (!pk || pk.indexOf("posts_") !== 0) continue;
        var list = JSON.parse(localStorage.getItem(pk) || "[]");
        if (!Array.isArray(list)) continue;
        var changed = false;
        list.forEach(function (post) {
          if (!post) return;
          var uid = String(post.userId || "");
          var n = parseInt(uid, 10);
          if (!(n >= 0 && n <= 21)) return;
          if (sid && sid === uid) return;
          var uname = post.username || "";
          if (DEMO_NAMES[uname] || true) {
            // Only remap if target demo slot exists or username is known demo
            if (DEMO_NAMES[uname]) {
              post.userId = String(DEMO_ID_BASE + n);
              changed = true;
            }
          }
          if (Array.isArray(post.yeahs)) {
            post.yeahs = post.yeahs.map(function (y) {
              var yn = parseInt(y, 10);
              if (yn >= 0 && yn <= 21 && !(sid && String(sid) === String(y))) {
                return String(DEMO_ID_BASE + yn);
              }
              return y;
            });
          }
          function walkReplies(arr) {
            (arr || []).forEach(function (r) {
              if (!r) return;
              var rid = String(r.userId || "");
              var rn = parseInt(rid, 10);
              if (rn >= 0 && rn <= 21 && !(sid && sid === rid) && DEMO_NAMES[r.username || ""]) {
                r.userId = String(DEMO_ID_BASE + rn);
                changed = true;
              }
              if (Array.isArray(r.replies)) walkReplies(r.replies);
            });
          }
          walkReplies(post.replies);
        });
        if (changed) localStorage.setItem(pk, JSON.stringify(list));
      }
    } catch (e) {}
  })();

'''

if "migrateDemoOffZero" not in seed:
    anchor = "  var demos = ["
    if anchor not in seed:
        raise SystemExit("demos anchor missing")
    seed = seed.replace(anchor, migration + anchor, 1)

# Expose demo base
if "window.CB_DEMO_ID_BASE" not in seed:
    seed = seed.replace(
        "window.CB_DEMO_AVATARS = AVATARS;",
        "window.CB_DEMO_AVATARS = AVATARS;\n  window.CB_DEMO_ID_BASE = DEMO_ID_BASE;",
        1,
    )

write(seed_path, seed)

# ---------- profile.js (resolvePublicId only + call sites) ----------
prof_path = ROOT / "js" / "profile.js"
prof = prof_path.read_text(encoding="utf-8")

old_resolve = '''  function resolvePublicId(raw) {
    var id = String(raw == null ? "" : raw).trim();
    if (!id || id === "me" || id === "guest" || id === "index.html" || id === "profile") {
      return "0";
    }
    if (/^\\d+$/.test(id)) return id;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("user_") !== 0) continue;
        var uidKey = key.slice(5);
        var u = {};
        try { u = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
        if (
          String(u.uid || "") === id ||
          String(u.firebaseUid || "") === id ||
          String(u.username || "").toLowerCase() === id.toLowerCase() ||
          String(u.displayName || "").toLowerCase() === id.toLowerCase()
        ) {
          if (/^\\d+$/.test(uidKey)) return uidKey;
        }
      }
    } catch (e) {}
    return "0";
  }'''

new_resolve = '''  function sessionNumericId() {
    var sid = "";
    try {
      if (window.CoolbradorSession && typeof window.CoolbradorSession.getSessionUserId === "function") {
        sid = String(window.CoolbradorSession.getSessionUserId() || "");
      }
    } catch (e) {}
    if (!sid) {
      try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e2) {}
    }
    if (sid && /^\\d+$/.test(sid)) return sid;
    return "";
  }

  function resolvePublicId(raw) {
    var id = String(raw == null ? "" : raw).trim();
    if (!id || id === "me" || id === "guest" || id === "index.html" || id === "profile") {
      // Prefer signed-in numeric id; never invent 0 for unknown/"me"
      return sessionNumericId();
    }
    if (/^\\d+$/.test(id)) return id;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("user_") !== 0) continue;
        var uidKey = key.slice(5);
        var u = {};
        try { u = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
        if (
          String(u.uid || "") === id ||
          String(u.firebaseUid || "") === id ||
          String(u.username || "").toLowerCase() === id.toLowerCase() ||
          String(u.displayName || "").toLowerCase() === id.toLowerCase()
        ) {
          if (/^\\d+$/.test(uidKey)) return uidKey;
        }
      }
    } catch (e) {}
    // Do not map unknown handles to 0 (that collided with demo Cardbrador / first real Labrador)
    return "";
  }'''

if old_resolve not in prof:
    raise SystemExit("resolvePublicId block not found exactly")
prof = prof.replace(old_resolve, new_resolve, 1)
prof = prof.replace(
    'var viewId = resolvePublicId(route.id || qs("id") || currentUserId || "0");\n    var sessionPublicId = resolvePublicId(currentUserId || "0");',
    'var viewId = resolvePublicId(route.id || qs("id") || currentUserId || "");\n    var sessionPublicId = resolvePublicId(currentUserId || "");',
    1,
)
write(prof_path, prof)

# ---------- layout.js auth chrome cache ----------
lay_path = ROOT / "js" / "layout.js"
lay = lay_path.read_text(encoding="utf-8")

if "cb_auth_chrome_v1" not in lay:
    insert_after = "  function clearLocalSession() {\n    try {\n      localStorage.removeItem(\"loggedIn\");\n      localStorage.removeItem(\"currentUserId\");\n      localStorage.removeItem(\"firebaseUid\");\n    } catch (_) {}\n  }\n"
    cache_fns = '''  function clearLocalSession() {
    try {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("firebaseUid");
    } catch (_) {}
  }

  var AUTH_CHROME_CACHE_KEY = "cb_auth_chrome_v1";

  function readAuthChromeCache() {
    try {
      var raw = sessionStorage.getItem(AUTH_CHROME_CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      return o;
    } catch (_) {
      return null;
    }
  }

  function writeAuthChromeCache(snap) {
    try {
      sessionStorage.setItem(AUTH_CHROME_CACHE_KEY, JSON.stringify({
        userId: snap && snap.userId != null ? String(snap.userId) : "",
        username: snap && snap.username ? String(snap.username) : "",
        pfp: snap && snap.pfp ? String(snap.pfp) : "",
        signedIn: !!(snap && snap.signedIn)
      }));
    } catch (_) {}
  }

  function clearAuthChromeCache() {
    try { sessionStorage.removeItem(AUTH_CHROME_CACHE_KEY); } catch (_) {}
  }

  function paintAuthChromeFromCache() {
    var c = readAuthChromeCache();
    if (!c) return false;
    if (c.signedIn && c.userId) {
      renderSignedInChrome({
        id: c.userId,
        username: c.username || "Labrador",
        pfp: c.pfp || "/users/default/pfp.jpg",
        profileUrl: "/users/" + encodeURIComponent(c.userId)
      }, true);
      return true;
    }
    if (c.signedIn === false) {
      renderLoginLinks(true);
      return true;
    }
    return false;
  }

'''
    if insert_after not in lay:
        raise SystemExit("clearLocalSession block not found for cache insert")
    lay = lay.replace(insert_after, cache_fns, 1)

# Update renderLoginLinks to accept skipCache and write cache
old_login = '''  function renderLoginLinks() {
    document.querySelectorAll("#userSection, #userSectionMobile").forEach((el) => {
      if (!el) return;
      el.innerHTML = '<a href="/login.html" class="cb-login-link" style="color:var(--cb-accent);font-weight:bold;text-decoration:none;">Login</a>';
    });
    updateSidebarProfile(null);
  }'''
new_login = '''  function renderLoginLinks(fromCache) {
    document.querySelectorAll("#userSection, #userSectionMobile").forEach((el) => {
      if (!el) return;
      el.innerHTML = '<a href="/login.html" class="cb-login-link" style="color:var(--cb-accent);font-weight:bold;text-decoration:none;">Login</a>';
    });
    updateSidebarProfile(null);
    if (!fromCache) {
      writeAuthChromeCache({ userId: "", username: "", pfp: "", signedIn: false });
    }
  }'''
if old_login not in lay:
    raise SystemExit("renderLoginLinks not found")
lay = lay.replace(old_login, new_login, 1)

# Update renderSignedInChrome
old_sic = '''  function renderSignedInChrome(user) {
    var profileUrl = user.profileUrl;
    var name = user.username || "Labrador";
    var pfp = user.pfp || "/users/default/pfp.jpg";
    var desk = document.getElementById("userSection");
    if (desk) {
      desk.innerHTML =
        '<div class="cb-user-menu">' +
        '<button type="button" class="cb-user-menu-btn" data-cb-user-menu aria-haspopup="true" aria-expanded="false" title="' + escapeHtml(name) + '">' +
        '<span class="cb-user-menu-name">' + escapeHtml(name) + "</span>" +
        '<img src="' + pfp + '" alt="" class="cb-user-menu-pfp">' +
        "</button>" +
        '<div class="cb-user-menu-panel" hidden role="menu">' +
        '<a role="menuitem" href="' + profileUrl + '">Profile</a>' +
        '<a role="menuitem" href="/settings">Settings</a>' +
        '<button type="button" role="menuitem" data-cb-signout>Sign out</button>' +
        "</div></div>";
      wireUserMenu(desk);
    }
    var mob = document.getElementById("userSectionMobile");
    if (mob) {
      mob.innerHTML =
        '<div class="cb-user-menu cb-user-menu-mobile">' +
        '<button type="button" class="cb-user-menu-btn" data-cb-user-menu aria-haspopup="true" aria-expanded="false">' +
        '<img src="' + pfp + '" alt="' + escapeHtml(name) + '" class="cb-user-menu-pfp">' +
        "</button>" +
        '<div class="cb-user-menu-panel" hidden role="menu">' +
        '<a role="menuitem" href="' + profileUrl + '">Profile</a>' +
        '<a role="menuitem" href="/settings">Settings</a>' +
        '<button type="button" role="menuitem" data-cb-signout>Sign out</button>' +
        "</div></div>";
      wireUserMenu(mob);
    }
    updateSidebarProfile(profileUrl, name);
  }'''

new_sic = '''  function renderSignedInChrome(user, fromCache) {
    var profileUrl = user.profileUrl;
    var name = user.username || "Labrador";
    var pfp = user.pfp || "/users/default/pfp.jpg";
    var uid = user.id != null ? String(user.id) : "";
    var desk = document.getElementById("userSection");
    if (desk) {
      desk.innerHTML =
        '<div class="cb-user-menu">' +
        '<button type="button" class="cb-user-menu-btn" data-cb-user-menu aria-haspopup="true" aria-expanded="false" title="' + escapeHtml(name) + '">' +
        '<span class="cb-user-menu-name">' + escapeHtml(name) + "</span>" +
        '<img src="' + pfp + '" alt="" class="cb-user-menu-pfp">' +
        "</button>" +
        '<div class="cb-user-menu-panel" hidden role="menu">' +
        '<a role="menuitem" href="' + profileUrl + '">Profile</a>' +
        '<a role="menuitem" href="/settings">Settings</a>' +
        '<button type="button" role="menuitem" data-cb-signout>Sign out</button>' +
        "</div></div>";
      wireUserMenu(desk);
    }
    var mob = document.getElementById("userSectionMobile");
    if (mob) {
      mob.innerHTML =
        '<div class="cb-user-menu cb-user-menu-mobile">' +
        '<button type="button" class="cb-user-menu-btn" data-cb-user-menu aria-haspopup="true" aria-expanded="false">' +
        '<img src="' + pfp + '" alt="' + escapeHtml(name) + '" class="cb-user-menu-pfp">' +
        "</button>" +
        '<div class="cb-user-menu-panel" hidden role="menu">' +
        '<a role="menuitem" href="' + profileUrl + '">Profile</a>' +
        '<a role="menuitem" href="/settings">Settings</a>' +
        '<button type="button" role="menuitem" data-cb-signout>Sign out</button>' +
        "</div></div>";
      wireUserMenu(mob);
    }
    updateSidebarProfile(profileUrl, name);
    if (!fromCache) {
      writeAuthChromeCache({ userId: uid, username: name, pfp: pfp, signedIn: true });
    }
  }'''

if old_sic not in lay:
    raise SystemExit("renderSignedInChrome not found")
lay = lay.replace(old_sic, new_sic, 1)

# signOut should clear cache then write signed-out
lay = lay.replace(
    '''    clearLocalSession();
    authReady = true;
    authLoading = false;
    renderLoginLinks();''',
    '''    clearLocalSession();
    clearAuthChromeCache();
    authReady = true;
    authLoading = false;
    renderLoginLinks();''',
    1,
)

# updateUserProfile: don't wipe to skeleton if cache/local exists
old_uup = '''  async function updateUserProfile() {
    renderAuthSkeleton();
    authLoading = true;
    authReady = false;'''
new_uup = '''  async function updateUserProfile() {
    // Roblox-style: keep last-known chrome visible; skeleton only when nothing cached
    if (!paintAuthChromeFromCache()) {
      var localEarly = getLocalUser();
      if (localEarly) renderLocalProfile(localEarly);
      else renderAuthSkeleton();
    }
    authLoading = true;
    authReady = false;'''
if old_uup not in lay:
    raise SystemExit("updateUserProfile start not found")
lay = lay.replace(old_uup, new_uup, 1)

# loadLayout: paint cache before skeleton
old_ll = '''    await Promise.all(jobs);
    applySiteTheme();
    renderAuthSkeleton();
    wireSidebar();'''
new_ll = '''    await Promise.all(jobs);
    applySiteTheme();
    if (!paintAuthChromeFromCache()) {
      var localBoot = getLocalUser();
      if (localBoot) renderLocalProfile(localBoot);
      else renderAuthSkeleton();
    }
    wireSidebar();'''
if old_ll not in lay:
    raise SystemExit("loadLayout auth boot not found")
lay = lay.replace(old_ll, new_ll, 1)

write(lay_path, lay)

# ---------- styles.css: reserve auth slot width ----------
css_path = ROOT / "styles.css"
css = css_path.read_text(encoding="utf-8")
marker = "/* === CB auth header chrome === */"
extra = '''/* === CB auth header chrome === */
#userSection {
  min-width: 148px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}
#userSectionMobile {
  min-width: 48px;
}
'''
if "#userSection {\n  min-width: 148px;" not in css:
    if marker not in css:
        raise SystemExit("auth chrome CSS marker missing")
    css = css.replace(marker, extra, 1)
    write(css_path, css)
else:
    print("styles already has #userSection min-width")

# ---------- labradorsim placeholder ----------
ls_path = ROOT / "simulations" / "labradorsim" / "index.html"
ls_html = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/img/favicon3.ico" type="image/x-icon">
  <title>LabradorSim - Coolbrador</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    body.labradorsim-placeholder .ls-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 18px 72px;
    }
    body.labradorsim-placeholder .ls-eyebrow {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--cb-accent);
    }
    body.labradorsim-placeholder h1 {
      margin: 8px 0 12px;
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      color: var(--cb-text, #fff);
    }
    body.labradorsim-placeholder p {
      margin: 0 0 12px;
      line-height: 1.55;
      color: var(--cb-muted);
    }
    body.labradorsim-placeholder .ls-card {
      margin-top: 22px;
      padding: 18px 20px;
      border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
      background: rgba(var(--cb-accent-rgb), 0.08);
      border-radius: 0;
    }
    body.labradorsim-placeholder .ls-card strong {
      color: var(--cb-text, #fff);
    }
    body.labradorsim-placeholder a.ls-back {
      color: var(--cb-accent);
      font-weight: 700;
      text-decoration: none;
    }
    body.labradorsim-placeholder a.ls-back:hover { text-decoration: underline; }
  </style>
</head>
<body class="labradorsim-placeholder simulations-page" data-page="labradorsim">
  <div id="shared-header"></div>
  <main class="ls-wrap">
    <p class="ls-eyebrow">Democracy 2.0 / Civic lab</p>
    <h1>LabradorSim coming soon</h1>
    <p>
      This is the Coolbrador civic lab sector. LabradorSim will let the kennel rehearse proposals,
      polls, and pack scenarios before they hit the live site.
    </p>
    <div class="ls-card">
      <p><strong>Status:</strong> placeholder only. The full Brador / LabradorSim app is not live here yet.</p>
      <p>Hang tight while the lab gets wired. Chipper can wait in the yard.</p>
    </div>
    <p style="margin-top:20px">
      <a class="ls-back" href="/simulations.html">Back to Simulations</a>
      &nbsp;·&nbsp;
      <a class="ls-back" href="/polls.html">Open Polls</a>
    </p>
  </main>
  <div id="shared-footer"></div>
  <script src="/js/layout.js"></script>
</body>
</html>
'''
write(ls_path, ls_html)

# ---------- serve.json rewrites ----------
serve_path = ROOT / "serve.json"
serve = json.loads(serve_path.read_text(encoding="utf-8"))
sources = {r.get("source") for r in serve.get("rewrites", [])}
needed = [
    {"source": "/simulations/labradorsim", "destination": "/simulations/labradorsim/index.html"},
    {"source": "/simulations/labradorsim/", "destination": "/simulations/labradorsim/index.html"},
    {"source": "/simulations/labradorsim/**", "destination": "/simulations/labradorsim/index.html"},
]
added = False
for r in needed:
    if r["source"] not in sources:
        serve.setdefault("rewrites", []).insert(0, r)
        added = True
if added:
    write(serve_path, json.dumps(serve, indent=2) + "\n")
else:
    print("serve.json already has labradorsim rewrites")

# firebase already has labradorsim - verify only
fb = json.loads((ROOT / "firebase.json").read_text(encoding="utf-8"))
fb_sources = [r.get("source") for r in fb.get("hosting", {}).get("rewrites", [])]
print("firebase labradorsim sources:", [s for s in fb_sources if s and "labradorsim" in s])

print("CHANGED:")
for c in changed:
    print(" -", c)
print("OK")
