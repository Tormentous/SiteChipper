# -*- coding: utf-8 -*-
from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]\n---\n{old[:300]}\n---")
    return text.replace(old, new, 1)

seed_path = ROOT / "js" / "seed-demo.js"
seed = seed_path.read_text(encoding="utf-8")

seed = must_replace(seed, '  var SEED_VERSION = "17";', '  var SEED_VERSION = "18";', "SEED_VERSION")

# Protect clearLegacy: never clear 0/1; never touch session keys; migrate real session off demo first
old_clear = '''      Object.keys(AVATARS).forEach(function (id) {
        localStorage.removeItem("user_" + id);
        localStorage.removeItem("profile_" + id);
        localStorage.removeItem("pfp_" + id);
        localStorage.removeItem("friends_" + id);
      });
      // Also clear legacy low-band demo IDs (0-21) unless the signed-in Labrador owns that id
      (function clearLegacyDemoBand() {
        var sid = "";
        try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        // Clear 0..22 so old base-1 demos (1-22) and vacated slots cannot collide with 2-23.
        for (var li = 0; li <= 22; li++) {
          var lid = String(li);
          if (sid && sid === lid) continue;
          localStorage.removeItem("user_" + lid);
          localStorage.removeItem("profile_" + lid);
          localStorage.removeItem("pfp_" + lid);
          localStorage.removeItem("friends_" + lid);
        }
      })();'''

new_clear = '''      // Detach real session from demo ids BEFORE wiping demo roster (never leave Labrador on id 2).
      (function detachSessionFromDemoBand() {
        var sid = "";
        var loggedIn = false;
        var fb = "";
        try {
          sid = String(localStorage.getItem("currentUserId") || "");
          loggedIn = localStorage.getItem("loggedIn") === "true";
          fb = String(localStorage.getItem("firebaseUid") || "");
        } catch (e) {}
        // Seed must never clear or rewrite currentUserId / loggedIn / firebaseUid.
        if (!loggedIn || !sid || !/^\\d+$/.test(sid)) return;
        var n = parseInt(sid, 10);
        if (n < DEMO_ID_BASE || n > DEMO_ID_BASE + 21) return;
        var u = {};
        var p = {};
        try { u = JSON.parse(localStorage.getItem("user_" + sid) || "{}"); } catch (e) {}
        try { p = JSON.parse(localStorage.getItem("profile_" + sid) || "null") || {}; } catch (e) {}
        var seedName = ({
          "2":"Cardbrador","3":"BeeSid","4":"Miguel","5":"GyattToad","6":"AnthonySpade",
          "7":"Barcat","8":"EvilRobot","9":"AbovegroundBro","10":"NerdDog","11":"OrangeTabby",
          "12":"EvilKid23","13":"NoFilterBro","14":"CoolDog","15":"ANIMEGIRL",
          "16":"PantsWetterLabrador","17":"RhombusRex","18":"SnackBandit","19":"BarTabby",
          "20":"PuddlePirate","21":"TreatTaxer","22":"SofaThief","23":"BarkBroker"
        })[sid];
        var looksDemo = u.demo === true || p.demo === true || (seedName && (u.displayName === seedName || u.username === seedName) && !u.uid && !u.firebaseUid && !fb);
        // If this slot is a pure demo and session somehow points here without firebase, still move off.
        // If firebase/session fields exist on a demo id, copy to free 0/1/24+.
        function slotTakenByReal(slot) {
          var id = String(slot);
          var ru = {};
          try { ru = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (e) {}
          if (!ru || !Object.keys(ru).length) return false;
          if (ru.demo === true) return false;
          return true;
        }
        var newId = "";
        for (var s = 0; s < DEMO_ID_BASE; s++) {
          if (!slotTakenByReal(s)) { newId = String(s); break; }
        }
        if (!newId) {
          var next = DEMO_ID_BASE + 22;
          while (slotTakenByReal(next)) next++;
          newId = String(next);
        }
        delete u.demo;
        delete p.demo;
        if (fb) { u.uid = u.uid || fb; u.firebaseUid = u.firebaseUid || fb; }
        if (!u.username && !u.displayName) { u.username = "Labrador"; u.displayName = "Labrador"; }
        p.id = newId;
        p.displayName = p.displayName || u.displayName || u.username || "Labrador";
        try {
          localStorage.setItem("user_" + newId, JSON.stringify(u));
          localStorage.setItem("profile_" + newId, JSON.stringify(p));
          var pfp = localStorage.getItem("pfp_" + sid);
          if (pfp) localStorage.setItem("pfp_" + newId, pfp);
          var fr = localStorage.getItem("friends_" + sid);
          if (fr) localStorage.setItem("friends_" + newId, fr);
          localStorage.setItem("currentUserId", newId);
        } catch (e) {}
      })();
      Object.keys(AVATARS).forEach(function (id) {
        // Never wipe reserved real slots 0/1 (AVATARS starts at 2, but guard anyway).
        if (id === "0" || id === "1") return;
        var sidNow = "";
        try { sidNow = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        if (sidNow && sidNow === id) return;
        localStorage.removeItem("user_" + id);
        localStorage.removeItem("profile_" + id);
        localStorage.removeItem("pfp_" + id);
        localStorage.removeItem("friends_" + id);
      });
      // Clear leftover low-band stubs only; NEVER touch user_0 / user_1 or session keys.
      (function clearLegacyDemoBand() {
        var sid = "";
        try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        for (var li = DEMO_ID_BASE; li <= DEMO_ID_BASE + 21; li++) {
          var lid = String(li);
          if (sid && sid === lid) continue;
          // AVATARS rewrite covers these; skip if already handled
        }
        // Do not remove user_0 / user_1 under any seed repair.
      })();'''

seed = must_replace(seed, old_clear, new_clear, "clearLegacy protect 0/1")

# migrateDemoOffZero: never move/clear 0/1 real users; skip touching session
old_mig = '''    for (var i = 0; i <= 21; i++) {
      var oldId = String(i);
      var newId = String(DEMO_ID_BASE + i);
      if (sid && sid === oldId) continue;'''

new_mig = '''    for (var i = 0; i <= 21; i++) {
      var oldId = String(i);
      var newId = String(DEMO_ID_BASE + i);
      // Never migrate or clear reserved real slots 0/1 into the demo band.
      if (oldId === "0" || oldId === "1") continue;
      if (sid && sid === oldId) continue;'''

seed = must_replace(seed, old_mig, new_mig, "migrate skip 0/1")

# demos.forEach: never overwrite if currentUserId is that id
old_demo_write = '''  demos.forEach(function (d) {
    var avatar = AVATARS[d.id] || "/users/default/pfp.jpg";
    // Force rewrite on SEED_VERSION bump so repair stubs get full roster fields.
    if (needReseed || !localStorage.getItem("user_" + d.id)) {
      localStorage.setItem("user_" + d.id, JSON.stringify({
        username: d.displayName,
        displayName: d.displayName,
        bio: d.bio,
        about: d.about,
        profilePicture: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true
      }));
    }
    if (needReseed || !localStorage.getItem("profile_" + d.id)) {
      localStorage.setItem("profile_" + d.id, JSON.stringify({
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
      }));
    }
    if (needReseed || !localStorage.getItem("pfp_" + d.id)) {
      localStorage.setItem("pfp_" + d.id, avatar);
    }
  });'''

new_demo_write = '''  demos.forEach(function (d) {
    var avatar = AVATARS[d.id] || "/users/default/pfp.jpg";
    var sidNow = "";
    try { sidNow = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    // Never overwrite the signed-in Labrador slot (and never touch 0/1 here).
    if (d.id === "0" || d.id === "1") return;
    if (sidNow && sidNow === d.id) return;
    // Force rewrite on SEED_VERSION bump so repair stubs get full roster fields.
    if (needReseed || !localStorage.getItem("user_" + d.id)) {
      localStorage.setItem("user_" + d.id, JSON.stringify({
        username: d.displayName,
        displayName: d.displayName,
        bio: d.bio,
        about: d.about,
        profilePicture: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true
      }));
    }
    if (needReseed || !localStorage.getItem("profile_" + d.id)) {
      localStorage.setItem("profile_" + d.id, JSON.stringify({
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
      }));
    }
    if (needReseed || !localStorage.getItem("pfp_" + d.id)) {
      localStorage.setItem("pfp_" + d.id, avatar);
    }
  });'''

seed = must_replace(seed, old_demo_write, new_demo_write, "demos.forEach protect session")

# repairDemoRosterIds rewrite: skip currentUserId
old_repair_write = '''    Object.keys(NAME_TO_ID).forEach(function (name) {
      var id = NAME_TO_ID[name];
      var avatar = AVATARS[id] || "/users/default/pfp.jpg";
      localStorage.setItem("pfp_" + id, avatar);
      try {
        var u = JSON.parse(localStorage.getItem("user_" + id) || "{}");
        u.username = name;
        u.displayName = name;
        u.profilePicture = avatar;
        u.demo = true;
        localStorage.setItem("user_" + id, JSON.stringify(u));
      } catch (e) {
        localStorage.setItem("user_" + id, JSON.stringify({
          username: name, displayName: name, profilePicture: avatar, demo: true
        }));
      }
      try {
        var p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {};
        p.id = id;
        p.displayName = name;
        p.avatar = avatar;
        p.demo = true;
        if (!p.handle) p.handle = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
        localStorage.setItem("profile_" + id, JSON.stringify(p));
      } catch (e) {}
    });'''

new_repair_write = '''    var sidRepair = "";
    try { sidRepair = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    Object.keys(NAME_TO_ID).forEach(function (name) {
      var id = NAME_TO_ID[name];
      if (id === "0" || id === "1") return;
      if (sidRepair && sidRepair === id) return; // never clobber signed-in Labrador
      var avatar = AVATARS[id] || "/users/default/pfp.jpg";
      localStorage.setItem("pfp_" + id, avatar);
      try {
        var u = JSON.parse(localStorage.getItem("user_" + id) || "{}");
        u.username = name;
        u.displayName = name;
        u.profilePicture = avatar;
        u.demo = true;
        delete u.uid;
        delete u.firebaseUid;
        localStorage.setItem("user_" + id, JSON.stringify(u));
      } catch (e) {
        localStorage.setItem("user_" + id, JSON.stringify({
          username: name, displayName: name, profilePicture: avatar, demo: true
        }));
      }
      try {
        var p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {};
        p.id = id;
        p.displayName = name;
        p.avatar = avatar;
        p.demo = true;
        if (!p.handle) p.handle = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
        localStorage.setItem("profile_" + id, JSON.stringify(p));
      } catch (e) {}
    });'''

seed = must_replace(seed, old_repair_write, new_repair_write, "repair rewrite protect")

seed_path.write_text(seed, encoding="utf-8")
print("OK seed-demo.js -> SEED 18")
