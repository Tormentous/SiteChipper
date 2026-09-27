import os, re, json
SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
for name in ("serve.json", "firebase.json", "_redirects", "vercel.json"):
    p = os.path.join(SITE, name)
    if os.path.exists(p):
        print("====", name)
        print(open(p, encoding="utf-8", errors="ignore").read()[:2500])

# post-thread html location
for root, dirs, files in os.walk(os.path.join(SITE, "b")):
    for f in files:
        if "thread" in f.lower() or "comment" in f.lower():
            print("found", os.path.join(root, f))

# Does /b/General/post/1/comments exist?
p = os.path.join(SITE, "b", "General", "post")
print("General/post exists", os.path.isdir(p))
if os.path.isdir(p):
    print("children", os.listdir(p)[:20])

# harden posts.js getPostNumber + thread url with id fallback
posts_path = os.path.join(SITE, "js", "posts.js")
t = open(posts_path, encoding="utf-8", errors="ignore").read()
old = '''function postThreadUrl(board, postId) {
    var clean = cleanBoardName(board);
    var n = getPostNumber(board, postId);
    if (!clean || !n) return "";
    return "/b/" + encodeURIComponent(clean) + "/post/" + n + "/comments";
  }'''
# read actual function
i = t.find("function postThreadUrl")
print("ACTUAL postThreadUrl:")
print(t[i:i+350])
i = t.find("function getPostNumber")
print("ACTUAL getPostNumber:")
print(t[i:i+400])
