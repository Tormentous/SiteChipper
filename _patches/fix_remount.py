# -*- coding: utf-8 -*-
import os
ROOT=r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09"
path=os.path.join(ROOT,"js","posts.js")
with open(path,"r",encoding="utf-8") as f:
    ps=f.read()
old='''      try {
        var retry = function () {
          if (!hasLocalSession() && !isSignedIn()) return;
          var el = keepId ? document.getElementById(keepId) : null;
          if (!el && parent) el = parent.querySelector(".cb-composer-signed-out");
          if (!el) return;
          // Restore a basic composer shell then remount.
          el.className = "create-post-container" + (opts.containerClass ? (" " + opts.containerClass) : "");
          el.innerHTML = composerHTML({ mode: mode, boardInput: !!opts.boardInput || opts.requireBoard !== false });
          mountComposer(el, opts);
        };
        window.addEventListener("cb-auth-ready", retry, { once: true });
        window.addEventListener("cb-auth-changed", retry, { once: true });
      } catch (e) {}'''
new='''      try {
        var retry = function () {
          if (!hasLocalSession() && !isSignedIn()) return;
          var el = keepId ? document.getElementById(keepId) : null;
          if (!el && parent) el = parent.querySelector(".cb-composer-signed-out");
          if (!el) return;
          var html = composerHTML({
            mode: mode,
            showBoard: opts.requireBoard !== false && mode !== "comment",
            containerId: keepId,
            containerClass: opts.containerClass || "",
            defaultBoard: opts.defaultBoard || "General"
          });
          el.outerHTML = html;
          var fresh = keepId ? document.getElementById(keepId) : (parent && parent.querySelector(".create-post-container"));
          if (fresh) mountComposer(fresh, opts);
        };
        window.addEventListener("cb-auth-ready", retry, { once: true });
        window.addEventListener("cb-auth-changed", retry, { once: true });
      } catch (e) {}'''
if old not in ps:
    raise SystemExit("retry block not found")
ps=ps.replace(old,new,1)
with open(path,"w",encoding="utf-8",newline="\n") as f:
    f.write(ps)
print("fixed remount")
