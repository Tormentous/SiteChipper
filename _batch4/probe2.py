import re
files = {
  "board": open(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\b\General\board.html", encoding="utf-8", errors="ignore").read(),
  "posts": open(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\posts.js", encoding="utf-8", errors="ignore").read(),
  "thread": open(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\post-thread.js", encoding="utf-8", errors="ignore").read(),
}
for label, t in files.items():
  for m in re.finditer(r'"(posts[^"]+)"', t):
    if "/b/" in m.group(1) or m.group(1).startswith("posts"):
      print(label, "D", m.group(1))
  for m in re.finditer(r"'(posts[^']+)'", t):
    if "/b/" in m.group(1) or m.group(1).startswith("posts"):
      print(label, "S", m.group(1))

t = files["posts"]
idx = 0
count = 0
while count < 8:
  i = t.find("comment-btn", idx)
  if i < 0:
    break
  print("====", i)
  print(t[i : i + 220])
  idx = i + 11
  count += 1

# default comment navigation in bindFeedInteractions
i = t.find("function bindFeedInteractions")
print("bind at", i)
chunk = t[i : i + 3500]
j = chunk.find("comment")
print(chunk[j : j + 800])
