# -*- coding: utf-8 -*-
"""Rework NEW BeeSid Miiverse posts (~35). Keep older 13 unchanged."""
import json
import shutil
from datetime import datetime
from pathlib import Path

SITE = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
BOARD = SITE / "data" / "boards" / "BeeSid.json"
BAK_PRE = SITE / "data" / "boards" / "BeeSid.json.bak_pre_miiverse_posts_20260926_113422"

# Authentic Miiverse comment species (Alan research). Light Chipper/tennis/lair flavor OK.
# Dial DOWN pure Roblox don8 spam. No em dashes. Misspellings OK. Funny silly kid absurd.
REWORK = {
    # --- 1 trauma dump mid-praise ---
    "1785636000000": "chipper is so fun but my parents yelled at me for 40 minutes cuz i spilled juice on the router",
    "1785654000000": "game is actually really good. also my dog ate my homework and then my sister blamed me. coolbrador rules tho",
    "1785697200000": "love the beesid lair vibes. got grounded cuz i did the chipper dance during math. worth it? idk my room smells like socks",
    "1785726000000": "this boss fight is epic but i hate my parents rn they took my 3DS for a week for no reason (ok there was a reason)",
    "1785733200000": "chipper ur game healed me a little. my lunch got stolen again. i just want an avocado and peace",
    "1785744000000": "beesid lair is my happy place. home is loud. dad keeps yelling about the thermostat. tennis balls would help my mental",

    # --- 2 smash-stage celebrity yell ---
    "1785646800000": "CHIPPER LOOK OVER HERE!!!! i am waving so hard my arm fell off (figuratively). NOTICE ME ON THE STAGE",
    "1785675600000": "i drew you but the marker ran and now you look EVIL. please dont sue me im 11 and my markers are wet",
    "1785686400000": "DAD SAYS UR NOT FAMOUS. DAD IS WRONG. CHIPPER YELL AT MY DAD RIGHT NOW HE IS IN THE KITCHEN",
    "1785690000000": "CHIPPERRRRRR notice meeee im your #1 fan in all of labradoria i practiced the wave for 3 hours",
    "1785754800000": "CHIPPER !!1!1!! WAKE UP are u AFK in the boss arena??? i have been screaming into this post for DAYS",
    "1785657600000": "HEY CHIPPER ITS ME AGAIN from coolbrador. LOOK AT THIS POST. LOOK. LOOK AT IT. im right here",

    # --- 3 lonely friend-request spam ---
    "1785700800000": "can we be best friends forever?? add me as a friend not just a yeah. my friend code is in my dreams i forgot it",
    "1785661200000": "anybody from east labradoria wanna be friends??? i have zero friends on here and my sister doesnt count",
    "1785711600000": "please be my miiverse friend i will share bacon recipes and bee tips. serious replies only not just yeahs",
    "1785672000000": "HELLO my name is Rodriguez and i am lonely on this board. friend request me. i wont bite. probably",
    "1785747600000": "looking for 1 (one) real friend who likes labradors and tennis balls. yeahs dont count as friendship sorry",
    "1785758400000": "pls join my fanclub we meet behind the crates in east labradoria. bring snacks. leave loneliness at home",

    # --- 4 bad drawing / rate my thing ---
    "1785664800000": "i drew tennis balls with my finger on the touchscreen. rate my art 1-10 be honest but also be nice",
    "1785682800000": "rate my chipper doodle!!! it looks like a potato with legs but the vibes are correct i swear",
    "1785718800000": "chipepr :) wait i ment chipper. my drawing tablet is a napkin. rate the napkin art pls",
    "1785722400000": "rhombus said my drawing of the beesid lair was \"interesting\". what does that MEAN. rate it strangers",
    "1785736800000": "i made a comic where chipper fights a fridge. page 1 only. rate my panels before i cry",
    "1785751200000": "writing a picture book in my head. chapter 1 beesid lair. chapter 2 balls. rate my plot before i draw it wrong",

    # --- 5 address / identity dump ---
    "1785668400000": "hi im from east labradoria zip code 00BEE next to the weird mailbox shaped like a shoe. anyone else??",
    "1785679200000": "my hometown is Behind-The-Crates Labradoria. population: me, a raccoon, and 2 tennis balls",
    "1785704400000": "if ur looking for me i live at 14 Bee Avenue apt B (the B stands for beesid). knock thrice and say balls",
    "1785729600000": "identity dump: name Sammy, age idk, town East Labradoria, hobbies: selling brothers toys for coolbrador merch",
    "1785643200000": "calling all kids from North Labrador Cul-de-sac. my house is the one with the broken trampoline. wave if ur real",
    "1785693600000": "Ffgfddfffhhght is my hometown name trust me. google maps wont show it cuz its behind the beesid lair wifi router",

    # --- 6 parasocial micro-celeb ---
    "1785639600000": "OMG its CHIPPER on the game board i cant breathe. miss the old you from before the tennis ball arc tho",
    "1785650400000": "chipper remembered my comment once in 2014 (in my head). showing off my screenshot of nothing. im famous now",
    "1785708000000": "chipper do u talk??? hellloooo??? beesid lair wifi bad but my devotion is fiber optic speed",
    "1785715200000": "DAY 12 of existing near chipper content. i am basically a side character now. miss when it was just us",
    "1785740400000": "this post is my new personality. also OMG chipper if u read this i wore my coolbrador shirt to school today",
}

def main():
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = BOARD.with_suffix(f".json.bak_pre_miiverse_rework_{stamp}")
    shutil.copy2(BOARD, bak)
    print(f"backup -> {bak.name}")

    board = json.loads(BOARD.read_text(encoding="utf-8"))
    old_ids = {p["id"] for p in json.loads(BAK_PRE.read_text(encoding="utf-8"))["posts"]}

    changed = 0
    skipped_old = 0
    missing = []
    for p in board["posts"]:
        pid = str(p["id"])
        if pid in old_ids or p["id"] in old_ids:
            skipped_old += 1
            continue
        if pid not in REWORK:
            missing.append(pid)
            continue
        new_body = REWORK[pid]
        if "\u2014" in new_body or "\u2013" in new_body:
            raise SystemExit(f"em dash in {pid}")
        p["text"] = new_body
        p["body"] = new_body
        changed += 1

    if missing:
        raise SystemExit(f"NEW posts missing rework: {missing}")
    if changed != 35:
        raise SystemExit(f"expected 35 reworks, got {changed}")

    # bump version for cache bust / feed meta
    try:
        board["version"] = int(board.get("version") or 6) + 1
    except (TypeError, ValueError):
        board["version"] = 7
    meta = board.setdefault("meta", {})
    meta["note"] = (
        "Chipper Game Board posts. Feed yeahs/likes/views are derived from this file. "
        "Miiverse-style text posts reworked 2026-09-26 (trauma/smash/lonely/draw/address/parasocial)."
    )
    meta["miiverseReworkAt"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    BOARD.write_text(json.dumps(board, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"reworked {changed} NEW posts; left {skipped_old} OLD unchanged; version={board['version']}")

    # verify old bodies untouched
    old_check = [
        "DIED TO THE SAME FIRE",
        "Its Great To Bee Sid",
        "WARNING ALL MOMS",
    ]
    bodies = "\n".join((p.get("text") or "") for p in board["posts"])
    for needle in old_check:
        if needle not in bodies:
            raise SystemExit(f"OLD post missing: {needle}")
    print("old tone-switch posts still present: OK")

    # print samples of reworked
    new_posts = [p for p in board["posts"] if str(p["id"]) not in {str(x) for x in old_ids} and p["id"] not in old_ids]
    print("--- samples ---")
    for p in new_posts[:5]:
        print(p["id"], "|", p["text"][:100])

if __name__ == "__main__":
    main()
