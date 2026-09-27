(function () {
  var STORAGE_KEY = "cb_chipper_link_v1";
  var BASE = "https://coolbrador.com";

  function sessionUser() {
    var id = "";
    try {
      if (window.CoolbradorSession && typeof window.CoolbradorSession.getSessionUserId === "function") {
        id = String(window.CoolbradorSession.getSessionUserId() || "");
      }
    } catch (e) {}
    if (!id) {
      try { id = localStorage.getItem("currentUserId") || ""; } catch (e2) {}
    }
    var handle = "";
    var displayName = "";
    var avatarUrl = BASE + "/shared/TestImages/ProfilePhotos/BeeSid.png";
    try {
      handle = localStorage.getItem("username_" + id) || localStorage.getItem("displayName") || ("user" + id);
      displayName = localStorage.getItem("displayName_" + id) || localStorage.getItem("username") || handle;
      avatarUrl = localStorage.getItem("pfp_" + id) || avatarUrl;
      if (avatarUrl && avatarUrl.indexOf("http") !== 0) {
        avatarUrl = BASE + (avatarUrl.charAt(0) === "/" ? "" : "/") + avatarUrl;
      }
    } catch (e3) {}
    if (!id) id = "guest";
    if (!handle) handle = "guest";
    if (!displayName) displayName = "Guest";
    return { userId: String(id), handle: String(handle).replace(/^@/, ""), displayName: String(displayName), avatarUrl: avatarUrl };
  }

  function randomCode() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "";
    for (var i = 0; i < 6; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    return out;
  }

  function buildPayload(forceNew) {
    var user = sessionUser();
    var existing = null;
    try { existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) {}
    var code = forceNew || !existing || !existing.code ? randomCode() : existing.code;
    var openUrl = BASE + "/chipper-link.html?code=" + encodeURIComponent(code);
    var payload = {
      userId: user.userId,
      handle: user.handle,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      openUrl: openUrl,
      code: code,
      createdAt: new Date().toISOString(),
      // Chipper handshake: open openUrl OR paste code; no refresh tokens.
      // Expect Chipper to store userId/handle/avatarUrl locally after one-shot redeem.
      sensitiveDefault: "hide"
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e2) {}
    return payload;
  }

  function render(forceNew) {
    var params = new URLSearchParams(location.search || "");
    var codeParam = params.get("code");
    var payload = buildPayload(!!forceNew);
    if (codeParam && !forceNew) {
      // Redeem view: keep stored user, stamp requested code into openUrl for Chipper deep-link opens
      payload.code = codeParam;
      payload.openUrl = BASE + "/chipper-link.html?code=" + encodeURIComponent(codeParam);
    }
    var pre = document.getElementById("linkPayload");
    var status = document.getElementById("linkStatus");
    var publicPayload = {
      userId: payload.userId,
      handle: payload.handle,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
      openUrl: payload.openUrl
    };
    if (pre) pre.textContent = JSON.stringify(publicPayload, null, 2);
    if (status) {
      status.textContent = "Code " + payload.code + " — Chipper should open openUrl or accept pasted JSON. Sensitive posts default HIDE in-game.";
      status.classList.remove("chipper-link-err");
    }
    window.__cbChipperLinkPayload = publicPayload;
    return publicPayload;
  }

  document.addEventListener("DOMContentLoaded", function () {
    render(false);
    var copyBtn = document.getElementById("btnCopy");
    var regenBtn = document.getElementById("btnRegen");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = JSON.stringify(window.__cbChipperLinkPayload || render(false));
        function ok() {
          var s = document.getElementById("linkStatus");
          if (s) s.textContent = "Copied account link JSON. Paste into Chipper or open openUrl from the game.";
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok).catch(function () {
            window.prompt("Copy this JSON", text);
            ok();
          });
        } else {
          window.prompt("Copy this JSON", text);
          ok();
        }
      });
    }
    if (regenBtn) {
      regenBtn.addEventListener("click", function () { render(true); });
    }
  });
})();
