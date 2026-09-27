/**
 * Coolbrador custom media player — YouTube-like chrome using CSS variables.
 */
(function (global) {
  "use strict";

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    t = Math.max(0, Math.floor(t));
    var m = Math.floor(t / 60);
    var s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function enhance(media) {
    if (!media || media.dataset.cbPlayer === "1") return;
    if (media.closest(".cb-player")) return;
    media.dataset.cbPlayer = "1";
    media.removeAttribute("controls");
    media.controls = false;

    var isAudio = media.tagName === "AUDIO";
    var shell = document.createElement("div");
    shell.className = "cb-player " + (isAudio ? "cb-player-audio" : "cb-player-video is-paused");
    media.parentNode.insertBefore(shell, media);
    shell.appendChild(media);

    var bar = document.createElement("div");
    bar.className = "cb-player-bar";
    bar.innerHTML =
      '<button type="button" class="cb-player-play" aria-label="Play"><i class="fa-solid fa-play"></i></button>' +
      '<div class="cb-player-seek"><div class="cb-player-seek-fill"></div></div>' +
      '<span class="cb-player-time">0:00 / 0:00</span>' +
      '<button type="button" class="cb-player-mute" aria-label="Mute"><i class="fa-solid fa-volume-high"></i></button>' +
      '<div class="cb-player-vol"><div class="cb-player-vol-fill"></div></div>';
    shell.appendChild(bar);

    var playBtn = bar.querySelector(".cb-player-play");
    var seek = bar.querySelector(".cb-player-seek");
    var seekFill = bar.querySelector(".cb-player-seek-fill");
    var timeEl = bar.querySelector(".cb-player-time");
    var muteBtn = bar.querySelector(".cb-player-mute");
    var vol = bar.querySelector(".cb-player-vol");
    var volFill = bar.querySelector(".cb-player-vol-fill");

    function syncPlayIcon() {
      playBtn.innerHTML = media.paused
        ? '<i class="fa-solid fa-play"></i>'
        : '<i class="fa-solid fa-pause"></i>';
      shell.classList.toggle("is-paused", media.paused);
    }
    function syncMuteIcon() {
      muteBtn.innerHTML = media.muted || media.volume === 0
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    }
    function syncTime() {
      var d = media.duration;
      var cur = media.currentTime || 0;
      timeEl.textContent = fmt(cur) + " / " + fmt(d);
      var pct = d ? (cur / d) * 100 : 0;
      seekFill.style.width = pct + "%";
    }
    function syncVol() {
      volFill.style.width = (media.muted ? 0 : media.volume * 100) + "%";
    }

    playBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (media.paused) media.play();
      else media.pause();
    });
    media.addEventListener("play", syncPlayIcon);
    media.addEventListener("pause", syncPlayIcon);
    media.addEventListener("timeupdate", syncTime);
    media.addEventListener("loadedmetadata", syncTime);
    media.addEventListener("volumechange", function () {
      syncMuteIcon();
      syncVol();
    });

    seek.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var r = seek.getBoundingClientRect();
      var u = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      if (isFinite(media.duration)) media.currentTime = u * media.duration;
    });
    vol.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var r = vol.getBoundingClientRect();
      var u = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      media.muted = false;
      media.volume = u;
    });
    muteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      media.muted = !media.muted;
    });

    if (!isAudio) {
      media.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (media.paused) media.play();
        else media.pause();
      });
    }

    syncPlayIcon();
    syncMuteIcon();
    syncTime();
    syncVol();
  }

  function enhanceAll(root) {
    root = root || document;
    root.querySelectorAll("video.post-media, audio.post-media, video[controls], audio[controls], video, audio").forEach(function (el) {
      if (el.dataset.cbPlayer === "1") return;
      if (el.hasAttribute("controls") || el.classList.contains("post-media") || el.classList.contains("post-media-blur") === false && el.closest(".post-media-frame")) {
        if (el.classList.contains("post-media-blur")) return;
        enhance(el);
      }
    });
  }

  function boot() {
    enhanceAll(document);
    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches("video,audio")) enhance(n);
            else if (n.querySelector) enhanceAll(n);
          });
        });
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.CoolbradorMediaPlayer = { enhance: enhance, enhanceAll: enhanceAll };
})(typeof window !== "undefined" ? window : this);
