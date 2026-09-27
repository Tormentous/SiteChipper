import re, os
site = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
pt = open(os.path.join(site, "js", "polls.js"), encoding="utf-8", errors="ignore").read()
for m in re.finditer(r"function\s+(\w*[Pp]oly\w*|\w*[Ss]crub\w*|\w*[Cc]hart\w*)\s*\(", pt):
    print("fn", m.group(1), "at", m.start())
print("bootBoardCarousel", "bootBoardCarousel" in pt)
print("CoolbradorScrubChart refs", pt.count("CoolbradorScrubChart"))
# any function with Poly in name
for m in re.finditer(r"function\s+(\w+)\s*\(", pt):
    if re.search(r"poly|scrub|chart|graph", m.group(1), re.I):
        print("fn2", m.group(1))
ph = open(os.path.join(site, "polls.html"), encoding="utf-8", errors="ignore").read()
print("carousel mount", "pollsBoardCarousel" in ph)
print("mains", len(re.findall(r"<main", ph, re.I)))
print("scripts", re.findall(r'src="([^"]+)"', ph))
# first 40 lines of polls.html
print("--- polls.html head ---")
print("\n".join(ph.splitlines()[:45]))
# post-thread
p = os.path.join(site, "js", "post-thread.js")
print("post-thread exists", os.path.exists(p))
if os.path.exists(p):
    tt = open(p, encoding="utf-8", errors="ignore").read()
    for pat in ["findPost", "postId", "URLSearchParams", "posts.find", "getPost", "String(p.id)", "location.search"]:
        print(" ", pat, pat in tt)
    # show id resolve snippet
    i = tt.find("URLSearchParams")
    if i < 0:
        i = tt.find("postId")
    print(tt[max(0, i - 80) : i + 400])
css = open(os.path.join(site, "styles.css"), encoding="utf-8", errors="ignore").read()
print("batch4", "batch4" in css, "cb-player" in css, "cb-kalshi" in css, "calc(100vh - 200px)" in css)
lt = open(os.path.join(site, "js", "layout.js"), encoding="utf-8", errors="ignore").read()
m = re.search(r"font-awesome/[^\"']+", lt)
print("FA", m.group(0) if m else None)
pr = open(os.path.join(site, "js", "profile.js"), encoding="utf-8", errors="ignore").read()
print("fa-brands", pr.count("fa-brands"))
# board top comments - General board.html onYeah and comments link
bh = open(os.path.join(site, "b", "General", "board.html"), encoding="utf-8", errors="ignore").read()
print("General board scripts", re.findall(r'src="([^"]+)"', bh)[-8:])
print("onYeah empty", "onYeah: function () {}" in bh)
# verify posts patches
posts = open(os.path.join(site, "js", "posts.js"), encoding="utf-8", errors="ignore").read()
print("topBefore", "topBefore" in posts)
print("audio branch", 'm.type === "audio"' in posts)
print("note vote", "data-note-vote" in posts)
print("quoteCtx", "quoteCtx" in posts)
print("controls muted loop", "controls muted loop" in posts)
