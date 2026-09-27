/**
 * CoolbradorScrubChart — shared Kalshi/Polymarket-style scrub chart.
 * Colors from CSS variables only. One script for polls, mods, and anywhere else.
 *
 * Scrub UX (from Kalshi demo):
 * - dashed vertical cursor + timestamp at top
 * - dots on each series at the scrub X
 * - stacked ticker/% labels near the cursor
 * - past (left) full color; future (right) muted via clip
 * - idle: no cursor; labels rest on the right edge at latest values
 */
(function (global) {
  "use strict";

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function theme() {
    return {
      text: cssVar("--cb-text", "#e8edf3"),
      muted: cssVar("--cb-muted", "#8b95a5"),
      line: cssVar("--cb-border", "rgba(255,255,255,0.12)"),
      accent: cssVar("--cb-accent", "#7aa2ff"),
      green: cssVar("--cb-success", "#00c805"),
      red: cssVar("--cb-danger", "#ff5a5a"),
      surface: cssVar("--cb-surface", "#0b1020")
    };
  }

  function palette(n) {
    var th = theme();
    var base = [th.accent, th.green, "#c9a227", th.red, "#c084fc", "#22d3ee", "#fb7185"];
    return base.slice(0, Math.max(n, 1));
  }

  function fmtPct(n) {
    n = Number(n) || 0;
    return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "") + "%";
  }

  function fmtStamp(t) {
    try {
      var d = new Date(t);
      var mon = d.toLocaleString([], { month: "short" }).toUpperCase();
      var day = d.getDate();
      var hr = d.getHours();
      var ap = hr >= 12 ? "PM" : "AM";
      hr = hr % 12;
      if (!hr) hr = 12;
      return mon + " " + day + ", " + hr + " " + ap;
    } catch (_) {
      return "";
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(seriesIn) {
    return (seriesIn || []).map(function (s, idx) {
      var pts = (s.points || s.data || []).map(function (p) {
        return {
          t: Number(p.t != null ? p.t : p.time),
          v: Number(p.v != null ? p.v : p.value)
        };
      }).filter(function (p) {
        return isFinite(p.t) && isFinite(p.v);
      }).sort(function (a, b) {
        return a.t - b.t;
      });
      return {
        id: String(s.id != null ? s.id : idx),
        name: s.name || s.label || ("Side " + (idx + 1)),
        color: s.color || null,
        points: pts
      };
    }).filter(function (s) {
      return s.points.length;
    });
  }

  function interp(points, t) {
    if (!points.length) return 0;
    if (t <= points[0].t) return points[0].v;
    if (t >= points[points.length - 1].t) return points[points.length - 1].v;
    for (var i = 0; i < points.length - 1; i++) {
      var a = points[i];
      var b = points[i + 1];
      if (t >= a.t && t <= b.t) {
        var u = (t - a.t) / Math.max(1, b.t - a.t);
        return a.v + (b.v - a.v) * u;
      }
    }
    return points[points.length - 1].v;
  }

  function pathD(points, xAt, yAt) {
    return points.map(function (p, i) {
      return (i ? "L" : "M") + xAt(p.t).toFixed(2) + " " + yAt(p.v).toFixed(2);
    }).join(" ");
  }

  function mount(host, opts) {
    if (!host) return null;
    opts = opts || {};
    var series = normalize(opts.series || []);
    if (!series.length) {
      host.innerHTML = '<p class="cb-muted">No history yet.</p>';
      return null;
    }
    var colors = palette(series.length);
    series.forEach(function (s, i) {
      if (!s.color) s.color = colors[i % colors.length];
    });

    var t0 = Infinity;
    var t1 = -Infinity;
    series.forEach(function (s) {
      s.points.forEach(function (p) {
        if (p.t < t0) t0 = p.t;
        if (p.t > t1) t1 = p.t;
      });
    });
    if (!(t1 > t0)) {
      t1 = Date.now();
      t0 = t1 - 3600000;
      series.forEach(function (s) {
        var v = s.points[0] ? s.points[0].v : 0;
        s.points = [{ t: t0, v: Math.max(0, v * 0.2) }, { t: t1, v: v }];
      });
    }

    var w = Math.max(280, host.clientWidth || opts.width || 640);
    var h = opts.height || 220;
    var padL = 8;
    var padR = 44;
    var padT = 28;
    var padB = 28;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    var span = Math.max(1, t1 - t0);
    var uid = "cbscrub" + Math.random().toString(36).slice(2, 9);

    function xAt(t) {
      return padL + ((t - t0) / span) * plotW;
    }
    function yAt(v) {
      return padT + ((100 - Math.max(0, Math.min(100, v))) / 100) * plotH;
    }

    // Y grid
    var grid = "";
    var yTicks = [0, 25, 50, 75, 100];
    yTicks.forEach(function (v) {
      var y = yAt(v);
      grid +=
        '<line class="cb-scrub-grid" x1="' + padL + '" y1="' + y.toFixed(1) +
        '" x2="' + (padL + plotW).toFixed(1) + '" y2="' + y.toFixed(1) + '" />' +
        '<text class="cb-scrub-yaxis" x="' + (w - 6) + '" y="' + (y + 3).toFixed(1) +
        '" text-anchor="end">' + v + "%</text>";
    });

    var mutedPaths = series.map(function (s) {
      return (
        '<path class="cb-scrub-line cb-scrub-line-muted" d="' + pathD(s.points, xAt, yAt) +
        '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />'
      );
    }).join("");

    var brightPaths = series.map(function (s) {
      return (
        '<path class="cb-scrub-line cb-scrub-line-bright" d="' + pathD(s.points, xAt, yAt) +
        '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />'
      );
    }).join("");

    var endDots = series.map(function (s) {
      var last = s.points[s.points.length - 1];
      return (
        '<circle class="cb-scrub-end" data-id="' + s.id + '" cx="' + xAt(last.t).toFixed(1) +
        '" cy="' + yAt(last.v).toFixed(1) + '" r="4" fill="' + s.color + '" />'
      );
    }).join("");

    var scrubDots = series.map(function (s) {
      return (
        '<circle class="cb-scrub-dot" data-id="' + s.id + '" r="5" fill="' + s.color +
        '" style="display:none" />'
      );
    }).join("");

    var edgeLabels = series.map(function (s) {
      var last = s.points[s.points.length - 1];
      return (
        '<div class="cb-scrub-edge-label" data-id="' + s.id + '" style="color:' + s.color + '">' +
          '<span class="cb-scrub-edge-ticker">' + escapeHtml(s.name) + "</span>" +
          '<span class="cb-scrub-edge-pct" data-pct>' + fmtPct(last.v) + "</span>" +
        "</div>"
      );
    }).join("");

    var floatLabels = series.map(function (s) {
      return (
        '<div class="cb-scrub-float" data-id="' + s.id + '" style="display:none;color:' + s.color + '">' +
          '<span class="cb-scrub-float-ticker">' + escapeHtml(s.name) + "</span>" +
          '<span class="cb-scrub-float-pct" data-pct></span>' +
        "</div>"
      );
    }).join("");

    host.innerHTML =
      '<div class="cb-scrub-chart">' +
        '<div class="cb-scrub-stage">' +
          '<div class="cb-scrub-stamp" aria-hidden="true"></div>' +
          '<svg class="cb-scrub-svg" viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" role="img" aria-label="Odds over time">' +
            "<defs>" +
              '<clipPath id="' + uid + '-past"><rect class="cb-scrub-clip" x="' + padL + '" y="' + padT +
              '" width="' + plotW + '" height="' + plotH + '" /></clipPath>' +
            "</defs>" +
            grid +
            '<g class="cb-scrub-muted">' + mutedPaths + "</g>" +
            '<g class="cb-scrub-bright" clip-path="url(#' + uid + '-past)">' + brightPaths + "</g>" +
            endDots +
            '<line class="cb-scrub-cursor" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + plotH) +
            '" style="display:none" />' +
            scrubDots +
          "</svg>" +
          '<div class="cb-scrub-floats">' + floatLabels + "</div>" +
          '<div class="cb-scrub-edge">' + edgeLabels + "</div>" +
        "</div>" +
        '<div class="cb-scrub-ticks"><span></span><span></span><span></span><span></span></div>' +
      "</div>";

    var root = host.firstChild;
    var svg = root.querySelector(".cb-scrub-svg");
    var clip = root.querySelector(".cb-scrub-clip");
    var cursor = root.querySelector(".cb-scrub-cursor");
    var stamp = root.querySelector(".cb-scrub-stamp");
    var dots = root.querySelectorAll(".cb-scrub-dot");
    var floats = root.querySelectorAll(".cb-scrub-float");
    var edgeEls = root.querySelectorAll(".cb-scrub-edge-label");
    var tickEls = root.querySelectorAll(".cb-scrub-ticks span");
    for (var ti = 0; ti < tickEls.length; ti++) {
      tickEls[ti].textContent = fmtStamp(t0 + (t1 - t0) * (ti / Math.max(1, tickEls.length - 1))).split(",")[0];
    }

    function placeEdgeLabels() {
      edgeEls.forEach(function (el) {
        var id = el.getAttribute("data-id");
        var s = null;
        for (var i = 0; i < series.length; i++) {
          if (series[i].id === id) { s = series[i]; break; }
        }
        if (!s) return;
        var last = s.points[s.points.length - 1];
        var pctEl = el.querySelector("[data-pct]");
        if (pctEl) pctEl.textContent = fmtPct(last.v);
        var y = yAt(last.v);
        var svgRect = svg.getBoundingClientRect();
        var stage = root.querySelector(".cb-scrub-stage");
        var stageRect = stage.getBoundingClientRect();
        var top = ((y / h) * svgRect.height) + (svgRect.top - stageRect.top) - 16;
        el.style.top = Math.max(0, top) + "px";
        el.style.display = "";
      });
    }

    function showAt(clientX) {
      var rect = svg.getBoundingClientRect();
      var xPx = ((clientX - rect.left) / Math.max(1, rect.width)) * w;
      xPx = Math.max(padL, Math.min(padL + plotW, xPx));
      // near the right edge: treat as idle (Kalshi drops scrub UI at far right)
      if (xPx >= padL + plotW - 6) {
        reset();
        return;
      }
      var t = t0 + ((xPx - padL) / plotW) * span;
      var pastW = Math.max(0, xPx - padL);
      clip.setAttribute("width", pastW.toFixed(1));
      cursor.style.display = "";
      cursor.setAttribute("x1", xPx.toFixed(1));
      cursor.setAttribute("x2", xPx.toFixed(1));
      stamp.style.display = "";
      stamp.textContent = fmtStamp(t);
      var stampLeft = ((xPx / w) * rect.width) - stamp.offsetWidth / 2;
      stamp.style.left = Math.max(0, Math.min(rect.width - stamp.offsetWidth, stampLeft)) + "px";
      root.classList.add("is-scrubbing");
      root.querySelector(".cb-scrub-edge").style.opacity = "0";

      var stage = root.querySelector(".cb-scrub-stage");
      var stageRect = stage.getBoundingClientRect();
      series.forEach(function (s) {
        var v = interp(s.points, t);
        var y = yAt(v);
        dots.forEach(function (dot) {
          if (dot.getAttribute("data-id") !== s.id) return;
          dot.style.display = "";
          dot.setAttribute("cx", xPx.toFixed(1));
          dot.setAttribute("cy", y.toFixed(1));
        });
        floats.forEach(function (fl) {
          if (fl.getAttribute("data-id") !== s.id) return;
          fl.style.display = "";
          fl.querySelector("[data-pct]").textContent = fmtPct(v);
          var left = ((xPx / w) * rect.width) + 10;
          var top = ((y / h) * rect.height) + (rect.top - stageRect.top) - 18;
          fl.style.left = left + "px";
          fl.style.top = Math.max(0, top) + "px";
        });
      });
    }

    function reset() {
      clip.setAttribute("width", String(plotW));
      cursor.style.display = "none";
      stamp.style.display = "none";
      stamp.textContent = "";
      root.classList.remove("is-scrubbing");
      dots.forEach(function (d) { d.style.display = "none"; });
      floats.forEach(function (f) { f.style.display = "none"; });
      root.querySelector(".cb-scrub-edge").style.opacity = "1";
      placeEdgeLabels();
    }

    svg.addEventListener("mousemove", function (e) { showAt(e.clientX); });
    svg.addEventListener("mouseleave", reset);
    svg.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches[0]) showAt(e.touches[0].clientX);
    }, { passive: true });
    svg.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) showAt(e.touches[0].clientX);
    }, { passive: true });
    svg.addEventListener("touchend", reset);

    // start idle
    clip.setAttribute("width", String(plotW));
    placeEdgeLabels();
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () { placeEdgeLabels(); });
      ro.observe(host);
    }

    return {
      destroy: function () { host.innerHTML = ""; },
      refresh: function () { placeEdgeLabels(); }
    };
  }

  function seriesFromVoteHistory(history, sides) {
    history = history || [];
    sides = sides || [];
    var now = Date.now();
    if (!history.length) {
      return sides.map(function (s) {
        return {
          id: s.id,
          name: s.name || s.label || s.id,
          color: s.color,
          points: [
            { t: now - 7200000, v: 0 },
            { t: now, v: Number(s.pct) || 0 }
          ]
        };
      });
    }
    return sides.map(function (s) {
      return {
        id: s.id,
        name: s.name || s.label || s.id,
        color: s.color,
        points: history.map(function (h) {
          var pctMap = h.pct || h;
          var v = pctMap[s.id];
          return { t: Number(h.t || h.time || now), v: Number(v) || 0 };
        })
      };
    });
  }

  global.CoolbradorScrubChart = {
    mount: mount,
    seriesFromVoteHistory: seriesFromVoteHistory,
    theme: theme
  };
})(typeof window !== "undefined" ? window : this);
