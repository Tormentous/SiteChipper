from pathlib import Path
root = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
posts = (root/"js/posts.js").read_text(encoding="utf-8")
i = posts.find("function mediaHTML")
print("==== mediaHTML")
print(posts[i:i+1200] if i>=0 else "missing")
mv_path = root/"js/media-viewer.js"
print("media-viewer exists", mv_path.exists())
if mv_path.exists():
    mv = mv_path.read_text(encoding="utf-8")
    for n in ["audio", "video", "controls", "cb-player"]:
        print(n, mv.count(n))
css = (root/"styles.css").read_text(encoding="utf-8")
i = css.find("body.messages-page .cb-msg-shell")
print("==== shell")
print(css[i:i+400])
bt = (root/"js/board-tabs.js").read_text(encoding="utf-8")
print("chipper in board-tabs", "chipper" in bt)
polls = (root/"js/polls.js").read_text(encoding="utf-8")
print("poll-poly", polls.count("poll-poly"), "lightweight", polls.count("lightweight"))
prof = (root/"js/profile.js").read_text(encoding="utf-8")
# find SOCIAL or icon map
for needle in ["SOCIAL_ICONS", "socialIcons", "fa-brands fa-", "function socialIcon"]:
    print(needle, prof.find(needle))
i = prof.find("fa-brands")
print(prof[max(0,i-100):i+700])
