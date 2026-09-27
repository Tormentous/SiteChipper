(function () {
  "use strict";

  function boardFromPath() {
    var parts = (location.pathname || "").split("/").filter(Boolean);
    if (parts[0] === "b" && parts[1]) return decodeURIComponent(parts[1]);
    return "";
  }

  function labelize(id) {
    return String(id || "").replace(/[-_]/g, " ");
  }

  function boardIcon(board) {
    var b = String(board || "").toLowerCase();
    var map = {
      general: "fa-solid fa-globe",
      beesid: "fa-solid fa-bug",
      chippercorner: "fa-solid fa-gamepad",
      giftdrive: "fa-solid fa-gift",
      invasions: "fa-solid fa-skull-crossbones",
      labradoria: "fa-solid fa-landmark-flag",
      mutinies4lyfe: "fa-solid fa-fire",
      farmdestroyersclub: "fa-solid fa-tractor",
      testboard: "fa-solid fa-flask"
    };
    return map[b] || "fa-solid fa-comments";
  }

  function seedMods(board) {
    var key = "cb_board_mods_v1_" + board;
    try {
      var existing = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(existing) && existing.length) return existing;
    } catch (_) {}
    var demo = [
      { id: "3", name: "BeeSid", handle: "beesid", favor: 72, against: 28, volume: 12840, markets: 3 },
      { id: "4", name: "Miguel", handle: "miguel", favor: 61, against: 39, volume: 9022, markets: 2 },
      { id: "6", name: "AnthonySpade", handle: "anthonyspade", favor: 54, against: 46, volume: 6104, markets: 2 }
    ];
    if (String(board).toLowerCase() === "beesid") {
      demo = [
        { id: "3", name: "BeeSid", handle: "beesid", favor: 88, against: 12, volume: 22010, markets: 5 },
        { id: "12", name: "CoolDog", handle: "cooldog", favor: 57, against: 43, volume: 4410, markets: 2 },
        { id: "5", name: "GyattToad", handle: "gyatttoad", favor: 41, against: 59, volume: 3188, markets: 1 }
      ];
    }
    try { localStorage.setItem(key, JSON.stringify(demo)); } catch (_) {}
    return demo;
  }

  function pfpFor(id) {
    try {
      if (window.CoolbradorPosts && CoolbradorPosts.getPfp) return CoolbradorPosts.getPfp(id);
    } catch (_) {}
    try { return localStorage.getItem("pfp_" + id) || "/users/default/pfp.jpg"; } catch (_) {
      return "/users/default/pfp.jpg";
    }
  }

  function favorSeries(favor) {
    var now = Date.now();
    var pts = [];
    var v = Math.max(8, favor - 18);
    for (var i = 0; i < 12; i++) {
      v = Math.max(5, Math.min(95, v + ((i * 7) % 9) - 4));
      if (i === 11) v = favor;
      pts.push({ t: now - (11 - i) * 3600000 * 6, v: v });
    }
    return pts;
  }

  function renderMods(board) {
    var host = document.getElementById("boardMods");
    if (!host) return;
    var mods = seedMods(board);
    host.className = "cb-mod-grid";
    host.innerHTML = mods.map(function (m) {
      var keep = Number(m.favor) || 0;
      var dump = Number(m.against != null ? m.against : (100 - keep));
      var multKeep = keep > 0 ? (100 / keep) : 0;
      var multDump = dump > 0 ? (100 / dump) : 0;
      return (
        '<article class="cb-kalshi-card" data-mod-id="' + m.id + '">' +
          '<div class="cb-kalshi-head">' +
            '<img src="' + pfpFor(m.id) + '" alt="">' +
            '<div><div class="cb-kalshi-cat">' + labelize(board).toUpperCase() + " MOD</div></div>" +
          "</div>" +
          '<h3 class="cb-kalshi-title">Keep @' + (m.handle || "lab") + " as moderator?</h3>" +
          '<div class="cb-kalshi-row">' +
            '<div><div class="cb-kalshi-row-label">Keep</div><div class="cb-kalshi-row-bar" style="width:' + Math.max(12, keep * 0.7) + 'px;background:var(--cb-success,#00c805)"></div></div>' +
            '<span class="cb-kalshi-mult">' + multKeep.toFixed(2) + "x</span>" +
            '<span class="cb-kalshi-pill">' + keep + "%</span>" +
          "</div>" +
          '<div class="cb-kalshi-row">' +
            '<div><div class="cb-kalshi-row-label">Replace</div><div class="cb-kalshi-row-bar" style="width:' + Math.max(12, dump * 0.7) + 'px;background:var(--cb-danger,#ff5a5a)"></div></div>' +
            '<span class="cb-kalshi-mult">' + multDump.toFixed(2) + "x</span>" +
            '<span class="cb-kalshi-pill" style="border-color:var(--cb-danger,#ff5a5a)">' + dump + "%</span>" +
          "</div>" +
          '<div class="cb-kalshi-chart" data-favor="' + keep + '"></div>' +
          '<div class="cb-kalshi-foot">' +
            '<span>$' + Number(m.volume || 0).toLocaleString() + " vol</span>" +
            '<span>' + (m.markets || 1) + " markets</span>" +
          "</div>" +
          '<button type="button" class="cb-mod-replace-btn" data-mod-id="' + m.id + '">Vote to replace</button>' +
        "</article>"
      );
    }).join("") || '<p class="cb-muted">No moderators yet.</p>';

    host.querySelectorAll(".cb-kalshi-chart").forEach(function (el) {
      var favor = Number(el.getAttribute("data-favor")) || 50;
      var API = window.CoolbradorScrubChart;
      if (API && API.mount) {
        var keepPts = favorSeries(favor);
        var replacePts = keepPts.map(function (p) { return { t: p.t, v: Math.max(5, Math.min(95, 100 - p.v)) }; });
        API.mount(el, {
          height: 130,
          series: [
            { id: "keep", name: "Keep", points: keepPts },
            { id: "replace", name: "Replace", points: replacePts }
          ]
        });
      }
    });
  }

  function renderDebates(board) {
    var host = document.getElementById("boardDebates");
    if (!host) return;
    var polls = {};
    try { polls = JSON.parse(localStorage.getItem("coolbrador_polls_v1") || "{}"); } catch (_) { polls = {}; }
    var flat = [];
    var bLow = String(board).toLowerCase();
    ["issues", "mutinies", "ideas"].forEach(function (type) {
      (polls[type] || []).forEach(function (p) {
        var b = String((p && (p.board || p.community || "")) || "").toLowerCase();
        if (b === bLow || (!b && bLow === "general")) {
          flat.push({ title: (p && p.title) || "Untitled debate", type: type, id: p && p.id });
        }
      });
    });
    if (!flat.length) {
      flat = [
        { title: "What should " + labelize(board) + " focus on next?", type: "ideas" },
        { title: "Best flair for " + labelize(board) + "?", type: "issues" },
        { title: "Open floor: " + labelize(board) + " house rules", type: "mutinies" }
      ];
    }
    var icon = boardIcon(board);
    host.innerHTML = flat.slice(0, 10).map(function (d) {
      var href = d.id ? ("/polls.html#poll-" + encodeURIComponent(d.id)) : "/polls.html";
      return (
        '<a class="cb-board-debate-link" href="' + href + '">' +
          '<span class="cb-debate-icon"><i class="' + icon + '" aria-hidden="true"></i></span>' +
          '<span style="flex:1">' + d.title + "</span>" +
          "<span>" + d.type + "</span>" +
        "</a>"
      );
    }).join("");
  }

  function activate(tab) {
    document.querySelectorAll(".cb-board-tab").forEach(function (btn) {
      var on = btn.getAttribute("data-board-tab") === tab;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".cb-board-panel").forEach(function (panel) {
      var on = panel.getAttribute("data-board-panel") === tab;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
  }

  function styleTabs() {
    var tabs = document.querySelector(".cb-board-tabs");
    if (!tabs) return;
    if (!tabs.querySelector(".cb-board-tabs-inner")) {
      var inner = document.createElement("div");
      inner.className = "cb-board-tabs-inner chipper-tabs-inner";
      while (tabs.firstChild) inner.appendChild(tabs.firstChild);
      tabs.appendChild(inner);
    }
  }

  
  function renderGameBoardNote(board) {
    var host = document.getElementById("boardGameNote") || document.querySelector(".board-meta-row");
    if (!host) return;
    var meta = {};
    try { meta = JSON.parse(localStorage.getItem("boardmeta_/b/" + board) || "{}"); } catch (_) { meta = {}; }
    var isGame = !!(meta.gameBoard || String(board).toLowerCase() === "beesid");
    if (!isGame) return;
    var note = document.getElementById("boardGameNote");
    if (!note) {
      note = document.createElement("div");
      note.id = "boardGameNote";
      note.className = "cb-game-board-note";
      var anchor = document.querySelector(".board-meta-row") || document.querySelector(".cb-board-tabs");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(note, anchor.nextSibling);
      else return;
    }
    var label = meta.gameBoardLabel || "Chipper Game Board";
    var icon = meta.gameBoardIcon || "fa-solid fa-gamepad";
    var body = meta.desc || "In-game posts from Chipper levels land here.";
    note.innerHTML =
      '<div class="cb-game-board-note-icon" aria-hidden="true"><i class="' + icon + '"></i></div>' +
      "<div><strong>" + label + "</strong><p>" + body + "</p></div>";
  }

  function boot() {
    var board = boardFromPath();
    if (!board) return;
    try {
      document.body.dataset.cbBoard = board;
      window.__cbCurrentBoard = board;
    } catch (_) {}
    styleTabs();
    document.querySelectorAll(".cb-board-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activate(btn.getAttribute("data-board-tab"));
      });
    });
    renderDebates(board);
    renderGameBoardNote(board);
    renderMods(board);
    if (location.hash === "#debates") activate("debates");
    if (location.hash === "#mods") activate("mods");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
