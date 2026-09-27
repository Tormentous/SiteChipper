# -*- coding: utf-8 -*-
import os, re, shutil

SITE = r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"

def read(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def write(p, t):
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(t)

# 1) overwrite scrub js
shutil.copy2(os.path.join(SITE, "_batch4", "cb-scrub-chart.js"), os.path.join(SITE, "js", "cb-scrub-chart.js"))
print("scrub js copied")

# 2) merge CSS: replace prior batch4b block or append
css_path = os.path.join(SITE, "styles.css")
css = read(css_path)
add = read(os.path.join(SITE, "_batch4", "batch-additions.css"))
# Take only the kalshi scrub chrome section if full file already applied
marker = "/* === batch4b: Kalshi scrub chrome"
if marker in add:
    add_b = add[add.find(marker):]
else:
    add_b = add
if marker in css:
    css = css[: css.find(marker)].rstrip() + "\n\n" + add_b
else:
    # also refresh full batch4 block from additions if present
    if "/* === batch4:" in css and "/* === batch4:" in add:
        # keep existing batch4, just append 4b
        css = css.rstrip() + "\n\n" + add_b
    else:
        css = css.rstrip() + "\n\n" + add_b
write(css_path, css)
print("css updated", len(css))

# 3) Force bindPolyChart to prefer shared scrub
polls = os.path.join(SITE, "js", "polls.js")
pt = read(polls)
if "CoolbradorScrubChart" not in pt or "bindPolyChart__legacy" not in pt:
    # unwrap any half wrap then re-wrap
    if "function bindPolyChart__legacy" in pt:
        print("already wrapped")
    elif "function bindPolyChart(" in pt:
        pt = pt.replace(
            "function bindPolyChart(",
            """function bindPolyChart(root) {
    try {
      if (!root || !window.CoolbradorScrubChart) return bindPolyChart__legacy.apply(this, arguments);
      var wrap = root.querySelector && (
        root.querySelector(".poll-poly-wrap") ||
        root.querySelector("[data-poly]") ||
        root.querySelector(".cb-scrub-host")
      );
      if (!wrap) return bindPolyChart__legacy.apply(this, arguments);
      if (wrap._cbScrubBound) return;
      var raw = wrap.getAttribute("data-poly");
      var payload = null;
      if (raw) {
        try { payload = JSON.parse(decodeURIComponent(raw)); } catch (e1) {
          try { payload = JSON.parse(raw); } catch (e2) { payload = null; }
        }
      }
      // Also accept sides + history from dataset or sibling state
      if (!payload && root._pollPoly) payload = root._pollPoly;
      if (!payload) return bindPolyChart__legacy.apply(this, arguments);
      var sides = payload.sides || payload.series || [];
      var hist = payload.history || [];
      var series = sides.map(function (s, i) {
        var id = s.id || String(i);
        var name = s.short || s.name || s.label || id;
        var points;
        if (hist.length) {
          points = hist.map(function (h) {
            var pctMap = h.pct || h;
            return { t: Number(h.t || h.time || Date.now()), v: Number(pctMap[id] != null ? pctMap[id] : pctMap[s.id]) || 0 };
          });
        } else if (s.points) {
          points = s.points;
        } else {
          var now = Date.now();
          points = [{ t: now - 7200000, v: 0 }, { t: now, v: Number(s.pct) || 0 }];
        }
        return { id: id, name: name, color: s.color || null, points: points };
      });
      var host = document.createElement("div");
      host.className = "cb-scrub-host";
      wrap.innerHTML = "";
      wrap.appendChild(host);
      CoolbradorScrubChart.mount(host, { series: series, height: 220 });
      wrap._cbScrubBound = true;
      wrap._polyBound = true;
      return;
    } catch (err) {
      try { console.warn("CoolbradorScrubChart poly wrap failed", err); } catch (_) {}
    }
    return bindPolyChart__legacy.apply(this, arguments);
  }
  function bindPolyChart__legacy(""",
            1,
        )
        write(polls, pt)
        print("bindPolyChart wrapped for shared scrub")
    else:
        print("WARN bindPolyChart not found")
else:
    print("polls already references CoolbradorScrubChart")

# 4) board-tabs should call CoolbradorScrubChart.mount — verify
bt = read(os.path.join(SITE, "js", "board-tabs.js"))
if "CoolbradorScrubChart" not in bt:
    # replace any old chart mount
    bt2 = bt.replace("CoolbradorScrubChart", "CoolbradorScrubChart")
    if "CoolbradorScrubChart" not in bt2:
        print("WARN board-tabs missing scrub API — check file")
        print("snippet", bt[bt.find("favor"):bt.find("favor")+200] if "favor" in bt else bt[:200])
    else:
        write(os.path.join(SITE, "js", "board-tabs.js"), bt2)
else:
    print("board-tabs has CoolbradorScrubChart")

# 5) Ensure HTML pages load scrub before polls/board-tabs
tags = '<script src="/js/cb-scrub-chart.js"></script>\n'
for root, dirs, files in os.walk(SITE):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('_batch4','node_modules')]
    for f in files:
        if not f.endswith('.html'): continue
        path = os.path.join(root, f)
        t = read(path)
        if 'cb-scrub-chart.js' in t: continue
        if not any(x in t for x in ('polls.js', 'board-tabs.js')): continue
        t2 = t
        if re.search(r'<script[^>]+/js/polls\.js', t2):
            t2 = re.sub(r'(<script[^>]+/js/polls\.js[^>]*>)', tags + r'\1', t2, count=1)
        elif re.search(r'<script[^>]+/js/board-tabs\.js', t2):
            t2 = re.sub(r'(<script[^>]+/js/board-tabs\.js[^>]*>)', tags + r'\1', t2, count=1)
        if t2 != t:
            write(path, t2)
            print("script", os.path.relpath(path, SITE))

print("DONE wire")
