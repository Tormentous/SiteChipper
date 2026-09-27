    function renderFeed() {
      var box = document.getElementById("profileFeed");
      if (!box) return;
      box.classList.add("hub-feed");

      var CP = window.CoolbradorPosts;
      var useCards = CP && typeof CP.renderPostCard === "function";

      function wireFeed() {
        if (CP && typeof CP.bindFeedInteractions === "function") {
          CP.bindFeedInteractions(box, {
            reload: renderFeed,
            onYeah: function () { renderFeed(); }
          });
        }
      }

      if (feedTab === "reposts") {
        var reposts = collectReposts(viewId);
        if (!reposts.length) {
          box.innerHTML = '<p class="empty-feed">No reposts yet.</p>';
          return;
        }
        if (useCards) {
          box.innerHTML = reposts.map(function (rp) {
            var snap = rp.snapshot || {};
            var post = {
              id: snap.id || rp.postId || rp.id || Date.now(),
              userId: snap.userId || "",
              username: snap.username || "Lab",
              text: snap.text || "",
              timestamp: rp.timestamp || snap.timestamp,
              board: rp.board || snap.board || "",
              media: snap.media || null,
              image: snap.image || null,
              video: snap.video || null,
              yeahs: snap.yeahs || [],
              replies: snap.replies || [],
              views: snap.views || 0
            };
            return CP.renderPostCard(post, {
              board: post.board,
              showBoard: true,
              className: "cb-repost-card",
              headerExtra: '<span class="cb-repost-label">Reposted</span>'
            });
          }).join("");
          wireFeed();
          return;
        }
        box.innerHTML = reposts.map(function (rp) {
          var snap = rp.snapshot || {};
          var board = (rp.board || snap.board || "").split("/").pop();
          var who = snap.username || "Lab";
          var body = escapeHtml(snap.text || "").replace(/\n/g, "<br>");
          return '<div class="post cb-repost-card" style="cursor:default;">' +
            '<div class="post-body">' +
              '<div class="post-header"><span class="cb-repost-label">Reposted</span>' +
                (board ? '<a class="post-board" href="/b/' + encodeURIComponent(board) + '/board.html">' + escapeHtml(board) + "</a>" : "") +
              "</div>" +
              '<div class="post-header"><strong>' + escapeHtml(who) + "</strong>" +
                '<span class="post-meta">' + escapeHtml(String(rp.timestamp || "").slice(0, 10)) + "</span></div>" +
              '<div class="post-text">' + body + "</div>" +
            "</div></div>";
        }).join("");
        return;
      }

      var items = collectPosts(viewId, feedTab);
      if (!items.length) {
        box.innerHTML = '<p class="empty-feed">' + (feedTab === "replies" ? "No replies yet." : "No posts yet.") + "</p>";
        return;
      }

      if (useCards) {
        box.innerHTML = items.map(function (p) {
          var opts = { board: p.board, showBoard: true };
          if (p.kind === "reply") {
            opts.className = "cb-reply-card";
            opts.headerExtra = '<span class="post-board">Reply</span>';
            if (p.parentText) {
              opts.textHtml =
                '<div class="post-text" style="opacity:.75;font-size:.9em;margin-bottom:6px;">' +
                escapeHtml(String(p.parentText).slice(0, 120)) +
                "</div>" +
                escapeHtml(p.text || "").replace(/\n/g, "<br>");
            }
          }
          return CP.renderPostCard(p, opts);
        }).join("");
        wireFeed();
        return;
      }

      box.innerHTML = items.map(function (p) {
        var board = (p.board || "").split("/").pop();
        var extra = p.kind === "reply" && p.parentText
          ? '<div class="post-header"><span class="post-board">Reply on ' + escapeHtml(board) + "</span></div>" +
            '<div class="post-text" style="opacity:.75;font-size:.9em;margin-bottom:6px;">' + escapeHtml(String(p.parentText).slice(0, 120)) + "</div>"
          : '<div class="post-header"><span class="post-board">' + escapeHtml(board) + "</span></div>";
        return '<div class="post" style="cursor:default;"><div class="post-body">' + extra +
          '<div class="post-text">' + escapeHtml(p.text || "").replace(/\n/g, "<br>") + "</div></div></div>";
      }).join("");
    }

