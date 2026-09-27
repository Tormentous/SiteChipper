# -*- coding: utf-8 -*-
from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
TS = datetime.now().strftime("%Y%m%d_%H%M%S")

def backup(p):
    bak = p.with_suffix(p.suffix + f".bak_{TS}")
    if not bak.exists():
        shutil.copy2(p, bak)

# ---- layout.js: no pfp in auth chrome cache ----
lay_path = ROOT / "js" / "layout.js"
lay = lay_path.read_text(encoding="utf-8")

old_key = 'var AUTH_CHROME_CACHE_KEY = "cb_auth_chrome_v1";'
new_key = 'var AUTH_CHROME_CACHE_KEY = "cb_auth_chrome_v2";'
if old_key not in lay and new_key not in lay:
    raise SystemExit("auth cache key missing")
lay = lay.replace(old_key, new_key, 1)

old_write = '''  function writeAuthChromeCache(snap) {
    try {
      sessionStorage.setItem(AUTH_CHROME_CACHE_KEY, JSON.stringify({
        userId: snap && snap.userId != null ? String(snap.userId) : "",
        username: snap && snap.username ? String(snap.username) : "",
        pfp: snap && snap.pfp ? String(snap.pfp) : "",
        signedIn: !!(snap && snap.signedIn)
      }));
    } catch (_) {}
  }'''
new_write = '''  function writeAuthChromeCache(snap) {
    try {
      // Fact-only cache: signed-in flag + id/username for chrome. Never store pfp/image blobs.
      sessionStorage.setItem(AUTH_CHROME_CACHE_KEY, JSON.stringify({
        userId: snap && snap.userId != null ? String(snap.userId) : "",
        username: snap && snap.username ? String(snap.username) : "",
        signedIn: !!(snap && snap.signedIn)
      }));
    } catch (_) {}
  }'''
if old_write not in lay:
    raise SystemExit("writeAuthChromeCache block not found")
lay = lay.replace(old_write, new_write, 1)

old_paint = '''  function paintAuthChromeFromCache() {
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
  }'''
new_paint = '''  function paintAuthChromeFromCache() {
    var c = readAuthChromeCache();
    if (!c) return false;
    if (c.signedIn && c.userId) {
      // Resolve avatar path live from localStorage keys (not from chrome cache)
      var livePfp = "/users/default/pfp.jpg";
      try {
        livePfp = localStorage.getItem("pfp_" + c.userId) || livePfp;
        var u = JSON.parse(localStorage.getItem("user_" + c.userId) || "{}");
        if (u && u.profilePicture) livePfp = u.profilePicture;
      } catch (_) {}
      renderSignedInChrome({
        id: c.userId,
        username: c.username || "Labrador",
        pfp: livePfp,
        profileUrl: "/users/" + encodeURIComponent(c.userId)
      }, true);
      return true;
    }
    if (c.signedIn === false) {
      renderLoginLinks(true);
      return true;
    }
    return false;
  }'''
if old_paint not in lay:
    raise SystemExit("paintAuthChromeFromCache block not found")
lay = lay.replace(old_paint, new_paint, 1)

lay = lay.replace(
    'writeAuthChromeCache({ userId: "", username: "", pfp: "", signedIn: false });',
    'writeAuthChromeCache({ userId: "", username: "", signedIn: false });',
    1,
)
lay = lay.replace(
    'writeAuthChromeCache({ userId: uid, username: name, pfp: pfp, signedIn: true });',
    'writeAuthChromeCache({ userId: uid, username: name, signedIn: true });',
    1,
)

backup(lay_path)
lay_path.write_text(lay, encoding="utf-8", newline="\n")
print("updated layout.js auth cache (no pfp)")

# ---- profile.js: only viewId / resolve path so empty id cannot blank layout ----
prof_path = ROOT / "js" / "profile.js"
prof = prof_path.read_text(encoding="utf-8")

old_boot = '''    var viewId = resolvePublicId(route.id || qs("id") || currentUserId || "");
    var sessionPublicId = resolvePublicId(currentUserId || "");
    var isOwn = loggedIn && currentUserId && String(viewId) === String(sessionPublicId);
    var profile = loadProfile(viewId);'''

new_boot = '''    // Prefer route id; fall back to session currentUserId so empty resolve never blanks the redesign layout
    var sessionPublicId = sessionNumericId();
    if (!sessionPublicId) sessionPublicId = resolvePublicId(currentUserId || "");
    if (!sessionPublicId && currentUserId && /^\\d+$/.test(String(currentUserId))) {
      sessionPublicId = String(currentUserId);
    }
    var routeRaw = route.id || qs("id") || "";
    var viewId = resolvePublicId(routeRaw || currentUserId || sessionPublicId || "");
    if (!viewId) viewId = sessionPublicId;
    if (!viewId && currentUserId) viewId = String(currentUserId);
    var isOwn = loggedIn && currentUserId && viewId && String(viewId) === String(sessionPublicId || currentUserId);
    var profile = viewId ? loadProfile(viewId) : {
      id: "",
      displayName: "Labrador",
      handle: "",
      bio: "",
      about: "",
      avatar: "/users/default/pfp.jpg",
      banner: DEFAULT_BANNER,
      layoutPreset: "profile",
      media: [],
      sections: [],
      socials: typeof defaultSocials === "function" ? defaultSocials() : {}
    };'''

if old_boot not in prof:
    raise SystemExit("profile viewId boot block not found - refusing broader rewrite")
backup(prof_path)
prof = prof.replace(old_boot, new_boot, 1)
prof_path.write_text(prof, encoding="utf-8", newline="\n")
print("updated profile.js viewId safety only")
print("OK")
