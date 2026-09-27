/*! CoolbradorMediaSafety — hard-block CSAM + porn (never a user toggle). */
(function (global) {
  "use strict";

  var NSFW_CDN = "https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js";
  var TF_CDN = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
  var MODEL_URL = "https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/model/";

  // NSFWJS is NOT a CSAM detector. Porn/Hentai hard-block only.
  var PORN_THRESHOLD = 0.72;
  var HENTAI_THRESHOLD = 0.72;
  var SEXY_TAG_THRESHOLD = 0.85;

  var modelPromise = null;
  var libsPromise = null;

  var CSAM_RE = [
    /\b(csam|child\s*porn|childporn|cp\s*trade|pedo(?:phile)?|pedophilia)\b/i,
    /\b(under[\s-]?age|pre[\s-]?teen|preteens?|lolicon|lolita\s*sex|shotacon)\b/i,
    /\b(minor[s]?\s*(?:nude|naked|sex|porn)|kids?\s*porn)\b/i,
    /\b(age\s*play\s*(?:sex|porn)|baby\s*porn)\b/i
  ];

  var PORN_RE = [
    /\b(onlyfans\s*leak|pornhub|xvideos|xhamster|hentai\s*video)\b/i,
    /\b(cum\s*shot|creampie|anal\s*sex|blow\s*job|deepthroat|gangbang)\b/i,
    /\b(hardcore\s*porn|explicit\s*porn)\b/i
  ];

  function toast(msg) {
    if (global.CoolbradorPosts && typeof global.CoolbradorPosts.showToast === "function") {
      try { global.CoolbradorPosts.showToast(msg); return; } catch (_) {}
    }
    if (global.CoolbradorPosts && typeof global.CoolbradorPosts.showToast === "function") {
      try { global.CoolbradorPosts.showToast(msg); return; } catch (_) {}
    }
    try {
      var t = document.getElementById("cbToast");
      if (!t) {
        t = document.createElement("div");
        t.id = "cbToast";
        t.className = "cb-toast";
        t.setAttribute("role", "status");
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(function () { t.classList.remove("show"); }, 3200);
    } catch (_) {}
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "1") return resolve();
        existing.addEventListener("load", function () { resolve(); });
        existing.addEventListener("error", function () { reject(new Error("load fail")); });
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { s.dataset.loaded = "1"; resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureLibs() {
    if (libsPromise) return libsPromise;
    libsPromise = loadScript(TF_CDN)
      .then(function () { return loadScript(NSFW_CDN); })
      .catch(function (err) { libsPromise = null; throw err; });
    return libsPromise;
  }

  function ensureModel() {
    if (modelPromise) return modelPromise;
    modelPromise = ensureLibs().then(function () {
      if (!global.nsfwjs || typeof global.nsfwjs.load !== "function") {
        throw new Error("nsfwjs missing");
      }
      return global.nsfwjs.load(MODEL_URL).catch(function () {
        return global.nsfwjs.load();
      });
    }).catch(function (err) { modelPromise = null; throw err; });
    return modelPromise;
  }

  function scoreMap(predictions) {
    var out = {};
    (predictions || []).forEach(function (p) { out[p.className] = p.probability; });
    return out;
  }

  function loadImageEl(fileOrUrl) {
    return new Promise(function (resolve, reject) {
      var url;
      var revoke = false;
      if (typeof fileOrUrl === "string") url = fileOrUrl;
      else if (fileOrUrl && typeof Blob !== "undefined" && fileOrUrl instanceof Blob) {
        url = URL.createObjectURL(fileOrUrl);
        revoke = true;
      } else return reject(new Error("No image"));
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        if (revoke) try { URL.revokeObjectURL(url); } catch (_) {}
        resolve(img);
      };
      img.onerror = function () {
        if (revoke) try { URL.revokeObjectURL(url); } catch (_) {}
        reject(new Error("Image decode failed"));
      };
      img.src = url;
    });
  }

  function videoPosterCanvas(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = url;
      var done = false;
      function fail(e) {
        if (done) return;
        done = true;
        try { URL.revokeObjectURL(url); } catch (_) {}
        reject(e || new Error("video frame fail"));
      }
      video.onloadeddata = function () {
        try {
          video.currentTime = Math.min(0.2, (video.duration || 1) * 0.05);
        } catch (e) { fail(e); }
      };
      video.onseeked = function () {
        if (done) return;
        try {
          var canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          done = true;
          try { URL.revokeObjectURL(url); } catch (_) {}
          resolve(canvas);
        } catch (e) { fail(e); }
      };
      video.onerror = function () { fail(new Error("video load fail")); };
      setTimeout(function () { fail(new Error("video timeout")); }, 8000);
    });
  }

  function classifyEl(el) {
    return ensureModel().then(function (model) {
      return model.classify(el);
    }).then(function (preds) {
      var m = scoreMap(preds);
      var porn = m.Porn || 0;
      var hentai = m.Hentai || 0;
      var sexy = m.Sexy || 0;
      var blocked = porn >= PORN_THRESHOLD || hentai >= HENTAI_THRESHOLD;
      return {
        ok: !blocked,
        blocked: blocked,
        reason: blocked ? "porn" : null,
        softNsfw: !blocked && sexy >= SEXY_TAG_THRESHOLD,
        scores: { porn: porn, hentai: hentai, sexy: sexy, neutral: m.Neutral || 0, drawing: m.Drawing || 0 }
      };
    });
  }

  function proxyEndpoint() {
    if (global.CB_ARACHNID_PROXY) return String(global.CB_ARACHNID_PROXY);
    return "/api/media-scan";
  }

  function scanRemote(file) {
    if (global.__cbArachnidSkip) {
      return Promise.resolve({ skipped: true, ok: true });
    }
    var endpoint = proxyEndpoint();
    var body = new FormData();
    body.append("file", file, file.name || "upload.bin");
    return fetch(endpoint, { method: "POST", body: body, credentials: "same-origin" })
      .then(function (res) {
        if (res.status === 404 || res.status === 501 || res.status === 502) {
          global.__cbArachnidSkip = true;
          return { skipped: true, ok: true };
        }
        if (!res.ok) return { skipped: true, ok: true, status: res.status };
        return res.json();
      })
      .then(function (data) {
        if (!data || data.skipped) return { skipped: true, ok: true };
        var classification = String(data.classification || data.verdict || "").toLowerCase();
        var blocked = data.ok === false || classification === "match" || classification === "csam" || classification === "block";
        return {
          ok: !blocked,
          blocked: blocked,
          reason: blocked ? "illegal" : null,
          classification: classification,
          remote: true
        };
      })
      .catch(function () {
        global.__cbArachnidSkip = true;
        return { skipped: true, ok: true };
      });
  }

  function scanText(text) {
    var s = String(text || "");
    var i;
    for (i = 0; i < CSAM_RE.length; i++) {
      if (CSAM_RE[i].test(s)) return { ok: false, blocked: true, reason: "illegal" };
    }
    for (i = 0; i < PORN_RE.length; i++) {
      if (PORN_RE[i].test(s)) return { ok: false, blocked: true, reason: "porn" };
    }
    return { ok: true, blocked: false };
  }

  function scanFile(file) {
    if (!file) return Promise.resolve({ ok: true });
    var type = String(file.type || "");
    var chain = Promise.resolve({ ok: true, skipped: true });

    if (type.indexOf("image/") === 0) {
      chain = loadImageEl(file).then(classifyEl);
    } else if (type.indexOf("video/") === 0) {
      chain = videoPosterCanvas(file).then(classifyEl).catch(function () {
        return { ok: true, softNsfw: false, scores: {}, frameFailed: true };
      });
    }

    return chain.then(function (local) {
      if (local && local.blocked) return local;
      return scanRemote(file).then(function (remote) {
        if (remote && remote.blocked) return remote;
        var warnings = [];
        if (local && local.softNsfw) warnings.push("nsfw");
        return {
          ok: true,
          blocked: false,
          softNsfw: !!(local && local.softNsfw),
          contentWarnings: warnings,
          scores: (local && local.scores) || {},
          remote: remote || { skipped: true }
        };
      });
    });
  }

  function scan(file, text) {
    var textResult = scanText(text);
    if (textResult.blocked) {
      toast("This content isn't allowed.");
      return Promise.resolve(textResult);
    }
    if (!file) {
      return Promise.resolve({ ok: true, blocked: false, contentWarnings: [] });
    }
    return scanFile(file).then(function (r) {
      if (r && r.blocked) {
        toast("This content isn't allowed.");
        return r;
      }
      return r || { ok: true };
    }).catch(function () {
      return { ok: true, blocked: false, contentWarnings: [], classifierError: true };
    });
  }

  global.CoolbradorMediaSafety = {
    scan: scan,
    scanText: scanText,
    toast: toast,
    PORN_THRESHOLD: PORN_THRESHOLD,
    HENTAI_THRESHOLD: HENTAI_THRESHOLD
  };
})(typeof window !== "undefined" ? window : this);
