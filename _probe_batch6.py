from pathlib import Path
root = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")
css = (root/"styles.css").read_text(encoding="utf-8")
# messages-page rules
idx=0; c=0
print("==== messages-page CSS ====")
while c<12:
    i=css.find("messages-page", idx)
    if i<0: break
    print(css[max(0,i-40):i+220]); print("---"); idx=i+1; c+=1
# audio/video player
print("==== audio/video ====")
for n in ["audio", "video", "media-player", "cb-player", "controls"]:
    print(n, css.count(n))
# profile tabs / chipper tabs
print("==== tabs styles ====")
for n in ["cb-profile-tabs", "chipper-tabs", "cb-board-tabs", "profile-tabs"]:
    i=css.find(n)
    print(n, i)
    if i>=0: print(css[i:i+400]); print("---")
# community note
posts=(root/"js/posts.js").read_text(encoding="utf-8")
print("==== community note ====")
for n in ["community-note", "emdash", "—", "Community Note"]:
    print(n, posts.count(n), css.count(n))
i=posts.find("cb-community-note")
print(posts[i:i+500] if i>=0 else "no note html")
# yeah scroll
print("==== yeah scroll ====")
i=posts.find("toggleYeah")
# find click handler yeah
i=posts.find('closest(".yeah-btn")')
print(posts[max(0,i-50):i+600])
# social icons
prof=(root/"js/profile.js").read_text(encoding="utf-8")
for n in ["fa-brands", "fa-discord", "fa-twitter", "fa-x-twitter", "fa-youtube", "fa-instagram", "fa-tiktok"]:
    print("social", n, prof.count(n), posts.count(n), css.count(n))
# board top comments - post-thread
print("==== board files sample ====")
print((root/"b/General/board.html").read_text(encoding="utf-8")[0:500])
# polls page
print("polls.html", (root/"polls.html").exists())
