import os
site = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
for root, dirs, files in os.walk(site):
  dirs[:] = [d for d in dirs if d not in ('.git','node_modules','.firebase')]
  for f in files:
    if not f.endswith(('.css','.js','.html')): continue
    p = os.path.join(root, f)
    try:
      t = open(p, encoding='utf-8', errors='ignore').read()
    except Exception:
      continue
    hits = []
    if 'messages-page' in t and f.endswith('.css'): hits.append('msg-css')
    if 'mediaHTMLFor' in t: hits.append('mediaHTML')
    if 'board-tabs' in f or ('board-tabs' in t and f.endswith('.js')): hits.append('board-tabs')
    if 'cb-profile-tabs' in t or 'chipper-tabs-inner' in t: hits.append('profile-tabs')
    if 'community_note' in t or 'communityNote' in t or 'cb-community-note' in t: hits.append('notes')
    if 'toggleYeah' in t: hits.append('yeah')
    if 'poll-poly' in t or 'CoolbradorScrub' in t: hits.append('graphs')
    if 'moderator' in t.lower() and f.endswith(('.js','.html','.css')): hits.append('mods')
    if 'fa-brands' in t or 'fontawesome' in t.lower(): hits.append('fa')
    if hits:
      print(os.path.relpath(p, site) + ': ' + ', '.join(hits))
print('--- exists ---')
for want in ['js/posts.js','js/polls.js','js/board-tabs.js','js/messages.js','js/profile.js','js/layout.js','styles.css','js/cb-scrub-chart.js','js/cb-media-player.js','messages.html','polls.html']:
  print(want, 'YES' if os.path.exists(os.path.join(site, want.replace('/', os.sep))) else 'NO')
