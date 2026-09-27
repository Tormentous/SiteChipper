from pathlib import Path
ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
checks = {
  "js/layout.js": ["ensureSessionNotDemo", "inDemoBand", 'title: "Cardbrador", id: "2"', "slotTakenByReal", 'title: "BeeSid", id: "3"'],
  "js/seed-demo.js": ['SEED_VERSION = "18"', "detachSessionFromDemoBand", "Never overwrite the signed-in"],
  "js/posts.js": ["post-avatar-col", "fa-regular fa-image", "tool-btn-video", "bindMediaPicker"],
  "js/messages.js": ['SEED_VER = "4"', "threadDisplayTitle", "group_chipper", "openGroupEdit", "Chipper Corner"],
  "styles-profile.css": ["clip-path: polygon(12% 0%"],
  "styles.css": ["post-avatar-col", "cb-msg-group-edit-btn", "border-radius: 999px"],
}
for rel, need in checks.items():
  t = (ROOT / rel).read_text(encoding="utf-8")
  miss = [n for n in need if n not in t]
  print(("OK" if not miss else "MISS"), rel, miss)
