# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]")
    return text.replace(old, new, 1)

# profile.js defaultProfile demos
prof_path = ROOT / "js" / "profile.js"
prof = prof_path.read_text(encoding="utf-8")
old_demos = '''  function defaultProfile(id) {
    var demos = {
      "0": { displayName: "Cardbrador", handle: "cardbrador", bio: "Welcome aboard.", about: "Official-ish demo pup." },
      "1": { displayName: "BeeSid", handle: "beesid", bio: "Rhombus enjoyer.", about: "Lives in the header glow." },
      "2": { displayName: "Miguel", handle: "miguel", bio: "Mutiny correspondent.", about: "Keeps receipts." },
      "3": { displayName: "GyattToad", handle: "gyatttoad", bio: "Pitch machine.", about: "Ideas tab forever." },
      "4": { displayName: "AnthonySpade", handle: "anthonyspade", bio: "Gift drive booster.", about: "Stockings full of rhombuses." },
      "5": { displayName: "Barcat", handle: "barcat", bio: "Lounge lookout.", about: "Always on the rail." },
      "6": { displayName: "EvilRobot", handle: "evilrobot", bio: "Beep boop menace.", about: "Mostly jokes." },
      "7": { displayName: "AbovegroundBro", handle: "abovegroundbro", bio: "Above-ground vibes.", about: "Test mesh enjoyer." },
      "8": { displayName: "NerdDog", handle: "nerddog", bio: "Specs and snacks.", about: "8x the polish." },
      "9": { displayName: "OrangeTabby", handle: "orangetabby", bio: "Triple leverage vibes.", about: "Charts and stars." },
      "10": { displayName: "EvilKid23", handle: "evilkids23", bio: "Spooky soft launch.", about: "Friendly haunt." },
      "11": { displayName: "NoFilterBro", handle: "nofilterbro", bio: "Raw feed only.", about: "What you see is what you get." },
      "12": { displayName: "CoolDog", handle: "cooldog", bio: "Cool by default.", about: "Name is the vibe." },
      "13": { displayName: "ANIMEGIRL", handle: "animegirl", bio: "Main character energy.", about: "Frame-perfect poses." },
      guest: { displayName: "Guest", handle: "guest", bio: "Just looking around.", about: "Log in to claim a cooler profile." }
    };
    var band = demoBandKey(id);
    var base = demos[id] || demos[band] || {'''

new_demos = '''  function defaultProfile(id) {
    // Canonical roster 2-23 (0/1 reserved for real Labradors). SnackBandit=18, BarkBroker=23.
    var demos = {
      "2": { displayName: "Cardbrador", handle: "cardbrador", bio: "Welcome aboard.", about: "Official-ish demo pup." },
      "3": { displayName: "BeeSid", handle: "beesid", bio: "Rhombus enjoyer.", about: "Lives in the header glow." },
      "4": { displayName: "Miguel", handle: "miguel", bio: "Mutiny correspondent.", about: "Keeps receipts." },
      "5": { displayName: "GyattToad", handle: "gyatttoad", bio: "Pitch machine.", about: "Ideas tab forever." },
      "6": { displayName: "AnthonySpade", handle: "anthonyspade", bio: "Gift drive booster.", about: "Stockings full of rhombuses." },
      "7": { displayName: "Barcat", handle: "barcat", bio: "Lounge lookout.", about: "Always on the rail." },
      "8": { displayName: "EvilRobot", handle: "evilrobot", bio: "Beep boop menace.", about: "Mostly jokes." },
      "9": { displayName: "AbovegroundBro", handle: "abovegroundbro", bio: "Above-ground vibes.", about: "Test mesh enjoyer." },
      "10": { displayName: "NerdDog", handle: "nerddog", bio: "Specs and snacks.", about: "8x the polish." },
      "11": { displayName: "OrangeTabby", handle: "orangetabby", bio: "Triple leverage vibes.", about: "Charts and stars." },
      "12": { displayName: "EvilKid23", handle: "evilkids23", bio: "Spooky soft launch.", about: "Friendly haunt." },
      "13": { displayName: "NoFilterBro", handle: "nofilterbro", bio: "Raw feed only.", about: "What you see is what you get." },
      "14": { displayName: "CoolDog", handle: "cooldog", bio: "Cool by default.", about: "Name is the vibe." },
      "15": { displayName: "ANIMEGIRL", handle: "animegirl", bio: "Main character energy.", about: "Frame-perfect poses." },
      "16": { displayName: "PantsWetterLabrador", handle: "pantswetter", bio: "Hydration is a lifestyle.", about: "Check your pants." },
      "17": { displayName: "RhombusRex", handle: "rhombusrex", bio: "Angles only.", about: "Header glow fan." },
      "18": { displayName: "SnackBandit", handle: "snackbandit", bio: "Treat heist specialist.", about: "Will work for biscuits." },
      "19": { displayName: "BarTabby", handle: "bartabby", bio: "Bar shifts and soft paws.", about: "Speed is kindness." },
      "20": { displayName: "PuddlePirate", handle: "puddlepirate", bio: "Splash tax collector.", about: "Boots optional." },
      "21": { displayName: "TreatTaxer", handle: "treattaxer", bio: "IRS of snacks.", about: "Pay the biscuit." },
      "22": { displayName: "SofaThief", handle: "sofathief", bio: "Cushion conqueror.", about: "Your seat is my seat." },
      "23": { displayName: "BarkBroker", handle: "barkbroker", bio: "Market of woofs.", about: "Bullish on pets." },
      guest: { displayName: "Guest", handle: "guest", bio: "Just looking around.", about: "Log in to claim a cooler profile." }
    };
    var base = demos[id] || {'''

prof = must_replace(prof, old_demos, new_demos, "defaultProfile demos")
prof_path.write_text(prof, encoding="utf-8")
print("OK profile defaultProfile")

# layout allocatePublicUserId: first free slot in [0, demoBase)
layout_path = ROOT / "js" / "layout.js"
layout = layout_path.read_text(encoding="utf-8")
old_alloc = '''  function allocatePublicUserId() {
    var max = -1;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("user_") !== 0) continue;
        var id = key.slice(5);
        if (!/^\\d+$/.test(id)) continue;
        var n = parseInt(id, 10);
        // Real Labrador ids stay below DEMO_ID_BASE (0 and 1 free when base is 2).
        var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
        if (n >= 0 && n < demoBase && n > max) max = n;
      }
    } catch (_) {}
    return String(max + 1);
  }'''

new_alloc = '''  function allocatePublicUserId() {
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

layout = must_replace(layout, old_alloc, new_alloc, "allocatePublicUserId")
layout_path.write_text(layout, encoding="utf-8")
print("OK allocatePublicUserId")

# Verify seed userIds
seed = (ROOT / "js" / "seed-demo.js").read_text(encoding="utf-8")
ids = re.findall(r'userId:\s*"(\d+)"', seed)
print("seed userIds unique sorted:", sorted(set(ids), key=int))
yeahs = re.findall(r'yeahs:\s*\[([^\]]*)\]', seed)
print("sample yeahs:", yeahs[:5])

# Ensure no n-1 getPfp
posts = (ROOT / "js" / "posts.js").read_text(encoding="utf-8")
assert "band = String(n - 1)" not in posts
assert "CB_DEMO_AVATARS[key]" in posts
assert 'SEED_VERSION = "17"' in seed
assert "DEMO_ID_BASE = 2" in seed
css = (ROOT / "styles.css").read_text(encoding="utf-8")
assert ".post-thread-page .post-thread-main { max-width: 800px;" in css
assert "max-width: 800px;\n  margin-left: auto;\n  margin-right: auto;\n}" in css or "post-thread-replies-wrap" in css
print("FINAL CHECKS OK")
