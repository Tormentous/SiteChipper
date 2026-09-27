# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
profile = ROOT / "js" / "profile.js"
html = ROOT / "users" / "profile" / "index.html"

text = profile.read_text(encoding="utf-8")

# --- Insert crop helpers after readFileAsDataUrl ---
MARKER = """  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error("No file"));
      if (file.size > IMAGE_MAX_BYTES) return reject(new Error("File too large (max ~20MB)."));
      var okType = (file.type || "").indexOf("image/") === 0 || (file.type || "").indexOf("video/") === 0;
      if (!okType) return reject(new Error("Please choose an image or video file."));
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("Could not read that file.")); };
      reader.readAsDataURL(file);
    });
  }
"""

HELPERS = """  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error("No file"));
      if (file.size > IMAGE_MAX_BYTES) return reject(new Error("File too large (max ~20MB)."));
      var okType = (file.type || "").indexOf("image/") === 0 || (file.type || "").indexOf("video/") === 0;
      if (!okType) return reject(new Error("Please choose an image or video file."));
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("Could not read that file.")); };
      reader.readAsDataURL(file);
    });
  }

  /** Crop presets: avatar 1:1 circle, banner 3:1, about 4:3. */
  var CROP_PRESETS = {
    avatar: { aspect: 1, shape: "circle", maxEdge: 512, mime: "image/png" },
    banner: { aspect: 3, shape: "rect", maxEdge: 1600, mime: "image/jpeg" },
    about: { aspect: 4 / 3, shape: "rect", maxEdge: 1200, mime: "image/jpeg" }
  };

  function openImageCrop(opts) {
    if (!window.CoolbradorImageCrop || typeof window.CoolbradorImageCrop.open !== "function") {
      return Promise.reject(new Error("Image crop unavailable."));
    }
    return window.CoolbradorImageCrop.open(opts || {});
  }
"""

if "CROP_PRESETS" not in text:
    if MARKER not in text:
        raise SystemExit("MARKER readFileAsDataUrl not found")
    text = text.replace(MARKER, HELPERS, 1)
    print("inserted CROP_PRESETS helpers")
else:
    print("CROP_PRESETS already present")

# --- Replace avatar pen button to open crop via data-crop ---
OLD_PEN = """      if (isOwn) {
        var avBtn = document.getElementById("avatarOpenBtn");
        if (avBtn && !avBtn.querySelector(".cb-inline-edit")) {
          var ebtn = document.createElement("button");
          ebtn.type = "button";
          ebtn.className = "cb-inline-edit cb-inline-edit-avatar";
          ebtn.title = "Change photo";
          ebtn.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
          ebtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            var file = document.getElementById("editAvatarFile");
            var panel = document.getElementById("editPanel");
            if (panel) { panel.hidden = false; fillEditor(); }
            if (file) file.click();
          };
          avBtn.style.position = avBtn.style.position || "relative";
          avBtn.appendChild(ebtn);
        }
      }"""

NEW_PEN = """      if (isOwn) {
        var avBtn = document.getElementById("avatarOpenBtn");
        if (avBtn) avBtn.classList.add("cb-crop-editable");
        var bannerBtnOwn = document.getElementById("bannerOpenBtn");
        if (bannerBtnOwn) bannerBtnOwn.classList.add("cb-crop-editable");
        var aboutImgOwn = document.getElementById("profileAboutImg");
        if (aboutImgOwn) aboutImgOwn.classList.add("cb-crop-editable");
        if (avBtn && !avBtn.querySelector(".cb-inline-edit")) {
          var ebtn = document.createElement("button");
          ebtn.type = "button";
          ebtn.className = "cb-inline-edit cb-inline-edit-avatar";
          ebtn.title = "Change photo";
          ebtn.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
          ebtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            openOwnerCrop("avatar");
          };
          avBtn.style.position = avBtn.style.position || "relative";
          avBtn.appendChild(ebtn);
        }
      }"""

if "openOwnerCrop(\"avatar\")" not in text and "openOwnerCrop('avatar')" not in text:
    if OLD_PEN not in text:
        raise SystemExit("OLD_PEN block not found")
    text = text.replace(OLD_PEN, NEW_PEN, 1)
    print("replaced avatar pen / editable classes")
else:
    print("pen already wired to openOwnerCrop")

# --- Replace avatar/banner open + upload binding section inside wireActions own block ---
OLD_WIRE_MEDIA = """      var avatarBtn = document.getElementById("avatarOpenBtn");
      if (avatarBtn) {
        avatarBtn.onclick = function () {
          openMedia(profile.avatar || demoAvatar(viewId), "image");
        };
      }
      var bannerBtn = document.getElementById("bannerOpenBtn");
      if (bannerBtn) {
        bannerBtn.onclick = function () {
          openMedia(profile.banner || DEFAULT_BANNER, "image");
        };
      }"""

NEW_WIRE_MEDIA = """      var avatarBtn = document.getElementById("avatarOpenBtn");
      if (avatarBtn) {
        avatarBtn.onclick = function () {
          if (isOwn) openOwnerCrop("avatar");
          else openMedia(profile.avatar || demoAvatar(viewId), "image");
        };
      }
      var bannerBtn = document.getElementById("bannerOpenBtn");
      if (bannerBtn) {
        bannerBtn.onclick = function () {
          if (isOwn) openOwnerCrop("banner");
          else openMedia(profile.banner || DEFAULT_BANNER, "image");
        };
      }
      var aboutImgBtn = document.getElementById("profileAboutImg");
      if (aboutImgBtn) {
        aboutImgBtn.onclick = function () {
          if (isOwn) openOwnerCrop("about");
          else openMedia(profile.aboutImage || "/img/favicon3.ico", "image");
        };
      }"""

if 'openOwnerCrop("banner")' not in text:
    if OLD_WIRE_MEDIA not in text:
        raise SystemExit("OLD_WIRE_MEDIA not found")
    text = text.replace(OLD_WIRE_MEDIA, NEW_WIRE_MEDIA, 1)
    print("wired avatar/banner/about clicks")
else:
    print("media clicks already wired")

OLD_UPLOAD = """      async function bindUpload(inputId, apply) {
        var input = document.getElementById(inputId);
        if (!input || input.dataset.wired === "1") return;
        input.dataset.wired = "1";
        input.addEventListener("change", async function () {
          var file = input.files && input.files[0];
          input.value = "";
          if (!file) return;
          try {
            var dataUrl = await readFileAsDataUrl(file);
            apply(dataUrl, file);
            alert("Ready. Hit Save to keep changes.");
          } catch (err) {
            alert(err.message || "Upload failed.");
          }
        });
      }
      bindUpload("editAvatarFile", function (dataUrl) {
        profile.avatar = dataUrl;
        profile.media = profile.media || [];
        profile.media.unshift({ url: dataUrl, type: "image", label: "Photo" });
      });
      bindUpload("editBannerFile", function (dataUrl) {
        profile.banner = dataUrl;
      });
      bindUpload("editAboutFile", function (dataUrl) {
        profile.aboutImage = dataUrl;
      });"""

NEW_UPLOAD = """      function ensureEditPanelOpen() {
        var panel = document.getElementById("editPanel");
        if (panel) {
          panel.hidden = false;
          fillEditor();
        }
      }

      function applyCroppedImage(kind, dataUrl) {
        if (kind === "avatar") {
          profile.avatar = dataUrl;
          profile.media = profile.media || [];
          profile.media.unshift({ url: dataUrl, type: "image", label: "Photo" });
        } else if (kind === "banner") {
          profile.banner = dataUrl;
        } else if (kind === "about") {
          profile.aboutImage = dataUrl;
        }
        paint();
        toast("Ready. Hit Save to keep changes.");
      }

      function openOwnerCrop(kind, srcOverride) {
        var preset = CROP_PRESETS[kind] || CROP_PRESETS.avatar;
        var src = srcOverride;
        if (!src) {
          if (kind === "avatar") src = profile.avatar || demoAvatar(viewId);
          else if (kind === "banner") src = profile.banner || DEFAULT_BANNER;
          else src = profile.aboutImage || "/img/favicon3.ico";
        }
        ensureEditPanelOpen();
        openImageCrop({
          src: src,
          aspect: preset.aspect,
          shape: preset.shape,
          maxEdge: preset.maxEdge,
          mime: preset.mime,
          onApply: function (dataUrl) {
            applyCroppedImage(kind, dataUrl);
          }
        }).catch(function (err) {
          if (err) toast(err.message || "Crop failed.");
        });
      }

      async function bindUpload(inputId, kind) {
        var input = document.getElementById(inputId);
        if (!input || input.dataset.wired === "1") return;
        input.dataset.wired = "1";
        input.addEventListener("change", async function () {
          var file = input.files && input.files[0];
          input.value = "";
          if (!file) return;
          try {
            if ((file.type || "").indexOf("image/") !== 0) {
              toast("Please choose an image file.");
              return;
            }
            var dataUrl = await readFileAsDataUrl(file);
            openOwnerCrop(kind, dataUrl);
          } catch (err) {
            toast(err.message || "Upload failed.");
          }
        });
      }
      bindUpload("editAvatarFile", "avatar");
      bindUpload("editBannerFile", "banner");
      bindUpload("editAboutFile", "about");"""

if "function openOwnerCrop(kind" not in text:
    if OLD_UPLOAD not in text:
        raise SystemExit("OLD_UPLOAD not found")
    text = text.replace(OLD_UPLOAD, NEW_UPLOAD, 1)
    print("replaced bindUpload with crop flow")
else:
    print("openOwnerCrop already present")

# openOwnerCrop is used in paint() before wireActions defines it - PROBLEM
# paint() calls ensureInlineEdit and creates pen that calls openOwnerCrop
# but openOwnerCrop is defined inside wireActions which runs after paint's ensure...
# Actually paint() is defined first, then wireActions is called from paint at the end.
# The pen onclick runs later (user click), by then wireActions has run.
# BUT openOwnerCrop is function-scoped inside wireActions - pen onclick can't see it!
#
# Fix: hoist openOwnerCrop / apply helpers to mountProfile scope (sibling of paint/wireActions).

# Re-read: paint and wireActions are both inside mountProfile/then callback.
# If openOwnerCrop is only inside wireActions, the pen handler in paint closes over... nothing.
# I need openOwnerCrop in the outer scope of paint+wireActions.

# Better approach: define helpers before paint(), not inside wireActions.
# Move the crop functions out of wireActions into the parent scope.

# Check current state - if openOwnerCrop is inside wireActions, we need to hoist.

if "function openOwnerCrop(kind" in text:
    # Extract and hoist: remove from inside wireActions and place before paint
    # Find the block we inserted and move apply helpers before function paint()
    start = text.find("      function ensureEditPanelOpen() {")
    end = text.find("      bindUpload(\"editAboutFile\", \"about\");")
    if start < 0 or end < 0:
        raise SystemExit("cannot locate upload helpers to hoist")
    end = end + len("      bindUpload(\"editAboutFile\", \"about\");")
    block = text[start:end]
    # Dedent from 6 spaces to 4 for outer scope? paint uses 4 spaces for function paint.
    # Looking at indent: wireActions body is 6 spaces. Outer (same as paint) is 4 spaces.
    hoisted = "\n".join(
        (("    " + line[6:]) if line.startswith("      ") else line)
        for line in block.splitlines()
    )
    # Keep bindUpload calls inside wireActions; move only the function defs.
    # Split: functions vs bindUpload lines
    lines = block.splitlines()
    func_lines = []
    bind_lines = []
    for line in lines:
        if "bindUpload(" in line and not line.strip().startswith("async function") and not line.strip().startswith("function"):
            bind_lines.append(line)
        else:
            func_lines.append(line)
    # Also keep async function bindUpload in funcs
    funcs_text = "\n".join(func_lines)
    binds_text = "\n".join(bind_lines)

    # Remove entire block from wireActions, put funcs before paint, leave binds
    text = text[:start] + binds_text + text[end:]

    paint_idx = text.find("    function paint() {")
    if paint_idx < 0:
        raise SystemExit("paint() not found for hoist")
    # Dedent funcs to 4-space indent (same as paint)
    hoisted_funcs = "\n".join(
        (("    " + ln[6:]) if ln.startswith("      ") else ln)
        for ln in funcs_text.splitlines()
    )
    if "function openOwnerCrop(kind" not in text[paint_idx-500:paint_idx]:
        text = text[:paint_idx] + hoisted_funcs + "\n\n" + text[paint_idx:]
        print("hoisted crop helpers before paint()")
    else:
        print("helpers already before paint")

# Avoid double-definition if re-run: ensure only one openOwnerCrop
count = text.count("function openOwnerCrop(kind")
print("openOwnerCrop defs:", count)
if count != 1:
    raise SystemExit("expected exactly one openOwnerCrop")

profile.write_text(text, encoding="utf-8")
print("wrote profile.js", profile.stat().st_size)

# --- HTML script tag ---
h = html.read_text(encoding="utf-8")
needle = '  <script src="/js/media-viewer.js"></script>\n  <script src="/js/posts.js"></script>\n  <script src="/js/profile.js"></script>'
repl = '  <script src="/js/media-viewer.js"></script>\n  <script src="/js/posts.js"></script>\n  <script src="/js/image-crop.js"></script>\n  <script src="/js/profile.js"></script>'
if "/js/image-crop.js" not in h:
    if needle not in h:
        raise SystemExit("script block not found in index.html")
    h = h.replace(needle, repl, 1)
    html.write_text(h, encoding="utf-8")
    print("added image-crop.js script tag")
else:
    print("script tag already present")

print("DONE")
