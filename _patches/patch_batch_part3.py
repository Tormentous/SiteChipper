# -*- coding: utf-8 -*-
import os, re
ROOT = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"

def read(rel):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def write(rel, text):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", rel)

# ========== styles.css: sidebar user + support + gift coming soon ==========
css = read("styles.css")

old_side = '''.cb-sidebar-user {
  padding: 8px 12px 14px;
  margin: 0 0 4px;
  font-weight: 800;
  font-size: 1.05rem;
  color: #fff;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-sidebar-user {
  display: none;
}'''

new_side = '''.cb-sidebar-user {
  position: relative;
  box-sizing: border-box;
  min-height: 1.4em;
  padding: 8px 12px 14px;
  margin: 0 0 4px;
  font-weight: 800;
  font-size: 1.05rem;
  line-height: 1.4em;
  color: #fff;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: visible;
  text-overflow: ellipsis;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.cb-sidebar-user.is-signed-out {
  min-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}
.cb-sidebar-user-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cb-sidebar-user-initials {
  display: none;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--cb-navy, #0b1b3a);
  background: var(--cb-accent, #7ec8ff);
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-sidebar-user {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 4px;
  margin: 0 0 6px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  overflow: visible;
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-sidebar-user.is-signed-out {
  display: none;
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-sidebar-user-name,
body.has-cb-sidebar.cb-sidebar-collapsed .cb-skel-line-side {
  display: none !important;
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-sidebar-user-initials {
  display: inline-flex;
}
.cb-side-user-menu {
  position: absolute;
  top: calc(100% - 4px);
  left: 8px;
  right: 8px;
  z-index: 4000;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--cb-navy, #0b1b3a);
  border: 1px solid rgba(var(--cb-accent-rgb, 126, 200, 255), 0.35);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}
.cb-side-user-menu[hidden] { display: none !important; }
.cb-side-user-menu a,
.cb-side-user-menu button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--cb-text, #fff);
  text-align: left;
  padding: 10px 12px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  border-radius: 6px;
}
.cb-side-user-menu a:hover,
.cb-side-user-menu button:hover {
  background: rgba(var(--cb-accent-rgb, 126, 200, 255), 0.16);
}
body.has-cb-sidebar.cb-sidebar-collapsed .cb-side-user-menu {
  left: calc(100% + 8px);
  right: auto;
  top: 0;
  min-width: 160px;
}'''

if old_side not in css:
    raise SystemExit("sidebar user css not found")
css = css.replace(old_side, new_side, 1)

# Append support + coming-soon styles if missing
extra = '''

/* Support page */
.support-page {
  max-width: 720px;
  margin: 24px auto 48px;
  padding: 0 20px 40px;
  color: var(--cb-text);
}
.support-page .section-header {
  text-align: center;
  color: var(--cb-accent);
  margin-bottom: 8px;
}
.support-lede {
  text-align: center;
  color: var(--cb-muted);
  margin: 0 auto 20px;
  max-width: 36rem;
}
.support-card {
  background: color-mix(in srgb, var(--cb-surface) 70%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.22);
  border-radius: 14px;
  padding: 22px 24px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
}
.support-card h2 {
  margin: 18px 0 8px;
  color: var(--cb-accent);
  font-size: 1.05rem;
}
.support-card h2:first-child { margin-top: 0; }
.support-card p,
.support-card li {
  color: var(--cb-text);
  line-height: 1.55;
}
.support-card a { color: var(--cb-accent); }
.support-list {
  margin: 0;
  padding-left: 1.2rem;
}
.support-list li { margin: 6px 0; }

/* Coming soon overlay (Gift Drive etc.) */
.cb-coming-soon-wrap {
  position: relative;
  pointer-events: none;
}
.cb-coming-soon-wrap > *:not(.cb-coming-soon-overlay) {
  pointer-events: none;
  filter: saturate(0.85);
}
.cb-coming-soon-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px;
  border-radius: inherit;
  background: color-mix(in srgb, var(--cb-navy) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
  color: var(--cb-text);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: auto;
  backdrop-filter: blur(2px);
}
.cb-coming-soon-overlay span {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cb-surface) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.4);
  color: var(--cb-accent);
}
.gift-page.cb-coming-soon-page {
  position: relative;
}
.gift-page.cb-coming-soon-page .cb-coming-soon-overlay {
  position: absolute;
  inset: 0;
  min-height: 60vh;
  border-radius: 16px;
}
'''

if ".support-page {" not in css:
    css += extra
elif "cb-coming-soon-wrap" not in css:
    css += '''

/* Coming soon overlay (Gift Drive etc.) */
.cb-coming-soon-wrap {
  position: relative;
  pointer-events: none;
}
.cb-coming-soon-wrap > *:not(.cb-coming-soon-overlay) {
  pointer-events: none;
  filter: saturate(0.85);
}
.cb-coming-soon-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px;
  border-radius: inherit;
  background: color-mix(in srgb, var(--cb-navy) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
  color: var(--cb-text);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: auto;
  backdrop-filter: blur(2px);
}
.cb-coming-soon-overlay span {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--cb-surface) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.4);
  color: var(--cb-accent);
}
.gift-page.cb-coming-soon-page {
  position: relative;
}
.gift-page.cb-coming-soon-page .cb-coming-soon-overlay {
  position: absolute;
  inset: 0;
  min-height: 60vh;
  border-radius: 16px;
}
'''

write("styles.css", css)

# ========== styles-profile.css: card centering + share overflow ==========
spc = read("styles-profile.css")
old_card = '''.cb-business-card {
  aspect-ratio: 3.5 / 2;
  width: min(100%, 720px);
  max-width: 100%;
  margin: 0 auto 12px;
  display: flex;
  align-items: stretch;
}
.cb-business-card > .cb-card-layout {
  flex: 1;
  min-height: 0;
  height: 100%;
}
.cb-card-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 14px;
}
.cb-card-col {
  background: color-mix(in srgb, var(--cb-surface) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.16);
  padding: 16px;
  min-height: 240px;
}'''

new_card = '''.cb-business-card {
  aspect-ratio: 3.5 / 2;
  width: min(100%, 720px);
  max-width: 100%;
  margin: 12px auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cb-business-card > .cb-card-layout {
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  align-self: stretch;
}
.cb-card-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 14px;
  align-items: stretch;
  height: 100%;
}
.cb-card-col {
  background: color-mix(in srgb, var(--cb-surface) 55%, transparent);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.16);
  padding: 16px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.cb-card-col.cb-card-about,
.cb-card-col.cb-card-socials {
  align-items: stretch;
  text-align: left;
}
.cb-card-col.cb-card-about > *,
.cb-card-col.cb-card-socials > * {
  width: 100%;
}
.cb-card-identity {
  align-items: center;
  justify-content: center;
  text-align: center;
}'''

if old_card not in spc:
    raise SystemExit("business card css not found")
spc = spc.replace(old_card, new_card, 1)

# Ensure share wrap doesn't clip
old_share = '''.cb-share-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.cb-share-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 3500;
  min-width: 220px;
  background: var(--cb-navy);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
  padding: 6px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}'''

new_share = '''.cb-share-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  overflow: visible;
  z-index: 20;
}
.cb-profile-actions {
  overflow: visible;
  position: relative;
  z-index: 30;
}
.cb-share-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 4000;
  min-width: 220px;
  background: var(--cb-navy);
  border: 1px solid rgba(var(--cb-accent-rgb), 0.35);
  padding: 6px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}'''

if old_share not in spc:
    raise SystemExit("share css not found")
spc = spc.replace(old_share, new_share, 1)
write("styles-profile.css", spc)

# ========== support.html ==========
support = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/img/favicon3.ico" type="image/x-icon">
  <title>Support - Coolbrador</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <div id="shared-header"></div>
  <main class="support-page">
    <h1 class="section-header">Support</h1>
    <p class="support-lede">Lost in the stars? We got you, casually. Coolbrador support is for Labradors first.</p>
    <div class="support-card">
      <h2>Email</h2>
      <p>Hit <a href="mailto:support@coolbrador.com">support@coolbrador.com</a> and tell us what broke. Screenshots welcome.</p>
      <h2>Quick links</h2>
      <ul class="support-list">
        <li><a href="/login.html">Login / account issues</a></li>
        <li><a href="/settings.html">Settings and profile</a></li>
        <li><a href="/polls.html">Report an Issue or start a Mutiny</a></li>
        <li><a href="/community.html">Ask the community</a></li>
        <li><a href="/games/chipper.html">Chipper game page</a></li>
        <li><a href="/gift.html">Gift / giveaway questions</a></li>
      </ul>
      <h2>FAQ (tiny)</h2>
      <p><strong>Where are my posts?</strong> Local demo data lives in your browser (localStorage). Clearing site data clears posts.</p>
      <p><strong>Payments?</strong> Donate buttons on Gift are placeholders. No real charges.</p>
      <p><strong>People?</strong> Around here, people means Labradors.</p>
    </div>
  </main>
  <div id="shared-footer"></div>
  <script src="/js/layout.js"></script>
</body>
</html>
'''
write("support.html", support)

# ========== gift.html coming soon ==========
gift = read("gift.html")
if "cb-coming-soon" not in gift:
    gift = gift.replace(
        '<div class="container gift-page">',
        '<div class="container gift-page cb-coming-soon-page">\n    <div class="cb-coming-soon-overlay" aria-hidden="true"><span>Coming soon</span></div>',
        1
    )
    # neutralize donate buttons
    gift = gift.replace('class="donate-btn"', 'class="donate-btn" disabled tabindex="-1"', 3)
    write("gift.html", gift)
else:
    print("gift already has coming soon")

# ========== home.js GiftDrive overlay ==========
home = read("js/home.js")
old_card_fn = '''  function card(opts) {
    var fallback = opts.fallback || "";
    var onerr = fallback
      ? "this.onerror=null;this.src='" + fallback + "';"
      : "this.onerror=null;this.parentElement.classList.add('no-img');this.remove();";
    return (
      '<a class="hub-card ' + (opts.cls || "") + '" href="' + opts.href + '">' +
      (opts.img
        ? '<div class="hub-card-thumb"><img src="' + opts.img + '" alt="" onerror="' + onerr + '"></div>'
        : '<div class="hub-card-thumb placeholder"></div>') +
      '<div class="hub-card-body"><strong>' + escapeHtml(opts.title) + '</strong>' +
      (opts.sub ? '<span>' + escapeHtml(opts.sub) + '</span>' : '') +
      '</div></a>'
    );
  }'''

new_card_fn = '''  function card(opts) {
    var fallback = opts.fallback || "";
    var onerr = fallback
      ? "this.onerror=null;this.src='" + fallback + "';"
      : "this.onerror=null;this.parentElement.classList.add('no-img');this.remove();";
    var coming = !!opts.comingSoon;
    var cls = (opts.cls || "") + (coming ? " cb-coming-soon-wrap" : "");
    var href = coming ? "#" : opts.href;
    var overlay = coming ? '<div class="cb-coming-soon-overlay"><span>Coming soon</span></div>' : "";
    return (
      '<a class="hub-card ' + cls + '" href="' + href + '"' + (coming ? ' aria-disabled="true" tabindex="-1"' : "") + '>' +
      (opts.img
        ? '<div class="hub-card-thumb"><img src="' + opts.img + '" alt="" onerror="' + onerr + '"></div>'
        : '<div class="hub-card-thumb placeholder"></div>') +
      '<div class="hub-card-body"><strong>' + escapeHtml(opts.title) + '</strong>' +
      (opts.sub ? '<span>' + escapeHtml(opts.sub) + '</span>' : '') +
      '</div>' + overlay + '</a>'
    );
  }'''

if old_card_fn not in home:
    raise SystemExit("home card fn not found")
home = home.replace(old_card_fn, new_card_fn, 1)

old_map = '''          return card({
            title: label,
            sub: (n === 1 ? "1 post" : n + " posts") + " - " + boardDesc(b),
            href: "/b/" + b + "/board.html",
            img: boardIcon(b),
            fallback: boardFallback(b),
            cls: "community-card"
          });'''

new_map = '''          return card({
            title: label,
            sub: (n === 1 ? "1 post" : n + " posts") + " - " + boardDesc(b),
            href: "/b/" + b + "/board.html",
            img: boardIcon(b),
            fallback: boardFallback(b),
            cls: "community-card",
            comingSoon: b.toLowerCase() === "giftdrive"
          });'''

if old_map not in home:
    raise SystemExit("home board card map not found")
home = home.replace(old_map, new_map, 1)
write("js/home.js", home)

# Remove orphan static shareMenu from profile index (now injected in actions)
prof = read("users/profile/index.html")
old_static = '''
    <!-- Share menu -->
    <!-- Share menu template; JS moves into .cb-share-wrap under #profileActions -->
    <div class="cb-share-menu" id="shareMenu" hidden>
      <button type="button" data-share="profile">Share Profile <span class="cb-share-eg">/users/<span data-share-id>0</span></span></button>
      <button type="button" data-share="card">Share Card <span class="cb-share-eg">/users/<span data-share-id>0</span>/card</span></button>
      <button type="button" data-share="links">Share Links <span class="cb-share-eg">/users/<span data-share-id>0</span>/links</span></button>
    </div>'''
if old_static in prof:
    prof = prof.replace(old_static, "\n    <!-- share menu built into #profileActions by profile.js -->", 1)
    write("users/profile/index.html", prof)
else:
    print("static shareMenu already removed or different")

print("part3 OK")
