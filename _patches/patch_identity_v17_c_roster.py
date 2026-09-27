# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]: {old[:180]!r}")
    return text.replace(old, new, 1)

AVATARS_2_23 = '''  /* Fallback keys match canonical demo roster ids "2".."23" (CB_DEMO_AVATARS). */
  var DEMO_AVATARS = {
    "2": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "3": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "4": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "5": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "6": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "7": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "8": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "9": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "10": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "11": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "12": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "13": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "14": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "15": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png",
    "16": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "17": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "18": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "19": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "20": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "21": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "22": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "23": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"
  };'''

SEED_NAMES_2_23 = '''      "2": "Cardbrador", "3": "BeeSid", "4": "Miguel", "5": "GyattToad",
      "6": "AnthonySpade", "7": "Barcat", "8": "EvilRobot", "9": "AbovegroundBro",
      "10": "NerdDog", "11": "OrangeTabby", "12": "EvilKid23", "13": "NoFilterBro",
      "14": "CoolDog", "15": "ANIMEGIRL", "16": "PantsWetterLabrador", "17": "RhombusRex",
      "18": "SnackBandit", "19": "BarTabby", "20": "PuddlePirate", "21": "TreatTaxer",
      "22": "SofaThief", "23": "BarkBroker"'''

# ---- posts.js ----
posts_path = ROOT / "js" / "posts.js"
posts = posts_path.read_text(encoding="utf-8")

# Replace DEMO_AVATARS block (phase1 wrote 1-22)
m = re.search(r"  /\* Fallback keys match canonical demo roster.*?  \};|  var DEMO_AVATARS = \{.*?\n  \};", posts, re.S)
if not m:
    raise SystemExit("posts DEMO_AVATARS not found")
posts = posts[:m.start()] + AVATARS_2_23 + posts[m.end():]

posts = must_replace(
    posts,
    "// Use id string as AVATARS key (roster is \"1\"..\"22\"; do not n-1 remap).",
    "// Use id string as AVATARS key (roster is \"2\"..\"23\"; do not n-1 remap).",
    "getPfp comment",
)

posts = must_replace(
    posts,
    "var base = (global.CB_DEMO_ID_BASE != null) ? Number(global.CB_DEMO_ID_BASE) : 1;",
    "var base = (global.CB_DEMO_ID_BASE != null) ? Number(global.CB_DEMO_ID_BASE) : 2;",
    "posts base default",
)

posts = must_replace(
    posts,
    "// Stable roster names (SnackBandit=17, BarkBroker=22).\n    var seedNames = {\n      \"1\": \"Cardbrador\", \"2\": \"BeeSid\", \"3\": \"Miguel\", \"4\": \"GyattToad\",\n      \"5\": \"AnthonySpade\", \"6\": \"Barcat\", \"7\": \"EvilRobot\", \"8\": \"AbovegroundBro\",\n      \"9\": \"NerdDog\", \"10\": \"OrangeTabby\", \"11\": \"EvilKid23\", \"12\": \"NoFilterBro\",\n      \"13\": \"CoolDog\", \"14\": \"ANIMEGIRL\", \"15\": \"PantsWetterLabrador\", \"16\": \"RhombusRex\",\n      \"17\": \"SnackBandit\", \"18\": \"BarTabby\", \"19\": \"PuddlePirate\", \"20\": \"TreatTaxer\",\n      \"21\": \"SofaThief\", \"22\": \"BarkBroker\"\n    };",
    "// Stable roster names (SnackBandit=18, BarkBroker=23; DEMO_ID_BASE=2).\n    var seedNames = {\n" + SEED_NAMES_2_23 + "\n    };",
    "posts seedNames",
)
posts_path.write_text(posts, encoding="utf-8")
print("OK posts.js")

# ---- layout.js ----
layout_path = ROOT / "js" / "layout.js"
layout = layout_path.read_text(encoding="utf-8")

layout = must_replace(
    layout,
    """        // Real Labrador ids stay below demo band 1+
        if (n >= 0 && n < 1 && n > max) max = n;""",
    """        // Real Labrador ids stay below DEMO_ID_BASE (0 and 1 free when base is 2).
        var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
        if (n >= 0 && n < demoBase && n > max) max = n;""",
    "allocatePublicUserId",
)

old_dns = '''  /* Canonical demo roster ids "1".."22" (SnackBandit=17, BarkBroker=22). */
  var DEMO_SEED_NAMES = {
    "1": "Cardbrador", "2": "BeeSid", "3": "Miguel", "4": "GyattToad", "5": "AnthonySpade",
    "6": "Barcat", "7": "EvilRobot", "8": "AbovegroundBro", "9": "NerdDog", "10": "OrangeTabby",
    "11": "EvilKid23", "12": "NoFilterBro", "13": "CoolDog", "14": "ANIMEGIRL",
    "15": "PantsWetterLabrador", "16": "RhombusRex", "17": "SnackBandit", "18": "BarTabby",
    "19": "PuddlePirate", "20": "TreatTaxer", "21": "SofaThief", "22": "BarkBroker"
  };'''

new_dns = '''  /* Canonical demo roster ids "2".."23" (SnackBandit=18, BarkBroker=23; 0-1 reserved). */
  var DEMO_SEED_NAMES = {
    "2": "Cardbrador", "3": "BeeSid", "4": "Miguel", "5": "GyattToad", "6": "AnthonySpade",
    "7": "Barcat", "8": "EvilRobot", "9": "AbovegroundBro", "10": "NerdDog", "11": "OrangeTabby",
    "12": "EvilKid23", "13": "NoFilterBro", "14": "CoolDog", "15": "ANIMEGIRL",
    "16": "PantsWetterLabrador", "17": "RhombusRex", "18": "SnackBandit", "19": "BarTabby",
    "20": "PuddlePirate", "21": "TreatTaxer", "22": "SofaThief", "23": "BarkBroker"
  };'''
layout = must_replace(layout, old_dns, new_dns, "DEMO_SEED_NAMES")

layout = layout.replace(
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;",
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;",
)
layout = layout.replace(
    "// Only lift true legacy ids below DEMO_ID_BASE (id \"0\" when base is 1).",
    "// Only lift true legacy ids below DEMO_ID_BASE (0/1 reserved when base is 2).",
)
layout_path.write_text(layout, encoding="utf-8")
print("OK layout.js")

# ---- home.js ----
home_path = ROOT / "js" / "home.js"
home = home_path.read_text(encoding="utf-8")
home = home.replace(
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;",
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;",
)
old_home_seeds = '''        var seedNames = {
          "1":"Cardbrador","2":"BeeSid","3":"Miguel","4":"GyattToad","5":"AnthonySpade",
          "6":"Barcat","7":"EvilRobot","8":"AbovegroundBro","9":"NerdDog","10":"OrangeTabby",
          "11":"EvilKid23","12":"NoFilterBro","13":"CoolDog","14":"ANIMEGIRL",
          "15":"PantsWetterLabrador","16":"RhombusRex","17":"SnackBandit","18":"BarTabby",
          "19":"PuddlePirate","20":"TreatTaxer","21":"SofaThief","22":"BarkBroker"
        };'''
new_home_seeds = '''        var seedNames = {
          "2":"Cardbrador","3":"BeeSid","4":"Miguel","5":"GyattToad","6":"AnthonySpade",
          "7":"Barcat","8":"EvilRobot","9":"AbovegroundBro","10":"NerdDog","11":"OrangeTabby",
          "12":"EvilKid23","13":"NoFilterBro","14":"CoolDog","15":"ANIMEGIRL",
          "16":"PantsWetterLabrador","17":"RhombusRex","18":"SnackBandit","19":"BarTabby",
          "20":"PuddlePirate","21":"TreatTaxer","22":"SofaThief","23":"BarkBroker"
        };'''
home = must_replace(home, old_home_seeds, new_home_seeds, "home seedNames")
# pack loop was 0..13 with base+i -> should be 0..21 for full roster or keep ~14 friends; leave as-is (uses base)
home_path.write_text(home, encoding="utf-8")
print("OK home.js")

# ---- profile.js ----
prof_path = ROOT / "js" / "profile.js"
prof = prof_path.read_text(encoding="utf-8")
m = re.search(r"  var DEMO_AVATARS = \{.*?\n  \};", prof, re.S)
if not m:
    raise SystemExit("profile DEMO_AVATARS missing")
prof_avatars = AVATARS_2_23.replace("  /* Fallback keys match canonical demo roster ids \"2\"..\"23\" (CB_DEMO_AVATARS). */\n  ", "  ")
prof = prof[:m.start()] + prof_avatars + prof[m.end():]
prof = must_replace(
    prof,
    "// Roster keys are already \"1\"..\"22\"; no n-1 remap.",
    "// Roster keys are already \"2\"..\"23\"; no n-1 remap.",
    "profile band comment",
)
prof = prof.replace(
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 1;",
    "var base = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;",
)
prof_path.write_text(prof, encoding="utf-8")
print("OK profile.js")

# ---- notifications.js SnackBandit id ----
notif_path = ROOT / "js" / "notifications.js"
notif = notif_path.read_text(encoding="utf-8")
if 'fromUserId: "16", fromName: "SnackBandit"' in notif:
    notif = notif.replace('fromUserId: "16", fromName: "SnackBandit"', 'fromUserId: "18", fromName: "SnackBandit"')
    notif_path.write_text(notif, encoding="utf-8")
    print("OK notifications.js SnackBandit -> 18")
elif 'fromUserId: "17", fromName: "SnackBandit"' in notif:
    notif = notif.replace('fromUserId: "17", fromName: "SnackBandit"', 'fromUserId: "18", fromName: "SnackBandit"')
    notif_path.write_text(notif, encoding="utf-8")
    print("OK notifications.js SnackBandit 17 -> 18")
else:
    print("NOTE notifications SnackBandit line not found or already ok")

print("PASS phase B companion files")
