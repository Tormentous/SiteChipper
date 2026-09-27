import os, re
site = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
out = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\_extract"
os.makedirs(out, exist_ok=True)

def grab(path, patterns, maxlen=80):
  p = os.path.join(site, path.replace('/', os.sep))
  if not os.path.exists(p):
    return f'MISSING {path}\n'
  lines = open(p, encoding='utf-8', errors='ignore').read().splitlines()
  hits = []
  for i, line in enumerate(lines):
    for pat in patterns:
      if re.search(pat, line, re.I):
        start = max(0, i-2)
        end = min(len(lines), i+maxlen)
        hits.append((i+1, '\n'.join(f'{n+1}|{lines[n]}' for n in range(start, end))))
        break
  return f'=== {path} ===\n' + '\n---\n'.join(f'@{ln}\n{blk}' for ln, blk in hits[:8]) + '\n'

chunks = []
chunks.append(grab('styles.css', [
  r'body\.messages-page',
  r'\.messages-shell',
  r'cb-community-note|community-note',
  r'chipper-tabs-inner|cb-profile-tabs|board-tabs|cb-board-tabs',
  r'poll-poly|cb-scrub|cb-player',
], 40))
chunks.append(grab('js/posts.js', [
  r'function mediaHTMLFor',
  r'function toggleYeah',
  r'communityNote|community_note|renderCommunityNote|cb-community-note',
  r'repost|quotedPost|parentPost',
  r'postActionsHTML',
], 50))
chunks.append(grab('js/board-tabs.js', [r'.'], 200))
chunks.append(grab('js/polls.js', [
  r'poll-poly|renderChart|scrub|board.*carousel|General',
], 40))
chunks.append(grab('messages.html', [r'script|stylesheet|messages'], 20))
# list boards
boards = []
broot = os.path.join(site, 'b')
if os.path.isdir(broot):
  for name in os.listdir(broot):
    boards.append(name)
chunks.append('BOARDS: ' + ', '.join(sorted(boards)))
# find script includes for posts/polls
for html in ['index.html','polls.html','messages.html','community.html']:
  p = os.path.join(site, html)
  if os.path.exists(p):
    t = open(p, encoding='utf-8', errors='ignore').read()
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', t)
    chunks.append(f'{html} scripts: ' + ', '.join(scripts[-15:]))

text = '\n\n'.join(chunks)
open(os.path.join(out, 'dump.txt'), 'w', encoding='utf-8').write(text)
print('wrote', len(text), 'chars')
print(text[:4000])
