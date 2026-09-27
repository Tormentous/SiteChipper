/**
 * CoolbradorFeedAlgo — lightweight engagement ranking.
 * Mixes recency, yeahs, replies, media, and a small shuffle so the feed
 * stays fresh without feeling like pure noise.
 */
(function (global) {
  "use strict";

  function yeahCount(p) {
    if (!p) return 0;
    if (Array.isArray(p.yeahs)) return p.yeahs.length;
    return Number(p.yeahCount) || 0;
  }
  function replyCount(p) {
    if (!p) return 0;
    if (Array.isArray(p.replies)) return p.replies.length;
    return Number(p.replyCount) || 0;
  }
  function hasMedia(p) {
    return !!(p && (p.media || (p.medias && p.medias.length) || p.mediaUrl));
  }
  function ts(p) {
    var t = Date.parse((p && (p.timestamp || p.createdAt || p.time)) || "") || Number(p && p.id) || 0;
    return t;
  }

  function scorePost(p, now) {
    now = now || Date.now();
    var ageH = Math.max(0, (now - ts(p)) / 3600000);
    var recency = Math.exp(-ageH / 36);
    var yeahs = yeahCount(p);
    var replies = replyCount(p);
    var views = Number(p && p.views) || 0;
    var media = hasMedia(p) ? 1.25 : 1;
    var social = Math.log(1 + yeahs * 2 + replies * 3 + views * 0.05);
    var jitter = 0.85 + Math.random() * 0.3;
    return (0.55 * recency + 0.45 * (social / 5)) * media * jitter;
  }

  function rankPosts(posts, opts) {
    opts = opts || {};
    var list = (posts || []).slice();
    var now = Date.now();
    list.forEach(function (p) {
      p._cbScore = scorePost(p, now);
    });
    list.sort(function (a, b) {
      return (b._cbScore || 0) - (a._cbScore || 0);
    });
    if (opts.diversity !== false) {
      var out = [];
      var skipped = [];
      var lastAuthor = "";
      var streak = 0;
      list.forEach(function (p) {
        var a = String((p && (p.userId || p.username)) || "");
        if (a && a === lastAuthor && streak >= 2) {
          skipped.push(p);
          return;
        }
        out.push(p);
        if (a === lastAuthor) streak++;
        else {
          lastAuthor = a;
          streak = 1;
        }
      });
      list = out.concat(skipped);
    }
    if (opts.limit) list = list.slice(0, opts.limit);
    return list;
  }

  function pickRandom(pool, n) {
    var arr = (pool || []).slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr.slice(0, Math.max(0, n || 5));
  }

  global.CoolbradorFeedAlgo = {
    scorePost: scorePost,
    rankPosts: rankPosts,
    pickRandom: pickRandom
  };
})(typeof window !== "undefined" ? window : this);
