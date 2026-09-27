# -*- coding: utf-8 -*-
"""Coolbrador identity + thread width patches (SEED_VERSION 17)."""
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]:\n{old[:120]!r}")
    return text.replace(old, new, 1)

# ---- styles.css: thread width 700 -> 800 ----
css_path = ROOT / "styles.css"
css = css_path.read_text(encoding="utf-8")
css = must_replace(
    css,
    ".post-thread-page .post-thread-main { max-width: 700px; margin: 12px auto 80px; }",
    ".post-thread-page .post-thread-main { max-width: 800px; margin: 12px auto 80px; }",
    "thread-main-700",
)
css = must_replace(
    css,
    """.post-thread-page .post-thread-replies-wrap,
.post-thread-page #threadComposeHost,
.post-thread-page .post-thread-hero {
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}""",
    """.post-thread-page .post-thread-replies-wrap,
.post-thread-page #threadComposeHost,
.post-thread-page .post-thread-hero {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}""",
    "thread-wrap-700",
)
css_path.write_text(css, encoding="utf-8")
print("OK styles.css")

# ---- posts.js ----
posts_path = ROOT / "js" / "posts.js"
posts = posts_path.read_text(encoding="utf-8")

old_demo_avatars = '''  var DEMO_AVATARS = {
    "0": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "1": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "2": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "3": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "4": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "5": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "6": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "7": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "8": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "9": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "10": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "11": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "12": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "13": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png"
  };'''

new_demo_avatars = '''  /* Fallback keys match canonical demo roster ids "1".."22" (same as CB_DEMO_AVATARS). */
  var DEMO_AVATARS = {
    "1": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "2": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "3": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "4": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "5": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "6": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "7": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "8": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "9": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "10": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "11": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "12": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "13": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "14": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png",
    "15": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "16": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "17": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "18": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "19": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "20": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "21": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "22": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"
  };'''

posts = must_replace(posts, old_demo_avatars, new_demo_avatars, "posts DEMO_AVATARS")

old_getpfp = '''  function getPfp(id) {
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
    var band = key;
    if (/^\\d+$/.test(key)) {
      var n = parseInt(key, 10);
      if (n >= 1 && n <= 22) band = String(n - 1);
    }
    return localStorage.getItem("pfp_" + key) || fromProf || fromUser ||
      (global.CB_DEMO_AVATARS && (global.CB_DEMO_AVATARS[key] || global.CB_DEMO_AVATARS[band])) ||
      DEMO_AVATARS[key] || DEMO_AVATARS[band] ||
      "/users/default/pfp.jpg";
  }'''

new_getpfp = '''  function getPfp(id) {
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
    // Use id string as AVATARS key (roster is "1".."22"; do not n-1 remap).
    return localStorage.getItem("pfp_" + key) || fromProf || fromUser ||
      (global.CB_DEMO_AVATARS && global.CB_DEMO_AVATARS[key]) ||
      DEMO_AVATARS[key] ||
      "/users/default/pfp.jpg";
  }'''

posts = must_replace(posts, old_getpfp, new_getpfp, "getPfp")

old_summary = '''  function loadUserSummary(userId) {
    var id = String(userId || "");
    // Remap legacy demo band 0-21 -> 1+
    if (/^\\d+$/.test(id)) {
      var n = parseInt(id, 10);
      if (n >= 0 && n <= 21) {
        var base = (global.CB_DEMO_ID_BASE != null) ? Number(global.CB_DEMO_ID_BASE) : 1;
        id = String(base + n);
      }
    }
    var u = {};
    var p = {};
    try { u = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (e) {}
    try { p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {}; } catch (e) {}
    var seedNames = {
      "1": "Cardbrador", "2": "BeeSid", "3": "Miguel", "4": "GyattToad",
      "5": "AnthonySpade", "6": "Barcat", "7": "EvilRobot", "8": "AbovegroundBro",
      "9": "NerdDog", "10": "OrangeTabby", "11": "EvilKid23", "12": "NoFilterBro",
      "13": "CoolDog", "14": "ANIMEGIRL"
    };'''

new_summary = '''  function loadUserSummary(userId) {
    var id = String(userId || "");
    // Canonical demo roster is already "1".."22". Only lift true legacy id "0".
    if (/^\\d+$/.test(id)) {
      var n = parseInt(id, 10);
      var base = (global.CB_DEMO_ID_BASE != null) ? Number(global.CB_DEMO_ID_BASE) : 1;
      if (n >= 0 && n < base) id = String(base + n);
    }
    var u = {};
    var p = {};
    try { u = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (e) {}
    try { p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {}; } catch (e) {}
    // Stable roster names (SnackBandit=17, BarkBroker=22).
    var seedNames = {
      "1": "Cardbrador", "2": "BeeSid", "3": "Miguel", "4": "GyattToad",
      "5": "AnthonySpade", "6": "Barcat", "7": "EvilRobot", "8": "AbovegroundBro",
      "9": "NerdDog", "10": "OrangeTabby", "11": "EvilKid23", "12": "NoFilterBro",
      "13": "CoolDog", "14": "ANIMEGIRL", "15": "PantsWetterLabrador", "16": "RhombusRex",
      "17": "SnackBandit", "18": "BarTabby", "19": "PuddlePirate", "20": "TreatTaxer",
      "21": "SofaThief", "22": "BarkBroker"
    };'''

posts = must_replace(posts, old_summary, new_summary, "loadUserSummary")
posts_path.write_text(posts, encoding="utf-8")
print("OK posts.js")

# ---- layout.js ----
layout_path = ROOT / "js" / "layout.js"
layout = layout_path.read_text(encoding="utf-8")

old_seed_names = '''  var DEMO_SEED_NAMES = {
    "0": "Cardbrador", "1": "BeeSid", "2": "Miguel", "3": "GyattToad", "4": "AnthonySpade",
    "5": "Barcat", "6": "EvilRobot", "7": "AbovegroundBro", "8": "NerdDog", "9": "OrangeTabby",
    "10": "EvilKid23", "11": "NoFilterBro", "12": "CoolDog", "13": "ANIMEGIRL",
    "14": "ChipperFan", "15": "RhombusRex", "16": "StarryPaw", "17": "MutinyMap",
    "18": "GiftGoblin", "19": "FarmFox", "20": "LoungeLab", "21": "PotatoPup"
  };'''

new_seed_names = '''  /* Canonical demo roster ids "1".."22" (SnackBandit=17, BarkBroker=22). */
  var DEMO_SEED_NAMES = {
    "1": "Cardbrador", "2": "BeeSid", "3": "Miguel", "4": "GyattToad", "5": "AnthonySpade",
    "6": "Barcat", "7": "EvilRobot", "8": "AbovegroundBro", "9": "NerdDog", "10": "OrangeTabby",
    "11": "EvilKid23", "12": "NoFilterBro", "13": "CoolDog", "14": "ANIMEGIRL",
    "15": "PantsWetterLabrador", "16": "RhombusRex", "17": "SnackBandit", "18": "BarTabby",
    "19": "PuddlePirate", "20": "TreatTaxer", "21": "SofaThief", "22": "BarkBroker"
  };'''

layout = must_replace(layout, old_seed_names, new_seed_names, "DEMO_SEED_NAMES")

old_remap = '''  function remapFriendId(id) {
    var s = String(id == null ? "" : id).trim();
    if (!s) return "";
    if (/^\\d+$/.test(s)) {
      var n = parseInt(s, 10);
      // Legacy demo band 0-21 -> 1+
      if (n >= 0 && n <= 21) {
        var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
        return String(base + n);
      }
      return s;
    }
    return "";
  }'''

new_remap = '''  function remapFriendId(id) {
    var s = String(id == null ? "" : id).trim();
    if (!s) return "";
    if (/^\\d+$/.test(s)) {
      var n = parseInt(s, 10);
      var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
      // Only lift true legacy ids below DEMO_ID_BASE (id "0" when base is 1).
      if (n >= 0 && n < base) return String(base + n);
      return s;
    }
    return "";
  }'''

layout = must_replace(layout, old_remap, new_remap, "layout remapFriendId")

old_resolve = '''    var low = "";
    var n = parseInt(rid, 10);
    if (n >= 1 && n <= 22) low = String(n - 1);
    else if (n >= 0 && n <= 21) low = String(n);
    var seedName = (low && DEMO_SEED_NAMES[low]) || "";
    var name = (p && p.displayName) || u.displayName || u.username || seedName;
    if (!name) return null; // skip empty/broken stubs
    var handle = (p && p.handle) || u.handle || String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || ("lab" + rid);
    var pfp = (p && p.avatar) || u.profilePicture || localStorage.getItem("pfp_" + rid) ||
      (window.CB_DEMO_AVATARS && (window.CB_DEMO_AVATARS[rid] || (low && window.CB_DEMO_AVATARS[low]))) ||
      "/users/default/pfp.jpg";'''

new_resolve = '''    var seedName = DEMO_SEED_NAMES[rid] || "";
    var name = (p && p.displayName) || u.displayName || u.username || seedName;
    if (!name) return null; // skip empty/broken stubs
    var handle = (p && p.handle) || u.handle || String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || ("lab" + rid);
    var pfp = (p && p.avatar) || u.profilePicture || localStorage.getItem("pfp_" + rid) ||
      (window.CB_DEMO_AVATARS && window.CB_DEMO_AVATARS[rid]) ||
      "/users/default/pfp.jpg";'''

layout = must_replace(layout, old_resolve, new_resolve, "layout resolveFriendEntry")
layout_path.write_text(layout, encoding="utf-8")
print("OK layout.js")

# ---- home.js ----
home_path = ROOT / "js" / "home.js"
home = home_path.read_text(encoding="utf-8")
old_home_remap = '''      function remapFriendId(id) {
        var s = String(id == null ? "" : id).trim();
        if (!s || !/^\\d+$/.test(s)) return "";
        var n = parseInt(s, 10);
        if (n >= 0 && n <= 21) {
          var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
          return String(base + n);
        }
        return s;
      }'''
new_home_remap = '''      function remapFriendId(id) {
        var s = String(id == null ? "" : id).trim();
        if (!s || !/^\\d+$/.test(s)) return "";
        var n = parseInt(s, 10);
        var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
        if (n >= 0 && n < base) return String(base + n);
        return s;
      }'''
home = must_replace(home, old_home_remap, new_home_remap, "home remapFriendId")

old_home_seeds = '''        var seedNames = {
          "1":"Cardbrador","2":"BeeSid","3":"Miguel","4":"GyattToad","5":"AnthonySpade",
          "6":"Barcat","7":"EvilRobot","8":"AbovegroundBro","9":"NerdDog","10":"OrangeTabby",
          "11":"EvilKid23","12":"NoFilterBro","13":"CoolDog","14":"ANIMEGIRL"
        };'''
new_home_seeds = '''        var seedNames = {
          "1":"Cardbrador","2":"BeeSid","3":"Miguel","4":"GyattToad","5":"AnthonySpade",
          "6":"Barcat","7":"EvilRobot","8":"AbovegroundBro","9":"NerdDog","10":"OrangeTabby",
          "11":"EvilKid23","12":"NoFilterBro","13":"CoolDog","14":"ANIMEGIRL",
          "15":"PantsWetterLabrador","16":"RhombusRex","17":"SnackBandit","18":"BarTabby",
          "19":"PuddlePirate","20":"TreatTaxer","21":"SofaThief","22":"BarkBroker"
        };'''
home = must_replace(home, old_home_seeds, new_home_seeds, "home seedNames")
home_path.write_text(home, encoding="utf-8")
print("OK home.js")

# ---- profile.js ----
prof_path = ROOT / "js" / "profile.js"
prof = prof_path.read_text(encoding="utf-8")

old_prof_avatars = '''  var DEMO_AVATARS = {
    "0": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "1": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "2": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "3": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "4": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "5": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "6": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "7": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "8": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "9": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "10": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "11": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "12": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "13": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png"
  };'''

new_prof_avatars = '''  var DEMO_AVATARS = {
    "1": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "2": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "3": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "4": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "5": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "6": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "7": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "8": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "9": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "10": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "11": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "12": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "13": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "14": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png",
    "15": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "16": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "17": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "18": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "19": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "20": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "21": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "22": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"
  };'''

prof = must_replace(prof, old_prof_avatars, new_prof_avatars, "profile DEMO_AVATARS")

old_band = '''  function demoBandKey(id) {
    var s = String(id == null ? "" : id);
    if (!/^\\d+$/.test(s)) return s;
    var n = parseInt(s, 10);
    if (n >= 1 && n <= 22) return String(n - 1);
    return s;
  }
  function demoAvatar(id) {
    var key = demoBandKey(id);
    return (window.CB_DEMO_AVATARS && (window.CB_DEMO_AVATARS[id] || window.CB_DEMO_AVATARS[key])) ||
      DEMO_AVATARS[id] || DEMO_AVATARS[key] || "/users/default/pfp.jpg";
  }'''

new_band = '''  function demoBandKey(id) {
    // Roster keys are already "1".."22"; no n-1 remap.
    return String(id == null ? "" : id);
  }
  function demoAvatar(id) {
    var key = demoBandKey(id);
    return (window.CB_DEMO_AVATARS && window.CB_DEMO_AVATARS[key]) ||
      DEMO_AVATARS[key] || "/users/default/pfp.jpg";
  }'''

prof = must_replace(prof, old_band, new_band, "profile demoBandKey")

old_prof_remap = '''  function remapFriendId(id) {
    var s = String(id == null ? "" : id).trim();
    if (!s || !/^\\d+$/.test(s)) return "";
    var n = parseInt(s, 10);
    if (n >= 0 && n <= 21) {
      var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
      return String(base + n);
    }
    return s;
  }'''

new_prof_remap = '''  function remapFriendId(id) {
    var s = String(id == null ? "" : id).trim();
    if (!s || !/^\\d+$/.test(s)) return "";
    var n = parseInt(s, 10);
    var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;
    if (n >= 0 && n < base) return String(base + n);
    return s;
  }'''

prof = must_replace(prof, old_prof_remap, new_prof_remap, "profile remapFriendId")
prof_path.write_text(prof, encoding="utf-8")
print("OK profile.js")

print("PASS phase1")
