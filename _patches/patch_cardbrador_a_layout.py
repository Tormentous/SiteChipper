# -*- coding: utf-8 -*-
"""Coolbrador session/demo hijack + UI fixes (Python patches, no git)."""
from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
bak = ROOT / "_patches" / f"bak_cardbrador_{stamp}"
bak.mkdir(parents=True, exist_ok=True)

FILES = [
    "js/layout.js",
    "js/seed-demo.js",
    "js/posts.js",
    "js/messages.js",
    "styles-profile.css",
    "styles.css",
    "js/gift.js",
]

def backup(rel):
    src = ROOT / rel
    dst = bak / rel.replace("/", "_")
    shutil.copy2(src, dst)
    return src

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]\n---\n{old[:200]}\n---")
    return text.replace(old, new, 1)

def must_replace_all(text, old, new, label, min_count=1):
    c = text.count(old)
    if c < min_count:
        raise SystemExit(f"MISSING [{label}] count={c} need>={min_count}")
    return text.replace(old, new)

# ---------- layout.js ----------
layout_path = backup("js/layout.js")
layout = layout_path.read_text(encoding="utf-8")

old_alloc = '''  function allocatePublicUserId() {
    var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
    var used = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("user_") !== 0) continue;
        var id = key.slice(5);
        if (!/^\\d+$/.test(id)) continue;
        var n = parseInt(id, 10);
        if (n >= 0 && n < demoBase) used[n] = true;
      }
    } catch (_) {}
    for (var slot = 0; slot < demoBase; slot++) {
      if (!used[slot]) return String(slot);
    }
    // All reserved real slots taken; do not allocate into demo band 2+.
    return "0";
  }'''

new_alloc = '''  function accountLooksDemo(rec) {
    if (!rec || typeof rec !== "object") return false;
    if (rec.demo === true) return true;
    var name = rec.displayName || rec.username || "";
    if (DEMO_SEED_NAMES && name && DEMO_SEED_NAMES[String(Object.keys(DEMO_SEED_NAMES).find(function (k) { return DEMO_SEED_NAMES[k] === name; }) || "")] === name) {
      // handled below via reverse lookup
    }
    var hasFirebase = !!(rec.uid || rec.firebaseUid);
    if (!hasFirebase && name) {
      for (var k in DEMO_SEED_NAMES) {
        if (Object.prototype.hasOwnProperty.call(DEMO_SEED_NAMES, k) && DEMO_SEED_NAMES[k] === name) return true;
      }
    }
    return false;
  }

  function isDemoAccountId(rawId) {
    var id = String(rawId == null ? "" : rawId).trim();
    if (!id || !/^\\d+$/.test(id)) return false;
    var n = parseInt(id, 10);
    var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
    var demoEnd = demoBase + 21; // 2..23 when base is 2
    var u = {};
    var p = {};
    try { u = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (_) {}
    try { p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {}; } catch (_) {}
    if (u.demo === true || p.demo === true) return true;
    if (DEMO_SEED_NAMES[id]) {
      var seedName = DEMO_SEED_NAMES[id];
      var uname = u.displayName || u.username || p.displayName || "";
      var hasFirebase = !!(u.uid || u.firebaseUid || localStorage.getItem("firebaseUid"));
      // Known demo roster id without a firebase uid is a demo slot.
      if (!u.uid && !u.firebaseUid && (!uname || uname === seedName || accountLooksDemo(u) || accountLooksDemo(p))) return true;
      // Session pointing at demo id while account is flagged/named as demo.
      if ((uname === seedName || accountLooksDemo(u) || accountLooksDemo(p)) && !u.uid && !u.firebaseUid) return true;
    }
    if (n >= demoBase && n <= demoEnd) {
      if (u.demo === true || p.demo === true) return true;
      if (DEMO_SEED_NAMES[id] && !u.uid && !u.firebaseUid) return true;
    }
    return false;
  }

  function slotTakenByReal(n) {
    var id = String(n);
    var u = {};
    var p = {};
    try { u = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (_) {}
    try { p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {}; } catch (_) {}
    var hasU = u && Object.keys(u).length > 0;
    var hasP = p && Object.keys(p).length > 0;
    if (!hasU && !hasP) return false;
    if (u.demo === true || p.demo === true) return false;
    if (accountLooksDemo(u) || accountLooksDemo(p)) return false;
    if (DEMO_SEED_NAMES[id] && !u.uid && !u.firebaseUid) return false;
    return true;
  }

  function allocatePublicUserId() {
    var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
    var demoEnd = demoBase + 21; // inclusive end of demo band (23 when base=2)
    // Prefer reserved real slots 0 then 1 when not occupied by a real Labrador.
    for (var slot = 0; slot < demoBase; slot++) {
      if (!slotTakenByReal(slot)) return String(slot);
    }
    // Both 0 and 1 used by real users: allocate next free above demo band (24+).
    var usedHigh = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("user_") !== 0) continue;
        var id = key.slice(5);
        if (!/^\\d+$/.test(id)) continue;
        var n = parseInt(id, 10);
        if (n > demoEnd) usedHigh[n] = true;
      }
    } catch (_) {}
    var next = demoEnd + 1;
    while (usedHigh[next] || slotTakenByReal(next)) next++;
    return String(next);
  }

  function copyStoragePrefix(prefix, fromId, toId) {
    try {
      var raw = localStorage.getItem(prefix + fromId);
      if (raw == null) return;
      localStorage.setItem(prefix + toId, raw);
    } catch (_) {}
  }

  function ensureSessionNotDemo() {
    var loggedIn = false;
    var oldId = "";
    try {
      loggedIn = localStorage.getItem("loggedIn") === "true";
      oldId = String(localStorage.getItem("currentUserId") || "").trim();
    } catch (_) { return ""; }
    if (!loggedIn || !oldId) return oldId;
    var safe = sanitizePublicUserId(oldId);
    if (!safe) return oldId;
    if (!isDemoAccountId(safe)) return safe;

    // Real session stuck on a demo id (e.g. Cardbrador=2): reallocate into 0..1 or 24+.
    var newId = allocatePublicUserId();
    if (!newId || newId === safe || isDemoAccountId(newId)) {
      // Force above demo band if allocator somehow bounced.
      var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
      newId = String(demoBase + 22);
      while (slotTakenByReal(parseInt(newId, 10)) || isDemoAccountId(newId)) {
        newId = String(parseInt(newId, 10) + 1);
      }
    }

    try {
      var u = {};
      var p = {};
      try { u = JSON.parse(localStorage.getItem("user_" + safe) || "{}"); } catch (_) {}
      try { p = JSON.parse(localStorage.getItem("profile_" + safe) || "null") || {}; } catch (_) {}
      var fb = "";
      try { fb = String(localStorage.getItem("firebaseUid") || ""); } catch (_) {}
      // Preserve real firebase/session fields; strip demo flag.
      delete u.demo;
      delete p.demo;
      if (fb) {
        u.uid = u.uid || fb;
        u.firebaseUid = u.firebaseUid || fb;
      }
      if (!u.username && !u.displayName) {
        u.username = "Labrador";
        u.displayName = "Labrador";
      }
      p.id = newId;
      p.displayName = p.displayName || u.displayName || u.username || "Labrador";
      localStorage.setItem("user_" + newId, JSON.stringify(u));
      localStorage.setItem("profile_" + newId, JSON.stringify(p));
      copyStoragePrefix("pfp_", safe, newId);
      copyStoragePrefix("friends_", safe, newId);
      localStorage.setItem("currentUserId", newId);
      // Do not leave the Labrador on the demo id; restore demo stub on old id if roster known.
      if (DEMO_SEED_NAMES[safe]) {
        var seedName = DEMO_SEED_NAMES[safe];
        var avatar = (window.CB_DEMO_AVATARS && window.CB_DEMO_AVATARS[safe]) || "/users/default/pfp.jpg";
        localStorage.setItem("user_" + safe, JSON.stringify({
          username: seedName,
          displayName: seedName,
          profilePicture: avatar,
          demo: true
        }));
        localStorage.setItem("profile_" + safe, JSON.stringify({
          id: safe,
          displayName: seedName,
          handle: String(seedName).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24),
          avatar: avatar,
          demo: true
        }));
        localStorage.setItem("pfp_" + safe, avatar);
      }
      writeAuthChromeCache({
        userId: newId,
        username: p.displayName || u.displayName || u.username || "Labrador",
        signedIn: true
      });
      try {
        window.dispatchEvent(new CustomEvent("cb-auth-changed", { detail: { signedIn: true, userId: newId } }));
      } catch (_) {}
      return newId;
    } catch (_) {
      return safe;
    }
  }'''

# DEMO_SEED_NAMES is declared AFTER allocatePublicUserId currently.
# We need DEMO_SEED_NAMES before the new helpers. Move declaration up.
layout = must_replace(layout, old_alloc, "  /* PLACEHOLDER_ALLOC */\n", "allocatePublicUserId")

old_demo_names = '''  /* Canonical demo roster ids "2".."23" (SnackBandit=18, BarkBroker=23; 0-1 reserved). */
  var DEMO_SEED_NAMES = {
    "2": "Cardbrador", "3": "BeeSid", "4": "Miguel", "5": "GyattToad", "6": "AnthonySpade",
    "7": "Barcat", "8": "EvilRobot", "9": "AbovegroundBro", "10": "NerdDog", "11": "OrangeTabby",
    "12": "EvilKid23", "13": "NoFilterBro", "14": "CoolDog", "15": "ANIMEGIRL",
    "16": "PantsWetterLabrador", "17": "RhombusRex", "18": "SnackBandit", "19": "BarTabby",
    "20": "PuddlePirate", "21": "TreatTaxer", "22": "SofaThief", "23": "BarkBroker"
  };

  function remapFriendId(id) {'''

# Put DEMO_SEED_NAMES + new alloc where placeholder is, remove duplicate DEMO_SEED_NAMES block
layout = must_replace(layout, "  /* PLACEHOLDER_ALLOC */\n", '''  /* Canonical demo roster ids "2".."23" (SnackBandit=18, BarkBroker=23; 0-1 reserved). */
  var DEMO_SEED_NAMES = {
    "2": "Cardbrador", "3": "BeeSid", "4": "Miguel", "5": "GyattToad", "6": "AnthonySpade",
    "7": "Barcat", "8": "EvilRobot", "9": "AbovegroundBro", "10": "NerdDog", "11": "OrangeTabby",
    "12": "EvilKid23", "13": "NoFilterBro", "14": "CoolDog", "15": "ANIMEGIRL",
    "16": "PantsWetterLabrador", "17": "RhombusRex", "18": "SnackBandit", "19": "BarTabby",
    "20": "PuddlePirate", "21": "TreatTaxer", "22": "SofaThief", "23": "BarkBroker"
  };

''' + new_alloc + "\n", "insert alloc+names")

layout = must_replace(layout, old_demo_names, "  function remapFriendId(id) {", "remove duplicate DEMO_SEED_NAMES")

# getLocalUser: ensure session not demo before reading
layout = must_replace(
    layout,
    '''  function getLocalUser() {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    let userId = localStorage.getItem("currentUserId");
    if (!loggedIn || !userId) return null;
    // Migrate legacy "me" / firebase-uid-as-id into a numeric public id
    var safe = sanitizePublicUserId(userId);''',
    '''  function getLocalUser() {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    let userId = localStorage.getItem("currentUserId");
    if (!loggedIn || !userId) return null;
    try { userId = ensureSessionNotDemo() || userId; } catch (_) {}
    // Migrate legacy "me" / firebase-uid-as-id into a numeric public id
    var safe = sanitizePublicUserId(userId);''',
    "getLocalUser ensureSessionNotDemo"
)

# getSessionUserId: detach demo ids
layout = must_replace(
    layout,
    '''  function getSessionUserId() {
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    var safe = sanitizePublicUserId(id);
    if (safe) return safe;
    if (id && id !== uid && /^\\d+$/.test(String(id))) return String(id);
    // Never expose firebase uid or "me" as a public profile id
    return "";
  }''',
    '''  function getSessionUserId() {
    try { ensureSessionNotDemo(); } catch (_) {}
    const id = localStorage.getItem("currentUserId") || "";
    const uid = localStorage.getItem("firebaseUid") || "";
    var safe = sanitizePublicUserId(id);
    if (safe) {
      if (isDemoAccountId(safe) && localStorage.getItem("loggedIn") === "true") {
        var moved = "";
        try { moved = ensureSessionNotDemo(); } catch (_) {}
        if (moved && !isDemoAccountId(moved)) return moved;
      }
      return safe;
    }
    if (id && id !== uid && /^\\d+$/.test(String(id))) return String(id);
    // Never expose firebase uid or "me" as a public profile id
    return "";
  }''',
    "getSessionUserId"
)

# Auth apply: after resolving profileId, detach demo
layout = must_replace(
    layout,
    '''          if (!profileId || profileId === "me" || profileId === user.uid || !/^\\d+$/.test(String(profileId))) {
            profileId = allocatePublicUserId();
            localStorage.setItem("currentUserId", profileId);''',
    '''          if (profileId && isDemoAccountId(String(profileId))) {
            profileId = "";
          }
          if (!profileId || profileId === "me" || profileId === user.uid || !/^\\d+$/.test(String(profileId))) {
            profileId = allocatePublicUserId();
            localStorage.setItem("currentUserId", profileId);''',
    "auth apply reject demo profileId"
)

# After auth writes profile, ensure again
layout = must_replace(
    layout,
          '''          const profileUrl = "/users/" + encodeURIComponent(profileId);
          let displayName = username;
          try {
            const existing = JSON.parse(localStorage.getItem("user_" + profileId) || "{}");
            const prof = JSON.parse(localStorage.getItem("profile_" + profileId) || "null") || {};
            displayName = prof.displayName || existing.displayName || existing.username || username;
          } catch (_) {}
          renderSignedInChrome({
            id: profileId,''',
          '''          try { profileId = ensureSessionNotDemo() || profileId; } catch (_) {}
          const profileUrl = "/users/" + encodeURIComponent(profileId);
          let displayName = username;
          try {
            const existing = JSON.parse(localStorage.getItem("user_" + profileId) || "{}");
            const prof = JSON.parse(localStorage.getItem("profile_" + profileId) || "null") || {};
            displayName = prof.displayName || existing.displayName || existing.username || username;
            // Never show a demo roster name for a real signed-in Labrador.
            if (existing.demo || prof.demo) {
              delete existing.demo;
              delete prof.demo;
              existing.uid = existing.uid || user.uid;
              localStorage.setItem("user_" + profileId, JSON.stringify(existing));
              localStorage.setItem("profile_" + profileId, JSON.stringify(prof));
            }
          } catch (_) {}
          renderSignedInChrome({
            id: profileId,''',
    "auth ensure after profile"
)

# loadLayout boot
layout = must_replace(
    layout,
    '''    await Promise.all(jobs);
    applySiteTheme();
    if (!paintAuthChromeFromCache()) {
      var localBoot = getLocalUser();
      if (localBoot) renderLocalProfile(localBoot);
      else renderAuthSkeleton();
    }''',
    '''    await Promise.all(jobs);
    applySiteTheme();
    try { ensureSessionNotDemo(); } catch (_) {}
    if (!paintAuthChromeFromCache()) {
      var localBoot = getLocalUser();
      if (localBoot) renderLocalProfile(localBoot);
      else renderAuthSkeleton();
    }''',
    "loadLayout ensure"
)

# Search stub fix
layout = must_replace(
    layout,
    '''    [
      { title: "Cardbrador", id: "0" },
      { title: "BeeSid", id: "1" }
    ].forEach(function (demo) {''',
    '''    [
      { title: "Cardbrador", id: "2" },
      { title: "BeeSid", id: "3" }
    ].forEach(function (demo) {''',
    "search stub ids"
)

# Export helpers
layout = must_replace(
    layout,
    '''  window.CoolbradorSession = { isSignedIn, hasLocalSession, getSessionUserId, requireSignedIn, signOut: signOutFully, whenAuthReady, get authReady() { return authReady; }, get authLoading() { return authLoading; } };
  window.CoolbradorLayout = { loadLayout, updateUserProfile, wireAllSearch, wireSidebar, wireRightRail, isSignedIn, getSessionUserId, requireSignedIn, applySiteTheme, signOut: signOutFully, whenAuthReady, allocatePublicUserId, sanitizePublicUserId, resolveFriendEntry, remapFriendId, applyShareSoloChrome };''',
    '''  window.CoolbradorSession = { isSignedIn, hasLocalSession, getSessionUserId, requireSignedIn, signOut: signOutFully, whenAuthReady, ensureSessionNotDemo, isDemoAccountId, get authReady() { return authReady; }, get authLoading() { return authLoading; } };
  window.CoolbradorLayout = { loadLayout, updateUserProfile, wireAllSearch, wireSidebar, wireRightRail, isSignedIn, getSessionUserId, requireSignedIn, applySiteTheme, signOut: signOutFully, whenAuthReady, allocatePublicUserId, sanitizePublicUserId, resolveFriendEntry, remapFriendId, applyShareSoloChrome, ensureSessionNotDemo, isDemoAccountId };''',
    "exports"
)

layout_path.write_text(layout, encoding="utf-8")
print("OK layout.js")
print("bak:", bak)
