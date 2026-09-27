# -*- coding: utf-8 -*-
"""Coolbrador: crop UX, edit panel cleanup, profile feed width."""
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
crop = ROOT / "js" / "image-crop.js"
profile = ROOT / "js" / "profile.js"
html = ROOT / "users" / "profile" / "index.html"
css = ROOT / "styles-profile.css"

# ---------- 1) image-crop.js: themed Cancel/Apply ----------
c = crop.read_text(encoding="utf-8")
old_actions_css = ".cb-crop-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}",
old_btn_css = ".cb-crop-actions button{min-width:88px;}",
# Find and replace the two CSS lines in the joined array
old_css_pair = (
    '".cb-crop-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}",\n'
    '      ".cb-crop-actions button{min-width:88px;}",'
)
new_css_pair = (
    '".cb-crop-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}",\n'
    '      ".cb-crop-actions button{appearance:none;-webkit-appearance:none;min-width:88px;width:auto;height:auto;display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;font:inherit;font-size:0.95rem;font-weight:700;cursor:pointer;border-radius:999px;border:1px solid rgba(var(--cb-accent-rgb),0.35);background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));color:var(--cb-accent-text,#fff);box-shadow:none;}",\n'
    '      ".cb-crop-actions button.ghost{background:transparent;background-image:none;color:var(--cb-text);border:1px solid rgba(var(--cb-accent-rgb),0.35);}",\n'
    '      ".cb-crop-actions button.primary{background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));border:none;color:var(--cb-accent-text,#fff);}",'
)
if old_css_pair not in c:
    raise SystemExit("crop CSS pair not found")
c = c.replace(old_css_pair, new_css_pair, 1)

old_btns = (
    "'<button type=\"button\" class=\"ghost\" id=\"cbCropCancel\">Cancel</button>' +\n"
    "            '<button type=\"button\" id=\"cbCropApply\">Apply</button>' +"
)
new_btns = (
    "'<button type=\"button\" class=\"ghost\" id=\"cbCropCancel\">Cancel</button>' +\n"
    "            '<button type=\"button\" class=\"primary\" id=\"cbCropApply\">Apply</button>' +"
)
if old_btns not in c:
    raise SystemExit("crop button HTML not found")
c = c.replace(old_btns, new_btns, 1)
crop.write_text(c, encoding="utf-8")
print("image-crop.js: themed Cancel/Apply buttons")

# ---------- 2) profile.js ----------
p = profile.read_text(encoding="utf-8")

# Replace ensureInlineEdit + ensureEditPanelOpen + apply/openOwnerCrop/bindUpload block
# through openOwnerCrop and bindUpload with new file-first flow; drop inline edit.

OLD_BLOCK_START = "    function ensureInlineEdit(el, field) {"
OLD_BLOCK_END_MARKER = "    async function bindUpload(inputId, kind) {"

# Find start of ensureInlineEdit through end of bindUpload function (before paint)
idx_start = p.find(OLD_BLOCK_START)
if idx_start < 0:
    raise SystemExit("ensureInlineEdit not found")
idx_bind = p.find(OLD_BLOCK_END_MARKER, idx_start)
if idx_bind < 0:
    raise SystemExit("bindUpload not found")
# End of bindUpload: next "    function paint()"
idx_paint = p.find("\n    function paint() {", idx_bind)
if idx_paint < 0:
    raise SystemExit("paint() after bindUpload not found")

NEW_HELPERS = '''    function applyCroppedImage(kind, dataUrl) {
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

    /** File picker first; cancel does nothing. Then crop the chosen file. */
    function openOwnerCrop(kind) {
      var preset = CROP_PRESETS[kind] || CROP_PRESETS.avatar;
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.hidden = true;
      document.body.appendChild(input);
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        try { input.remove(); } catch (err) {}
        if (!file) return;
        if ((file.type || "").indexOf("image/") !== 0) {
          toast("Please choose an image file.");
          return;
        }
        readFileAsDataUrl(file).then(function (dataUrl) {
          return openImageCrop({
            src: dataUrl,
            aspect: preset.aspect,
            shape: preset.shape,
            maxEdge: preset.maxEdge,
            mime: preset.mime,
            onApply: function (cropped) {
              applyCroppedImage(kind, cropped);
            }
          });
        }).catch(function (err) {
          if (err) toast(err.message || "Crop failed.");
        });
      });
      input.click();
    }

'''

p = p[:idx_start] + NEW_HELPERS + p[idx_paint + 1:]  # keep leading newline of paint via +1? paint starts with \n
# Actually idx_paint points at "\n    function paint()" so p[idx_paint+1:] starts with "    function paint()"
print("profile.js: replaced crop helpers (file-first)")

# Remove ensureInlineEdit calls and avatar pencil block in paint
old_paint_edit = '''      ensureInlineEdit(document.getElementById("profileDisplayName"), "name");
      ensureInlineEdit(document.getElementById("profileBio"), "bio");
      ensureInlineEdit(document.getElementById("profileAbout"), "about");
      if (isOwn) {
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
      }
'''

new_paint_edit = '''      document.querySelectorAll(".cb-inline-edit").forEach(function (b) { b.remove(); });
      if (isOwn) {
        var avBtn = document.getElementById("avatarOpenBtn");
        if (avBtn) avBtn.classList.add("cb-crop-editable");
        var bannerBtnOwn = document.getElementById("bannerOpenBtn");
        if (bannerBtnOwn) bannerBtnOwn.classList.add("cb-crop-editable");
        var aboutImgOwn = document.getElementById("profileAboutImg");
        if (aboutImgOwn) aboutImgOwn.classList.add("cb-crop-editable");
      }
'''

if old_paint_edit not in p:
    raise SystemExit("paint inline-edit block not found")
p = p.replace(old_paint_edit, new_paint_edit, 1)
print("profile.js: removed inline pencils / avatar pen")

# Remove bindUpload calls in wireActions
old_binds = '''      bindUpload("editAvatarFile", "avatar");
      bindUpload("editBannerFile", "banner");
      bindUpload("editAboutFile", "about");

'''
if old_binds not in p:
    # try without trailing blank
    old_binds2 = '''      bindUpload("editAvatarFile", "avatar");
      bindUpload("editBannerFile", "banner");
      bindUpload("editAboutFile", "about");
'''
    if old_binds2 not in p:
        raise SystemExit("bindUpload calls not found")
    p = p.replace(old_binds2, "", 1)
else:
    p = p.replace(old_binds, "", 1)
print("profile.js: removed bindUpload calls")

profile.write_text(p, encoding="utf-8")
print("wrote profile.js", profile.stat().st_size)

# ---------- 3) index.html: remove Browse file inputs ----------
h = html.read_text(encoding="utf-8")
old_upload = '''
        <div class="cb-edit-upload-row">
          <div>
            <label>Profile photo</label>
            <input type="file" id="editAvatarFile" accept="image/*">
          </div>
          <div>
            <label>Banner</label>
            <input type="file" id="editBannerFile" accept="image/*">
          </div>
          <div>
            <label>About image</label>
            <input type="file" id="editAboutFile" accept="image/*">
          </div>
        </div>
'''
if old_upload not in h:
    raise SystemExit("edit upload row not found in HTML")
h = h.replace(old_upload, "\n", 1)
# Add a short note that images are edited by clicking them on the page
note_anchor = '<p class="cb-edit-note">You can update your own page. Handle and user id stay yours.</p>'
note_new = (
    '<p class="cb-edit-note">You can update your own page. Handle and user id stay yours.</p>\n'
    '        <p class="cb-edit-note">Click your photo, banner, or about image on the page to change them.</p>'
)
if "Click your photo, banner, or about image" not in h:
    if note_anchor not in h:
        raise SystemExit("edit note not found")
    h = h.replace(note_anchor, note_new, 1)
html.write_text(h, encoding="utf-8")
print("index.html: removed file Browse inputs")

# ---------- 4) styles-profile.css: full-width profile feed ----------
s = css.read_text(encoding="utf-8")
feed_marker = ".cb-profile-feed.hub-feed {\n  width: 100%;\n}"
feed_new = """#profileFeed,
.cb-profile-feed,
.cb-profile-feed.hub-feed {
  width: 100% !important;
  max-width: none !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}
#profileFeed .post,
.cb-profile-feed .post,
.cb-profile-feed.hub-feed .post {
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box;
}
.cb-profile-feed.hub-feed {
  width: 100%;
}"""
if "#profileFeed,\n.cb-profile-feed,\n.cb-profile-feed.hub-feed" in s:
    print("styles-profile.css: feed width already patched")
elif feed_marker not in s:
    # insert after .cb-profile-feed .post { cursor block
    anchor = ".cb-profile-feed .post {\n  cursor: default;\n}"
    if anchor not in s:
        raise SystemExit("feed CSS anchor not found")
    s = s.replace(anchor, anchor + "\n" + feed_new, 1)
    css.write_text(s, encoding="utf-8")
    print("styles-profile.css: inserted full-width feed rules")
else:
    s = s.replace(feed_marker, feed_new, 1)
    css.write_text(s, encoding="utf-8")
    print("styles-profile.css: expanded feed width overrides")

# Verify
pv = profile.read_text(encoding="utf-8")
assert "ensureInlineEdit" not in pv, "ensureInlineEdit still present"
assert "bindUpload" not in pv, "bindUpload still present"
assert "editAvatarFile" not in pv, "editAvatarFile still referenced"
assert "function openOwnerCrop(kind)" in pv
assert 'input.type = "file"' in pv
assert "ensureEditPanelOpen" not in pv
hv = html.read_text(encoding="utf-8")
assert "editAvatarFile" not in hv
assert "cb-edit-upload-row" not in hv
cv = crop.read_text(encoding="utf-8")
assert "button.primary" in cv
assert "button.ghost" in cv
sv = css.read_text(encoding="utf-8")
assert "max-width: none !important" in sv
print("VERIFY OK")
print("DONE")
