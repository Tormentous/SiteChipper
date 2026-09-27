from pathlib import Path

posts_path = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\posts.js")
posts = posts_path.read_text(encoding="utf-8")

paint_fn = """
  function paintYeahState(post, yeahBtn) {
    if (!post || !yeahBtn) return;
    var uid = sessionUserId();
    var hasYeah = (post.yeahs || []).map(String).includes(String(uid));
    yeahBtn.classList.toggle("liked", hasYeah);
    yeahBtn.title = hasYeah ? "Unyeah" : "Yeah";
    var label = yeahBtn.querySelector("span");
    if (label) label.textContent = hasYeah ? "Unyeah" : "Yeah!";
    var card = yeahBtn.closest(".post");
    if (!card) return;
    var section = card.querySelector(".yeah-section");
    var html = yeahSectionHTML(post, hasYeah);
    if (section) {
      section.outerHTML = html;
    } else if (hasYeah) {
      var actions = card.querySelector(".post-actions, .action-row, .post-footer");
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      var node = wrap.firstElementChild;
      if (!node) return;
      if (actions && actions.parentNode) actions.parentNode.insertBefore(node, actions.nextSibling);
      else card.appendChild(node);
    }
  }

"""

if "function paintYeahState" not in posts:
    anchor = "  function toggleYeah(board, postId) {"
    if anchor not in posts:
        raise SystemExit("toggleYeah not found")
    posts = posts.replace(anchor, paint_fn + anchor, 1)
    print("paintYeahState inserted")
else:
    print("paintYeahState exists")

old = """        var updated = toggleYeah(board, yeahBtn.dataset.id);
        if (updated && typeof opts.onYeah === "function") opts.onYeah(updated, yeahBtn);
        else if (updated && typeof opts.reload === "function") opts.reload();
        return;"""

new = """        var yScroll = window.scrollY || window.pageYOffset || 0;
        var updated = toggleYeah(board, yeahBtn.dataset.id);
        if (updated) {
          paintYeahState(updated, yeahBtn);
          if (typeof opts.onYeah === "function") opts.onYeah(updated, yeahBtn);
          requestAnimationFrame(function () {
            if (Math.abs((window.scrollY || 0) - yScroll) > 2) {
              window.scrollTo(0, yScroll);
            }
          });
        }
        return;"""

if old not in posts:
    raise SystemExit("yeah click block not found")
posts = posts.replace(old, new, 1)

old2 = """      onYeah: function () { render(); },"""
new2 = """      onYeah: function () { /* in-place paintYeahState keeps scroll */ },"""
count = posts.count(old2)
posts = posts.replace(old2, new2)
print("mountFeed onYeah replaced", count)

# profile/home may pass reload that re-renders - grep later
posts_path.write_text(posts, encoding="utf-8")
print("saved ok")
