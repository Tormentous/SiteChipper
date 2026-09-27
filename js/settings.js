(function () {
  var Rice = window.CoolbradorRice;
  if (!Rice) {
    console.warn("CoolbradorRice missing");
    return;
  }

  function refreshStatus() {
    var status = document.getElementById("themeStatus");
    if (!status) return;
    var theme = Rice.normalizeTheme(Rice.lsGet("cb_theme", "default"));
    var mode = Rice.normalizeMode(Rice.lsGet("cb_mode", "dark"));
    var name = Rice.LABELS[theme] || theme;
    var bits = [name, mode === "light" ? "Light mode" : "Dark mode"];
    if (Rice.lsGet("cb_wallpaper", "")) bits.push("wallpaper");
    status.textContent = bits.join(" · ") + ". Saved on this device.";
  }

  function markThemeSelected() {
    var t = Rice.normalizeTheme(Rice.lsGet("cb_theme", "default"));
    document.querySelectorAll(".theme-option").forEach(function (btn) {
      var on = Rice.normalizeTheme(btn.getAttribute("data-theme")) === t;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function markModeSelected() {
    var mode = Rice.normalizeMode(Rice.lsGet("cb_mode", "dark"));
    document.querySelectorAll(".mode-option").forEach(function (btn) {
      var on = btn.getAttribute("data-mode") === mode;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function syncPickersFromStorage() {
    var tint = document.getElementById("wallpaperTint");
    var blur = document.getElementById("wallpaperBlur");
    var tintVal = document.getElementById("wallpaperTintVal");
    var blurVal = document.getElementById("wallpaperBlurVal");
    var t = parseInt(Rice.lsGet("cb_wallpaper_tint", "55"), 10);
    var b = parseInt(Rice.lsGet("cb_wallpaper_blur", "0"), 10);
    if (isNaN(t)) t = 55;
    if (isNaN(b)) b = 0;
    if (tint) tint.value = String(t);
    if (blur) blur.value = String(b);
    if (tintVal) tintVal.textContent = t + "%";
    if (blurVal) blurVal.textContent = b + "px";
    var preview = document.getElementById("wallpaperPreview");
    var wall = Rice.lsGet("cb_wallpaper", "");
    if (preview) {
      if (wall) {
        preview.style.backgroundImage = "url(\"" + wall + "\")";
        preview.classList.add("has-image");
        preview.textContent = "";
      } else {
        preview.style.backgroundImage = "";
        preview.classList.remove("has-image");
        preview.textContent = "No wallpaper";
      }
    }
  }

  function applyAndRefresh(extra) {
    Rice.applyRice(extra || {});
    if (window.CoolbradorLayout && typeof window.CoolbradorLayout.applySiteTheme === "function") {
      try { window.CoolbradorLayout.applySiteTheme(); } catch (e) {}
    }
    markThemeSelected();
    markModeSelected();
    refreshStatus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyAndRefresh({ persist: true });
    syncPickersFromStorage();
    const filter=window.CoolbradorSensitiveFilter;
    if(filter){
      const speech=document.getElementById('showSensitive'),chipper=document.getElementById('showChipperSensitive'),mature=document.getElementById('showMature');
      speech.checked=filter.showSensitiveSpeech();mature.checked=filter.showNsfw();
      try{chipper.checked=localStorage.getItem(filter.KEY_CHIPPER_SPEECH)==='true';}catch(_){}
      speech.onchange=()=>filter.setShowSensitiveSpeech(speech.checked);chipper.onchange=()=>filter.setChipperShowSensitiveSpeech(chipper.checked);mature.onchange=()=>filter.setShowNsfw(mature.checked);
    }

    document.querySelectorAll(".theme-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyAndRefresh({ theme: btn.getAttribute("data-theme"), persist: true });
      });
    });

    document.querySelectorAll(".mode-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyAndRefresh({ mode: btn.getAttribute("data-mode"), persist: true });
      });
    });


    var tint = document.getElementById("wallpaperTint");
    var blur = document.getElementById("wallpaperBlur");
    var tintVal = document.getElementById("wallpaperTintVal");
    var blurVal = document.getElementById("wallpaperBlurVal");
    if (tint) {
      tint.addEventListener("input", function () {
        Rice.lsSet("cb_wallpaper_tint", tint.value);
        if (tintVal) tintVal.textContent = tint.value + "%";
        applyAndRefresh({});
      });
    }
    if (blur) {
      blur.addEventListener("input", function () {
        Rice.lsSet("cb_wallpaper_blur", blur.value);
        if (blurVal) blurVal.textContent = blur.value + "px";
        applyAndRefresh({});
      });
    }

    var file = document.getElementById("wallpaperFile");
    var wallStatus = document.getElementById("wallpaperStatus");
    if (file) {
      file.addEventListener("change", function () {
        var f = file.files && file.files[0];
        if (!f) return;
        if (wallStatus) wallStatus.textContent = "Compressing…";
        Rice.fileToWallpaperDataUrl(f, function (err, dataUrl) {
          if (err) {
            if (wallStatus) wallStatus.textContent = err.message || "Failed";
            return;
          }
          var ok = Rice.lsSet("cb_wallpaper", dataUrl);
          if (!ok) {
            if (wallStatus) wallStatus.textContent = "Storage full — try a smaller image.";
            return;
          }
          if (wallStatus) wallStatus.textContent = "Wallpaper saved.";
          syncPickersFromStorage();
    const filter=window.CoolbradorSensitiveFilter;
    if(filter){
      const speech=document.getElementById('showSensitive'),chipper=document.getElementById('showChipperSensitive'),mature=document.getElementById('showMature');
      speech.checked=filter.showSensitiveSpeech();mature.checked=filter.showNsfw();
      try{chipper.checked=localStorage.getItem(filter.KEY_CHIPPER_SPEECH)==='true';}catch(_){}
      speech.onchange=()=>filter.setShowSensitiveSpeech(speech.checked);chipper.onchange=()=>filter.setChipperShowSensitiveSpeech(chipper.checked);mature.onchange=()=>filter.setShowNsfw(mature.checked);
    }
          applyAndRefresh({});
        });
      });
    }

    var clearWall = document.getElementById("clearWallpaper");
    if (clearWall) {
      clearWall.addEventListener("click", function () {
        Rice.lsSet("cb_wallpaper", "");
        if (file) file.value = "";
        if (wallStatus) wallStatus.textContent = "Wallpaper cleared.";
        syncPickersFromStorage();
    const filter=window.CoolbradorSensitiveFilter;
    if(filter){
      const speech=document.getElementById('showSensitive'),chipper=document.getElementById('showChipperSensitive'),mature=document.getElementById('showMature');
      speech.checked=filter.showSensitiveSpeech();mature.checked=filter.showNsfw();
      try{chipper.checked=localStorage.getItem(filter.KEY_CHIPPER_SPEECH)==='true';}catch(_){}
      speech.onchange=()=>filter.setShowSensitiveSpeech(speech.checked);chipper.onchange=()=>filter.setChipperShowSensitiveSpeech(chipper.checked);mature.onchange=()=>filter.setShowNsfw(mature.checked);
    }
        applyAndRefresh({});
      });
    }

    var resetCustom = document.getElementById("resetCustomColors");
    if (resetCustom) {
      resetCustom.addEventListener("click", function () {
        if (typeof Rice.resetCustomColors === "function") {
          Rice.resetCustomColors();
        } else {
          try {
            localStorage.removeItem("cb_custom_accent");
            localStorage.removeItem("cb_custom_accent2");
            localStorage.removeItem("cb_custom_surface");
          } catch (e) {}
          applyAndRefresh({});
        }
        var st = document.getElementById("themeStatus");
        if (st) st.textContent = "Custom colors cleared. Palette accents restored.";
      });
    }

  });
})();
