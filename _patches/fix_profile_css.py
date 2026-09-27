# -*- coding: utf-8 -*-
import os
ROOT=r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
path=os.path.join(ROOT,"styles-profile.css")
with open(path,"r",encoding="utf-8") as f: spc=f.read()
spc=spc.replace(
'''.cb-profile-right-top {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--cb-accent-rgb), 0.18);
  padding: 0 12px;
}''',
'''.cb-profile-right-top {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--cb-accent-rgb), 0.18);
  padding: 0 12px;
  overflow: visible;
  position: relative;
  z-index: 40;
}''',1)
spc=spc.replace(
'''.cb-profile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
}''',
'''.cb-profile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  overflow: visible;
  position: relative;
  z-index: 30;
}''',1)
# remove duplicate later block
spc=spc.replace(
'''.cb-profile-actions {
  overflow: visible;
  position: relative;
  z-index: 30;
}
''','',1)
with open(path,"w",encoding="utf-8",newline="\n") as f: f.write(spc)
print("merged profile-actions overflow")
