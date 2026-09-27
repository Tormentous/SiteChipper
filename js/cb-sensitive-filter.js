/*! CoolbradorSensitiveFilter — soft hide for sensitive speech + non-porn 18+. */
(function (global) {
  "use strict";

  // Defaults (user override Sep 21):
  // Website sensitive speech HIDE; Chipper HIDE; non-porn 18+ HIDE.
  var KEY_SPEECH = "cb_show_sensitive_speech";
  var KEY_CHIPPER_SPEECH = "cb_chipper_show_sensitive_speech";
  var KEY_NSFW = "cb_show_nsfw";

  var SPEECH_DEFAULT = false;
  var CHIPPER_SPEECH_DEFAULT = false;
  var NSFW_DEFAULT = false;

  var HATE_RE = [
    /\b(white\s*power|heil\s*hitler|gas\s*the\s*jews|kill\s*all\s*[a-z]+)\b/i,
    /\b(nigg(?:er|a)|kike|spic|chink|gook|wetback|tranny|faggot)\b/i,
    /\b(race\s*war|ethnic\s*cleansing)\b/i
  ];

  function lsGet(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      if (v === null || v === undefined || v === "") return fallback;
      if (v === "1" || v === "true") return true;
      if (v === "0" || v === "false") return false;
      return fallback;
    } catch (_) { return fallback; }
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, val ? "true" : "false"); } catch (_) {}
  }

  function inChipperContext() {
    try {
      if (global.CB_CHIPPER_CONTEXT) return true;
      var path = String(location.pathname || "").toLowerCase();
      if (path.indexOf("chipper") !== -1 || path.indexOf("/games/") === 0) return true;
      var el = document.documentElement;
      if (el && el.getAttribute("data-cb-context") === "chipper") return true;
    } catch (_) {}
    return false;
  }

  function showSensitiveSpeech() {
    if (inChipperContext()) return lsGet(KEY_CHIPPER_SPEECH, CHIPPER_SPEECH_DEFAULT);
    return lsGet(KEY_SPEECH, SPEECH_DEFAULT);
  }

  function showNsfw() { return lsGet(KEY_NSFW, NSFW_DEFAULT); }
  function setShowSensitiveSpeech(on) { lsSet(KEY_SPEECH, !!on); }
  function setChipperShowSensitiveSpeech(on) { lsSet(KEY_CHIPPER_SPEECH, !!on); }
  function setShowNsfw(on) { lsSet(KEY_NSFW, !!on); }

  function textLooksSensitive(text) {
    var s = String(text || "");
    for (var i = 0; i < HATE_RE.length; i++) if (HATE_RE[i].test(s)) return true;
    return false;
  }

  function classifyPost(post) {
    post = post || {};
    var warnings = [];
    if (Array.isArray(post.contentWarnings)) {
      warnings = post.contentWarnings.map(function (w) { return String(w).toLowerCase(); });
    }
    if (post.sensitive === true && warnings.indexOf("sensitive") === -1) warnings.push("sensitive");
    if (post.nsfw === true && warnings.indexOf("nsfw") === -1) warnings.push("nsfw");
    var blob = [post.text, post.body, post.caption, post.title].filter(Boolean).join("\n");
    if (textLooksSensitive(blob)) {
      if (warnings.indexOf("hate") === -1) warnings.push("hate");
      if (warnings.indexOf("sensitive") === -1) warnings.push("sensitive");
    }
    var sensitiveSpeech = warnings.some(function (w) {
      return w === "hate" || w === "violence" || w === "sensitive" || w === "racism" || w === "speech";
    });
    var softNsfw = warnings.some(function (w) {
      return w === "nsfw" || w === "18+" || w === "18plus" || w === "mature" || w === "adult";
    });
    return { contentWarnings: warnings, sensitiveSpeech: sensitiveSpeech, softNsfw: softNsfw };
  }

  function shouldShowPost(post) {
    var c = classifyPost(post);
    if (c.sensitiveSpeech && !showSensitiveSpeech()) return false;
    if (c.softNsfw && !showNsfw()) return false;
    return true;
  }

  function filterPosts(posts) { return (posts || []).filter(shouldShowPost); }

  function enrichPost(post) {
    var c = classifyPost(post);
    if (!post.contentWarnings || !post.contentWarnings.length) post.contentWarnings = c.contentWarnings.slice();
    if (c.sensitiveSpeech) post.sensitive = true;
    if (c.softNsfw) post.nsfw = true;
    return post;
  }

  global.CoolbradorSensitiveFilter = {
    KEY_SPEECH: KEY_SPEECH,
    KEY_CHIPPER_SPEECH: KEY_CHIPPER_SPEECH,
    KEY_NSFW: KEY_NSFW,
    SPEECH_DEFAULT: SPEECH_DEFAULT,
    CHIPPER_SPEECH_DEFAULT: CHIPPER_SPEECH_DEFAULT,
    NSFW_DEFAULT: NSFW_DEFAULT,
    showSensitiveSpeech: showSensitiveSpeech,
    showNsfw: showNsfw,
    setShowSensitiveSpeech: setShowSensitiveSpeech,
    setChipperShowSensitiveSpeech: setChipperShowSensitiveSpeech,
    setShowNsfw: setShowNsfw,
    inChipperContext: inChipperContext,
    classifyPost: classifyPost,
    shouldShowPost: shouldShowPost,
    filterPosts: filterPosts,
    enrichPost: enrichPost,
    textLooksSensitive: textLooksSensitive
  };
})(typeof window !== "undefined" ? window : this);
