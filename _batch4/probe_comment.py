t = open(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\posts.js", encoding="utf-8", errors="ignore").read()
i = t.find('commentBtn = e.target.closest(".comment-btn")')
if i < 0:
    i = t.find('closest(".comment-btn")')
print("at", i)
print(t[i : i + 900])
print("==== postThreadUrl callers ====")
idx = 0
while True:
    j = t.find("postThreadUrl", idx)
    if j < 0:
        break
    print(t[j - 60 : j + 160])
    print("---")
    idx = j + 12
# getPostNumber / cleanBoardName issues for board path /b/General
i = t.find("function cleanBoardName")
print(t[i : i + 400])
