from pathlib import Path
ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
p = ROOT / "js" / "layout.js"
t = p.read_text(encoding="utf-8")
needle = "      // Preserve real firebase/session fields; strip demo flag."
if "cacheName" in t and "seedName && curName === seedName" in t:
    print("already patched")
else:
    old = """      var fb = \"\";\n      try { fb = String(localStorage.getItem(\"firebaseUid\") || \"\"); } catch (_) {}\n      // Preserve real firebase/session fields; strip demo flag.\n      delete u.demo;\n      delete p.demo;\n      if (fb) {\n        u.uid = u.uid || fb;\n        u.firebaseUid = u.firebaseUid || fb;\n      }\n      if (!u.username && !u.displayName) {\n        u.username = \"Labrador\";\n        u.displayName = \"Labrador\";\n      }\n      p.id = newId;\n      p.displayName = p.displayName || u.displayName || u.username || \"Labrador\";"""
    new = """      var fb = \"\";\n      try { fb = String(localStorage.getItem(\"firebaseUid\") || \"\"); } catch (_) {}\n      var cacheName = \"\";\n      try {\n        var cache = readAuthChromeCache();\n        if (cache && cache.username) cacheName = String(cache.username);\n      } catch (_) {}\n      // Preserve real firebase/session fields; strip demo flag.\n      delete u.demo;\n      delete p.demo;\n      if (fb) {\n        u.uid = u.uid || fb;\n        u.firebaseUid = u.firebaseUid || fb;\n      }\n      var seedName = DEMO_SEED_NAMES[safe] || \"\";\n      var curName = u.displayName || u.username || p.displayName || \"\";\n      if (seedName && curName === seedName) {\n        curName = cacheName || \"Labrador\";\n        u.username = curName;\n        u.displayName = curName;\n        p.displayName = curName;\n      }\n      if (!u.username && !u.displayName) {\n        u.username = cacheName || \"Labrador\";\n        u.displayName = cacheName || \"Labrador\";\n      }\n      p.id = newId;\n      p.displayName = p.displayName || u.displayName || u.username || cacheName || \"Labrador\";"""
    if old not in t:
        raise SystemExit("MISSING block")
    p.write_text(t.replace(old, new, 1), encoding="utf-8")
    print("OK name restore")
