# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
path = ROOT / "js" / "seed-demo.js"
seed = path.read_text(encoding="utf-8")
old = """  demos.forEach(function (d) {
    var avatar = AVATARS[d.id] || "/users/default/pfp.jpg";
    if (!localStorage.getItem("user_" + d.id)) {
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
    if (!localStorage.getItem("profile_" + d.id)) {
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
    if (!localStorage.getItem("pfp_" + d.id)) {
      localStorage.setItem("pfp_" + d.id, avatar);
    }
  });"""
new = """  demos.forEach(function (d) {
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
  });"""
if old not in seed:
    raise SystemExit("demos.forEach block missing")
path.write_text(seed.replace(old, new, 1), encoding="utf-8")
print("OK demos.forEach force on needReseed")
