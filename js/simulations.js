/**
 * Simulations hub: Home-style hub-carousel of civic labs.
 * Primary card: LabradorSim (coolbrador.com). Optional ?lab= / saved origin for local desk.
 */
(function () {
  var STORAGE_HOST = "cb_labradorsim_origin";
  var DEFAULT_HREF = "https://coolbrador.com/simulations/labradorsim";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function card(opts) {
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
  }

  function wireCarousel(wrap) {
    if (!wrap) return;
    var track = wrap.querySelector(".hub-carousel-track");
    var prev = wrap.querySelector(".hub-carousel-btn.prev");
    var next = wrap.querySelector(".hub-carousel-btn.next");
    if (!track) return;

    function step() {
      var cardEl = track.querySelector(".hub-card, .hub-friend");
      if (!cardEl) return Math.max(180, Math.floor(track.clientWidth * 0.8));
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || "12") || 12;
      return cardEl.getBoundingClientRect().width + gap;
    }
    function updateBtns() {
      var max = track.scrollWidth - track.clientWidth - 2;
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft >= max;
      if (prev) {
        prev.disabled = atStart;
        prev.setAttribute("aria-disabled", atStart ? "true" : "false");
      }
      if (next) {
        next.disabled = atEnd || max <= 0;
        next.setAttribute("aria-disabled", (atEnd || max <= 0) ? "true" : "false");
      }
      wrap.classList.toggle("is-scrollable", max > 2);
    }
    if (prev) {
      prev.addEventListener("click", function () {
        track.scrollBy({ left: -step(), behavior: "smooth" });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        track.scrollBy({ left: step(), behavior: "smooth" });
      });
    }
    track.addEventListener("scroll", updateBtns, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(updateBtns).observe(track);
    } else {
      window.addEventListener("resize", updateBtns);
    }
    updateBtns();
  }

  /** Default is coolbrador.com. Optional ?lab= or saved local desk overrides for this browser. */
  function labradorSimHref() {
    try {
      var q = new URLSearchParams(location.search).get("lab");
      if (q) {
        var cleaned = q.replace(/\/$/, "");
        localStorage.setItem(STORAGE_HOST, cleaned);
        return cleaned;
      }
      var saved = localStorage.getItem(STORAGE_HOST);
      if (saved) return saved.replace(/\/$/, "");
    } catch (e) {}
    return DEFAULT_HREF;
  }

  function boot() {
    var track = document.getElementById("simsScroller");
    var carousel = document.getElementById("simsCarousel");
    if (!track) return;

    var href = labradorSimHref();
    var sims = [
      {
        title: "Simulations",
        sub: "Polls pick the best scenarios. Labradors and AI evolve Coolbrador features, mods, and norms in the civic lab.",
        href: href,
        img: "/img/PlanetChipperHomepage.png",
        fallback: "/img/ChipperRenderSaturated.png",
        cls: "community-card"
      }
    ];

    track.innerHTML = sims.map(card).join("");
    wireCarousel(carousel || track.closest(".hub-carousel"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
