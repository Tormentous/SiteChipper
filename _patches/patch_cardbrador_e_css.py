# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]\n---\n{old[:300]}\n---")
    return text.replace(old, new, 1)

# styles-profile.css — rhombus tabs like polls
prof = ROOT / "styles-profile.css"
pt = prof.read_text(encoding="utf-8")
pt = must_replace(
    pt,
    '''.cb-box-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.cb-box-tab {
  appearance: none;
  border: 1px solid rgba(var(--cb-accent-rgb), 0.28);
  background: color-mix(in srgb, var(--cb-surface) 65%, transparent);
  color: var(--cb-muted);
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 700;
}
.cb-box-tab.is-active {
  color: var(--cb-text);
  border-color: rgba(var(--cb-accent-rgb), 0.55);
  background: rgba(var(--cb-accent-rgb), 0.16);
  box-shadow: 0 0 0 1px rgba(var(--cb-accent-rgb), 0.2);
}''',
    '''.cb-box-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 14px;
  flex-wrap: wrap;
  justify-content: flex-start;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  padding-bottom: 0.75rem;
}
.cb-box-tab {
  appearance: none;
  border: 1px solid transparent;
  background: rgba(0,0,0,0.45);
  color: #fff;
  padding: 0.65rem 1.55rem;
  cursor: pointer;
  font-weight: 700;
  /* Match polls page .poll-tab rhombus / parallelogram */
  clip-path: polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%);
  border-radius: 0;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
}
.cb-box-tab:hover { transform: scale(1.05); }
.cb-box-tab.is-active {
  color: var(--cb-text);
  border-color: var(--cb-accent);
  background: rgba(var(--cb-accent-rgb), 0.35);
  box-shadow: 0 0 18px rgba(var(--cb-accent-rgb), 0.4);
}
html[data-mode="light"] .cb-box-tab {
  background: rgba(0,0,0,0.06);
  color: var(--cb-text);
}
html[data-mode="light"] .cb-box-tab.is-active {
  background: rgba(var(--cb-accent-rgb), 0.22);
}''',
    "profile rhombus tabs"
)
prof.write_text(pt, encoding="utf-8")
print("OK styles-profile.css")

# styles.css — avatar col + tool-btn polls style + group edit btn
css = ROOT / "styles.css"
ct = css.read_text(encoding="utf-8")

ct = must_replace(
    ct,
    '''.post > .post-avatar,
.post > .post-body {
  position: relative;
  z-index: 1;
}
.post > .post-body { pointer-events: none; }''',
    '''.post > .post-avatar,
.post > .post-avatar-col,
.post > .post-body {
  position: relative;
  z-index: 1;
}
.post > .post-body { pointer-events: none; }
/* Left column is not a profile hit target — only the avatar image link is. */
.post-avatar-col {
  flex: 0 0 auto;
  align-self: flex-start;
  pointer-events: none;
  line-height: 0;
}
.post-avatar-col .post-avatar,
.post-avatar-col a.post-avatar {
  pointer-events: auto;
  display: inline-block;
  line-height: 0;
}''',
    "avatar-col css"
)

ct = must_replace(
    ct,
    '''.post-tools { display: flex; gap: 0px; align-items: center; }
.tool-btn {
  background: none;
  border: none;
  color: var(--cb-accent);
  font-size: 15px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}
.tool-btn:hover { background: rgba(var(--cb-accent-rgb),0.1); }''',
    '''.post-tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tool-btn {
  background: rgba(var(--cb-accent-rgb), 0.12);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
  color: rgb(var(--cb-accent-rgb));
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 7px 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tool-btn i { font-size: 0.95em; }
.tool-btn:hover { background: rgba(var(--cb-accent-rgb),0.2); }''',
    "tool-btn polls style"
)

# Append group edit button style near msg styles if not present
if ".cb-msg-group-edit-btn" not in ct:
    needle = ".cb-msg-profile-link"
    idx = ct.find(needle)
    if idx < 0:
        raise SystemExit("MISSING cb-msg-profile-link for insert")
    # find end of that rule block roughly — just append after messages section start
    insert_at = ct.find("body.messages-page .cb-msg-shell")
    if insert_at < 0:
        insert_at = len(ct)
    snippet = '''
.cb-msg-group-edit-btn {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--cb-accent);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.cb-msg-group-edit-btn:hover { color: var(--cb-accent-text, #fff); }

'''
    ct = ct[:insert_at] + snippet + ct[insert_at:]

css.write_text(ct, encoding="utf-8")
print("OK styles.css")

# gift.js Cardbrador id
gift = ROOT / "js" / "gift.js"
gt = gift.read_text(encoding="utf-8")
if 'Cardbrador: "0"' in gt:
    gt = gt.replace('Cardbrador: "0"', 'Cardbrador: "2"', 1)
    gift.write_text(gt, encoding="utf-8")
    print("OK gift.js Cardbrador->2")
else:
    print("gift.js already ok or different")
