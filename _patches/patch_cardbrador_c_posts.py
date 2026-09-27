# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]\n---\n{old[:350]}\n---")
    return text.replace(old, new, 1)

posts_path = ROOT / "js" / "posts.js"
posts = posts_path.read_text(encoding="utf-8")

# Avatar: no tall left wrapper link — column + small avatar link only
posts = must_replace(
    posts,
    '''        '<a class="post-avatar" href="' + escapeHtml(profileUrl(post.userId)) + '" data-profile="' + escapeHtml(post.userId || "") + '"><img src="' + avatar + '" alt=""></a>' +
        '<div class="post-body">' +''',
    '''        '<div class="post-avatar-col" aria-hidden="false">' +
          '<a class="post-avatar" href="' + escapeHtml(profileUrl(post.userId)) + '" data-profile="' + escapeHtml(post.userId || "") + '" title="Profile">' +
            '<img src="' + avatar + '" alt="">' +
          "</a>" +
        "</div>" +
        '<div class="post-body">' +''',
    "post avatar col"
)

# Composer Photo + Video buttons with FA icons (polls-like)
posts = must_replace(
    posts,
    '''    var tools = showMedia
      ? '<div class="post-tools">' +
          '<button type="button" class="tool-btn" id="' + attachId + '" title="Add photo/video">Photo/Video</button>' +
        "</div>"
      : '<div class="post-tools"></div>';''',
    '''    var tools = showMedia
      ? '<div class="post-tools">' +
          '<button type="button" class="tool-btn tool-btn-photo" id="' + attachId + '" title="Add photo" data-media-kind="image">' +
            '<i class="fa-regular fa-image" aria-hidden="true"></i> Photo' +
          "</button>" +
          '<button type="button" class="tool-btn tool-btn-video" id="' + attachId + 'Video" title="Add video" data-media-kind="video">' +
            '<i class="fa-solid fa-video" aria-hidden="true"></i> Video' +
          "</button>" +
        "</div>"
      : '<div class="post-tools"></div>';''',
    "composer Photo Video"
)

# Wire both Photo and Video buttons
posts = must_replace(
    posts,
    '''    var attachBtn = container.querySelector("#attachMedia") || container.querySelector(".post-tools .tool-btn");
    var pfp = container.querySelector("#currentUserPfp") || container.querySelector(".post-avatar img");
    if (pfp) pfp.src = getPfp(sessionUserId());

    var attachedMedia = null;
    var defaultBoard = opts.defaultBoard || "General";
    var needsBoard = mode !== "comment" && opts.requireBoard !== false && !!boardInput;

    function updateButton() {
      if (!submitBtn) return;
      var hasText = textarea && textarea.value.trim();
      var boardOk = !needsBoard || !!(boardInput && boardInput.value.trim());
      submitBtn.disabled = !(hasText || attachedMedia) || !boardOk;
    }

    if (attachBtn && mediaInput) {
      attachBtn.onclick = function () { mediaInput.click(); };
      mediaInput.onchange = function () {
        var file = mediaInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          attachedMedia = { type: file.type.indexOf("video") === 0 ? "video" : "image", url: e.target.result };
          if (mediaPreview) {
            mediaPreview.innerHTML = "";
            var el = attachedMedia.type === "image"
              ? Object.assign(document.createElement("img"), { src: attachedMedia.url })
              : Object.assign(document.createElement("video"), { src: attachedMedia.url, controls: true, muted: true, loop: true });
            mediaPreview.appendChild(el);
            var removeBtn = Object.assign(document.createElement("button"), { textContent: "x", className: "remove-media", type: "button" });
            removeBtn.onclick = function () {
              attachedMedia = null;
              mediaPreview.style.display = "none";
              mediaInput.value = "";
              updateButton();
            };
            mediaPreview.appendChild(removeBtn);
            mediaPreview.style.display = "block";
          }
          updateButton();
        };
        reader.readAsDataURL(file);
      };
    }''',
    '''    var attachBtn = container.querySelector("#attachMedia") || container.querySelector(".post-tools .tool-btn-photo") || container.querySelector(".post-tools .tool-btn");
    var attachVideoBtn = container.querySelector("#attachMediaVideo") || container.querySelector(".post-tools .tool-btn-video");
    var pfp = container.querySelector("#currentUserPfp") || container.querySelector(".post-avatar img");
    if (pfp) pfp.src = getPfp(sessionUserId());

    var attachedMedia = null;
    var defaultBoard = opts.defaultBoard || "General";
    var needsBoard = mode !== "comment" && opts.requireBoard !== false && !!boardInput;

    function updateButton() {
      if (!submitBtn) return;
      var hasText = textarea && textarea.value.trim();
      var boardOk = !needsBoard || !!(boardInput && boardInput.value.trim());
      submitBtn.disabled = !(hasText || attachedMedia) || !boardOk;
    }

    function bindMediaPicker(btn, kind) {
      if (!btn || !mediaInput) return;
      btn.onclick = function () {
        if (kind === "video") mediaInput.setAttribute("accept", "video/*");
        else if (kind === "image") mediaInput.setAttribute("accept", "image/*");
        else mediaInput.setAttribute("accept", "image/*,video/*");
        mediaInput.click();
      };
    }
    bindMediaPicker(attachBtn, "image");
    bindMediaPicker(attachVideoBtn, "video");
    if (mediaInput) {
      mediaInput.onchange = function () {
        var file = mediaInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          attachedMedia = { type: file.type.indexOf("video") === 0 ? "video" : "image", url: e.target.result };
          if (mediaPreview) {
            mediaPreview.innerHTML = "";
            var el = attachedMedia.type === "image"
              ? Object.assign(document.createElement("img"), { src: attachedMedia.url })
              : Object.assign(document.createElement("video"), { src: attachedMedia.url, controls: true, muted: true, loop: true });
            mediaPreview.appendChild(el);
            var removeBtn = Object.assign(document.createElement("button"), { textContent: "x", className: "remove-media", type: "button" });
            removeBtn.onclick = function () {
              attachedMedia = null;
              mediaPreview.style.display = "none";
              mediaInput.value = "";
              updateButton();
            };
            mediaPreview.appendChild(removeBtn);
            mediaPreview.style.display = "block";
          }
          updateButton();
        };
        reader.readAsDataURL(file);
      };
    }''',
    "mountComposer media wiring"
)

posts_path.write_text(posts, encoding="utf-8")
print("OK posts.js")
