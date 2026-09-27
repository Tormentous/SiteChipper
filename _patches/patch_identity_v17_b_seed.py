# -*- coding: utf-8 -*-
"""Phase B: DEMO_ID_BASE=2, roster 2-23, SEED_VERSION 17, one-shot migrate + repair."""
from pathlib import Path
import re

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

ROSTER = [
    (2, "Cardbrador", "cardbrador", "Welcome aboard.", "Official-ish demo pup.", "/shared/TestImages/ProfilePhotos/Cardbrador.png"),
    (3, "BeeSid", "beesid", "Rhombus enjoyer.", "Lives in the header glow.", "/shared/TestImages/ProfilePhotos/BeeSid.png"),
    (4, "Miguel", "miguel", "Mutiny correspondent.", "Keeps receipts.", "/shared/TestImages/ProfilePhotos/Miguel.webp"),
    (5, "GyattToad", "gyatttoad", "Pitch machine.", "Ideas tab forever.", "/shared/TestImages/ProfilePhotos/GyattToad.png"),
    (6, "AnthonySpade", "anthonyspade", "Gift drive booster.", "Stockings full of rhombuses.", "/shared/TestImages/ProfilePhotos/AnthonySpade.png"),
    (7, "Barcat", "barcat", "Lounge lookout.", "Always on the rail.", "/shared/TestImages/ProfilePhotos/Barcat.png"),
    (8, "EvilRobot", "evilrobot", "Beep boop menace.", "Mostly jokes.", "/shared/TestImages/ProfilePhotos/EvilRobot.jpg"),
    (9, "AbovegroundBro", "abovegroundbro", "Above-ground vibes.", "Test mesh enjoyer.", "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"),
    (10, "NerdDog", "nerddog", "Specs and snacks.", "8x the polish.", "/shared/TestImages/ProfilePhotos/NerdDog.png"),
    (11, "OrangeTabby", "orangetabby", "Triple leverage vibes.", "Charts and stars.", "/shared/TestImages/ProfilePhotos/OrangeTabby.png"),
    (12, "EvilKid23", "evilkids23", "Spooky soft launch.", "Friendly haunt.", "/shared/TestImages/ProfilePhotos/EvilKid23.png"),
    (13, "NoFilterBro", "nofilterbro", "Raw feed only.", "What you see is what you get.", "/shared/TestImages/ProfilePhotos/NoFilterBro.png"),
    (14, "CoolDog", "cooldog", "Cool by default.", "Name is the vibe.", "/shared/TestImages/ProfilePhotos/CoolDog.png"),
    (15, "ANIMEGIRL", "animegirl", "Main character energy.", "Frame-perfect poses.", "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png"),
    (16, "PantsWetterLabrador", "pantswetter", "Hydration is a lifestyle.", "Check your pants.", "/shared/TestImages/ProfilePhotos/CoolDog.png"),
    (17, "RhombusRex", "rhombusrex", "Angles only.", "Header glow fan.", "/shared/TestImages/ProfilePhotos/EvilRobot.jpg"),
    (18, "SnackBandit", "snackbandit", "Treat heist specialist.", "Will work for biscuits.", "/shared/TestImages/ProfilePhotos/GyattToad.png"),
    (19, "BarTabby", "bartabby", "Bar shifts and soft paws.", "Speed is kindness.", "/shared/TestImages/ProfilePhotos/OrangeTabby.png"),
    (20, "PuddlePirate", "puddlepirate", "Splash tax collector.", "Boots optional.", "/shared/TestImages/ProfilePhotos/Miguel.webp"),
    (21, "TreatTaxer", "treattaxer", "IRS of snacks.", "Pay the biscuit.", "/shared/TestImages/ProfilePhotos/Barcat.png"),
    (22, "SofaThief", "sofathief", "Cushion conqueror.", "Your seat is my seat.", "/shared/TestImages/ProfilePhotos/NerdDog.png"),
    (23, "BarkBroker", "barkbroker", "Market of woofs.", "Bullish on pets.", "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"),
]

def avatars_js():
    lines = ['  var AVATARS = {']
    for i, (oid, name, handle, bio, about, url) in enumerate(ROSTER):
        comma = "," if i < len(ROSTER) - 1 else ""
        lines.append(f'    "{oid}": "{url}"{comma}')
    lines.append("  };")
    return "\n".join(lines)

def demos_js():
    lines = ["  var demos = ["]
    for i, (oid, name, handle, bio, about, url) in enumerate(ROSTER):
        comma = "," if i < len(ROSTER) - 1 else ""
        lines.append(
            f'    {{ id: "{oid}", displayName: "{name}", handle: "{handle}", bio: "{bio}", about: "{about}" }}{comma}'
        )
    lines.append("  ];")
    return "\n".join(lines)

def seed_names_obj(prefix=""):
    # "2": "Cardbrador", ...
    parts = [f'"{oid}": "{name}"' for oid, name, *_ in ROSTER]
    # group roughly
    chunks = []
    for i in range(0, len(parts), 5):
        chunks.append(", ".join(parts[i:i+5]))
    return (",\n" + prefix).join(chunks)

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]: {old[:160]!r}")
    return text.replace(old, new, 1)

def bump_seed_ids_in_posts_block(text):
    """Bump hardcoded demo userId / yeahs digit strings 1-22 -> 2-23 in seed-demo post literals.
    Only safe inside seed file where demo posts used old base-1 ids.
    """
    # userId: "N" where N is 1-22
    def bump_userid(m):
        n = int(m.group(1))
        if 1 <= n <= 22:
            return f'userId: "{n + 1}"'
        return m.group(0)
    text = re.sub(r'userId:\s*"(\d+)"', bump_userid, text)

    # yeahs: ["1", "5"] etc - bump each quoted number 1-22
    def bump_yeahs(m):
        inner = m.group(1)
        def bump_one(mm):
            n = int(mm.group(1))
            if 1 <= n <= 22:
                return f'"{n + 1}"'
            return mm.group(0)
        new_inner = re.sub(r'"(\d+)"', bump_one, inner)
        return "yeahs: [" + new_inner + "]"
    text = re.sub(r'yeahs:\s*\[([^\]]*)\]', bump_yeahs, text)

    # map = { demo: "1", ... }
    text = text.replace(
        'var map = { demo: "1", demo2: "2", demo3: "3", demo4: "4", demo5: "5" };',
        'var map = { demo: "2", demo2: "3", demo3: "4", demo4: "5", demo5: "6" };',
    )
    return text

# ---------- seed-demo.js ----------
seed_path = ROOT / "js" / "seed-demo.js"
seed = seed_path.read_text(encoding="utf-8")

seed = must_replace(seed, 'var SEED_VERSION = "16";', 'var SEED_VERSION = "17";', "SEED_VERSION")
seed = must_replace(seed, "var DEMO_ID_BASE = 1;", "var DEMO_ID_BASE = 2;", "DEMO_ID_BASE")

# Replace AVATARS block
m = re.search(r"  var AVATARS = \{.*?\n  \};", seed, re.S)
if not m:
    raise SystemExit("AVATARS block not found")
# Prepend stable roster comment
avatars_with_comment = (
    "  /* Canonical demo roster (DEMO_ID_BASE=2): ids 0 and 1 reserved for real Labradors.\n"
    "   * Stable ids: Cardbrador=2 ... SnackBandit=18 ... BarkBroker=23. Never reshuffle.\n"
    "   */\n" + avatars_js()
)
seed = seed[:m.start()] + avatars_with_comment + seed[m.end():]

# Expand clearLegacyDemoBand to clear 0..22 (old base-1 roster + free slots)
old_clear = """      (function clearLegacyDemoBand() {
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
      })();"""
new_clear = """      (function clearLegacyDemoBand() {
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
      })();"""
seed = must_replace(seed, old_clear, new_clear, "clearLegacyDemoBand")

# Replace migrateDemoOffZero with one-shot + name-based repair
old_migrate_start = "  // Migrate leftover low-band (0-21) demo NPCs to 1+ so id 0 stays free for the first real Labrador.\n  (function migrateDemoOffZero() {"
idx = seed.find(old_migrate_start)
if idx < 0:
    raise SystemExit("migrateDemoOffZero start not found")
# find closing of IIFE:  })();\n\n  var demos =
end_marker = "\n  })();\n\n  var demos = ["
end = seed.find(end_marker, idx)
if end < 0:
    raise SystemExit("migrate end / demos not found")

name_to_id = ",\n      ".join([f'{name}: "{oid}"' for oid, name, *_ in ROSTER])

new_migrate_and_demos = f'''  // One-shot only (when SEED_VERSION bumps): move leftover low-band demos into 2-23.
  // Ids 0 and 1 stay free for real Labradors (DEMO_ID_BASE=2).
  if (needReseed) (function migrateDemoOffZero() {{
    var sid = "";
    try {{ sid = String(localStorage.getItem("currentUserId") || ""); }} catch (e) {{}}
    var NAME_TO_ID = {{
      {name_to_id}
    }};
    function looksDemo(u) {{
      if (!u || typeof u !== "object") return false;
      if (u.demo === true) return true;
      var name = u.username || u.displayName || "";
      if (NAME_TO_ID[name] && !u.uid && !u.firebaseUid) return true;
      return false;
    }}
    function moveKey(prefix, oldId, newId) {{
      var raw = localStorage.getItem(prefix + oldId);
      if (!raw) return;
      if (!localStorage.getItem(prefix + newId)) {{
        try {{
          if (prefix === "user_" || prefix === "profile_") {{
            var o = JSON.parse(raw);
            o.demo = true;
            if (prefix === "profile_") o.id = newId;
            localStorage.setItem(prefix + newId, JSON.stringify(o));
          }} else {{
            localStorage.setItem(prefix + newId, raw);
          }}
        }} catch (e) {{
          localStorage.setItem(prefix + newId, raw);
        }}
      }}
      localStorage.removeItem(prefix + oldId);
    }}
    for (var i = 0; i <= 21; i++) {{
      var oldId = String(i);
      var newId = String(DEMO_ID_BASE + i);
      if (sid && sid === oldId) continue;
      var rawU = localStorage.getItem("user_" + oldId);
      if (!rawU) {{
        var rawP = localStorage.getItem("profile_" + oldId);
        if (rawP) {{
          try {{
            var p = JSON.parse(rawP);
            var pname = (p && (p.displayName || p.handle)) || "";
            var dest = (p && NAME_TO_ID[p.displayName]) || newId;
            if (p && (p.demo === true || NAME_TO_ID[p.displayName || ""])) {{
              moveKey("profile_", oldId, dest);
              moveKey("pfp_", oldId, dest);
              moveKey("friends_", oldId, dest);
            }}
          }} catch (e) {{}}
        }}
        continue;
      }}
      var u = {{}};
      try {{ u = JSON.parse(rawU); }} catch (e) {{ continue; }}
      if (!looksDemo(u)) continue;
      var destId = NAME_TO_ID[u.displayName || u.username || ""] || newId;
      moveKey("user_", oldId, destId);
      moveKey("profile_", oldId, destId);
      moveKey("pfp_", oldId, destId);
      moveKey("friends_", oldId, destId);
    }}
  }})();

  // Repair: force post/reply userIds to canonical roster ids by username, rewrite pfp/user/profile for 2-23.
  // Runs only on SEED_VERSION bump (with needReseed), so refresh does not reshuffle.
  if (needReseed) (function repairDemoRosterIds() {{
    var NAME_TO_ID = {{
      {name_to_id}
    }};
    function canonFromName(name) {{
      var n = String(name || "").trim();
      return NAME_TO_ID[n] || "";
    }}
    function walkFix(node) {{
      if (!node) return false;
      var changed = false;
      var want = canonFromName(node.username || node.displayName || "");
      if (want && String(node.userId || "") !== want) {{
        node.userId = want;
        changed = true;
      }}
      if (Array.isArray(node.yeahs)) {{
        // yeahs are ids; leave alone unless we only know names (ids repaired via posts)
      }}
      if (Array.isArray(node.replies)) {{
        node.replies.forEach(function (r) {{ if (walkFix(r)) changed = true; }});
      }}
      return changed;
    }}
    try {{
      for (var pi = 0; pi < localStorage.length; pi++) {{
        var pk = localStorage.key(pi);
        if (!pk || pk.indexOf("posts_") !== 0) continue;
        var list = JSON.parse(localStorage.getItem(pk) || "[]");
        if (!Array.isArray(list)) continue;
        var changed = false;
        list.forEach(function (post) {{ if (walkFix(post)) changed = true; }});
        if (changed) localStorage.setItem(pk, JSON.stringify(list));
      }}
    }} catch (e) {{}}
    // Rewrite pfp_/user_/profile_ for canonical 2-23 from seed roster (demos array applied below also fills gaps).
    Object.keys(NAME_TO_ID).forEach(function (name) {{
      var id = NAME_TO_ID[name];
      var avatar = AVATARS[id] || "/users/default/pfp.jpg";
      localStorage.setItem("pfp_" + id, avatar);
      try {{
        var u = JSON.parse(localStorage.getItem("user_" + id) || "{{}}");
        u.username = name;
        u.displayName = name;
        u.profilePicture = avatar;
        u.demo = true;
        localStorage.setItem("user_" + id, JSON.stringify(u));
      }} catch (e) {{
        localStorage.setItem("user_" + id, JSON.stringify({{
          username: name, displayName: name, profilePicture: avatar, demo: true
        }}));
      }}
      try {{
        var p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {{}};
        p.id = id;
        p.displayName = name;
        p.avatar = avatar;
        p.demo = true;
        if (!p.handle) p.handle = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
        localStorage.setItem("profile_" + id, JSON.stringify(p));
      }} catch (e) {{}}
    }});
  }})();

{demos_js()}
'''

# demos block currently starts at end marker - we need to skip old demos array through `];`
demos_end = seed.find("\n  ];\n  demos.forEach", end)
if demos_end < 0:
    raise SystemExit("demos array end not found")
# Keep from demos.forEach onward
rest = seed[demos_end + len("\n  ];"):]  # starts with "\n  demos.forEach..."
seed = seed[:idx] + new_migrate_and_demos + rest

# Fix friend list remap: only bump ids below DEMO_ID_BASE
seed = must_replace(
    seed,
    """        if (/^\\d+$/.test(s)) {
          var n = parseInt(s, 10);
          if (n >= 0 && n <= 21) s = String(DEMO_ID_BASE + n);
        }""",
    """        if (/^\\d+$/.test(s)) {
          var n = parseInt(s, 10);
          // Only lift true legacy ids below DEMO_ID_BASE (0 and 1 stay reserved / remapped once).
          if (n >= 0 && n < DEMO_ID_BASE) s = String(DEMO_ID_BASE + n);
        }""",
    "friend remapList",
)

# authors in chaotic replies - bump SnackBandit etc
old_authors = '''    var authors = [
      { id: "15", name: "PantsWetterLabrador" },
      { id: "2", name: "BeeSid" },
      { id: "13", name: "CoolDog" },
      { id: "4", name: "GyattToad" },
      { id: "17", name: "SnackBandit" },
      { id: "18", name: "BarTabby" },
      { id: "1", name: "Cardbrador" }
    ];'''
new_authors = '''    var authors = [
      { id: "16", name: "PantsWetterLabrador" },
      { id: "3", name: "BeeSid" },
      { id: "14", name: "CoolDog" },
      { id: "5", name: "GyattToad" },
      { id: "18", name: "SnackBandit" },
      { id: "19", name: "BarTabby" },
      { id: "2", name: "Cardbrador" }
    ];'''
seed = must_replace(seed, old_authors, new_authors, "chaotic authors")

# Bump hardcoded userIds/yeahs in seed post literals (old 1-22 -> 2-23)
# Do this carefully: only on the portion before demos.forEach... actually whole file after AVATARS
# Authors already updated. demos already new ids. Don't bump demos ids again.
# Apply bump only to sections that still have old ids - post seed blocks.
seed = bump_seed_ids_in_posts_block(seed)

# After bump, demos ids would have been bumped if they were "2"->"3" etc - BAD.
# demos_js already wrote correct 2-23. bump_seed_ids would bump them to 3-24!
# Re-assert demos block is correct by replacing demos array again.

m2 = re.search(r"  var demos = \[.*?\n  \];", seed, re.S)
if not m2:
    raise SystemExit("demos block missing after edits")
seed = seed[:m2.start()] + demos_js() + seed[m2.end():]

# Re-assert authors (bump may have changed them)
if new_authors not in seed:
    # try find and replace whatever authors are there
    m3 = re.search(r"    var authors = \[.*?\n    \];", seed, re.S)
    if not m3:
        raise SystemExit("authors missing")
    seed = seed[:m3.start()] + new_authors + seed[m3.end():]

# Re-assert AVATARS (bump shouldn't touch URLs but keys if any userId pattern - AVATARS uses "2": url - bump_userid only matches userId:)
# yeahs bump is fine. map bump is fine.

seed_path.write_text(seed, encoding="utf-8")
print("OK seed-demo.js")

# Verify key facts
assert 'SEED_VERSION = "17"' in seed
assert "DEMO_ID_BASE = 2" in seed
assert 'id: "18", displayName: "SnackBandit"' in seed
assert 'id: "23", displayName: "BarkBroker"' in seed
assert "if (needReseed) (function migrateDemoOffZero()" in seed
assert "if (needReseed) (function repairDemoRosterIds()" in seed
assert 'userId: "2"' in seed  # Cardbrador post
print("VERIFY seed-demo OK")
print("SnackBandit id:", "18")
