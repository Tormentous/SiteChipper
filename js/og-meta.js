/**
 * Coolbrador Open Graph / Twitter card helpers (browser + share previews).
 * Discord only sees tags present in the first HTML response; post-thread.js
 * still updates these for browsers and for hosts that prerender.
 */
(function (global) {
  "use strict";

  function ensureMeta(attr, key, content) {
    if (content == null || content === "") return;
    var sel = "meta[" + attr + '="' + key + '"]';
    var el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", String(content));
  }

  function ensureLink(rel, href, extras) {
    if (!href) return;
    var el = document.head.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
    if (extras) {
      Object.keys(extras).forEach(function (k) { el.setAttribute(k, extras[k]); });
    }
  }

  function absUrl(u) {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.charAt(0) === "/") return location.origin + u;
    return location.origin + "/" + u;
  }

  function apply(opts) {
    opts = opts || {};
    var title = opts.title || "Coolbrador";
    var desc = opts.description || "Coolbrador  -  Labrador communities, Chipper, and civic sims.";
    var image = absUrl(opts.image || "/img/PlanetChipperHomepage.png");
    var url = opts.url || location.href.split("#")[0];
    var site = opts.siteName || "Coolbrador";

    document.title = title.indexOf("Coolbrador") >= 0 ? title : (title + " | Coolbrador");

    ensureMeta("property", "og:site_name", site);
    ensureMeta("property", "og:type", opts.type || "article");
    ensureMeta("property", "og:title", title);
    ensureMeta("property", "og:description", desc);
    ensureMeta("property", "og:image", image);
    ensureMeta("property", "og:url", url);
    ensureMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    ensureMeta("name", "twitter:title", title);
    ensureMeta("name", "twitter:description", desc);
    ensureMeta("name", "twitter:image", image);
    ensureMeta("name", "description", desc);

    ensureLink("icon", "/img/favicon3.ico", { type: "image/x-icon", sizes: "any" });
    ensureLink("shortcut icon", "/img/favicon3.ico", { type: "image/x-icon" });
    ensureLink("apple-touch-icon", "/img/favicon3.ico");
  }

  function fromPost(board, post, permalink) {
    post = post || {};
    var text = String(post.text || "").replace(/\s+/g, " ").trim();
    var titleCore = text || "Post";
    if (titleCore.length > 90) titleCore = titleCore.slice(0, 87) + "...";
    var boardName = board || post.board || "Coolbrador";
    var media = post.media || null;
    var image = "";
    if (media) {
      var url = media.url || media.src || "";
      var type = media.type || "";
      if (url && type !== "video" && !/\.(mp4|webm|mov)(\?|$)/i.test(url)) image = url;
    }
    apply({
      title: boardName + "  -  " + titleCore,
      description: text || ("A post on " + boardName),
      image: image || "/img/PlanetChipperHomepage.png",
      url: permalink || location.href.split("#")[0],
      type: "article"
    });
  }

  global.CoolbradorOg = { apply: apply, fromPost: fromPost, absUrl: absUrl };
})(typeof window !== "undefined" ? window : this);
