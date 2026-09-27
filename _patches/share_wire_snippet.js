      var shareBtn = document.getElementById("shareToggle");
      var shareMenu = document.getElementById("shareMenu");
      var shareWrap = document.getElementById("shareWrap");
      if (shareMenu && shareWrap && shareMenu.parentElement !== shareWrap) {
        shareWrap.appendChild(shareMenu);
      }
      if (shareBtn && shareMenu) {
        shareMenu.querySelectorAll("[data-share-id]").forEach(function (el) { el.textContent = viewId; });
        shareMenu.style.top = "";
        shareMenu.style.left = "";
        shareBtn.onclick = function (e) {
          e.stopPropagation();
          shareMenu.hidden = !shareMenu.hidden;
        };
        shareMenu.onclick = function (e) { e.stopPropagation(); };
        shareMenu.querySelectorAll("[data-share]").forEach(function (btn) {
          btn.onclick = function () {
            var kind = btn.getAttribute("data-share");
            var path = "/users/" + encodeURIComponent(viewId) + (kind === "profile" ? "" : ("/" + kind));
            var url = location.origin + path;
            var done = function () {
              toast("Copied " + path);
              shareMenu.hidden = true;
            };
            if (window.CoolbradorPosts && typeof window.CoolbradorPosts.copyText === "function") {
              window.CoolbradorPosts.copyText(url, "Copied " + path);
              shareMenu.hidden = true;
              return;
            }
            copyText(url).then(done).catch(function () {
              try {
                var ta = document.createElement("textarea");
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
                done();
              } catch (err) {
                toast("Could not copy link");
              }
            });
          };
        });
        document.addEventListener("click", function () { shareMenu.hidden = true; });
      }
