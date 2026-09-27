# -*- coding: utf-8 -*-
import os, shutil, time
ROOT = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
path = os.path.join(ROOT, "b", "GiftDrive", "board.html")
stamp = time.strftime("%Y%m%d_%H%M%S")
shutil.copy2(path, path + ".bak_" + stamp)
with open(path, "r", encoding="utf-8", errors="replace") as f:
    t = f.read()
if "cb-coming-soon-overlay" not in t:
    t = t.replace(
        '<section class="container bodytext-section board-main">',
        '<section class="container bodytext-section board-main cb-coming-soon-wrap" style="position:relative;">\n    <div class="cb-coming-soon-overlay"><span>Coming soon</span></div>',
        1,
    )
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)
    print("GiftDrive board overlay added")
else:
    print("already present")

# Also soft-disable create post interactions via pointer-events on wrap - CSS already does that
# Verify profile.js paint refresh won't break when isOwn early return skipped block wiring - block buttons are before isOwn return. Good.

# Double-check layout: renderLoginLinks still calls updateSidebarProfile(null) which should mark signed-out
layout = open(os.path.join(ROOT, "js", "layout.js"), encoding="utf-8").read()
assert "function hasLocalSession" in layout
assert "wireSidebarUserMenu" in layout
assert "CoolbradorSession = { isSignedIn, hasLocalSession" in layout
print("asserts ok")
