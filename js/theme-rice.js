/**
 * Coolbrador theme rice: palette + light/dark mode + custom colors + wallpaper.
 * localStorage keys: cb_theme, cb_mode, cb_custom_accent, cb_custom_accent2,
 *   cb_custom_surface, cb_wallpaper, cb_wallpaper_tint, cb_wallpaper_blur
 *
 * applyCustomColors READS and APPLIES saved colors. It never deletes those keys.
 * Use resetCustomColors() (Settings button) to clear them on purpose.
 */
(function (global) {
  var KNOWN = ["default", "green", "ember", "violet", "ocean", "rose", "slate"];
  var LABELS = {
    default: "Coolbrador",
    green: "Green",
    ember: "Ember",
    violet: "Violet",
    ocean: "Ocean",
    rose: "Rose",
    slate: "Slate"
  };

  function hexToRgb(hex) {
    if (!hex) return null;
    var h = String(hex).replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      hex: "#" + h.toLowerCase()
    };
  }

  function normalizeTheme(theme) {
    if (theme === "certa-green") return "green";
    if (theme === "light") return "default";
    if (KNOWN.indexOf(theme) !== -1) return theme;
    return "default";
  }

  function normalizeMode(mode) {
    return mode === "light" ? "light" : "dark";
  }

  function lsGet(k, fallback) {
    try {
      var v = localStorage.getItem(k);
      return v == null || v === "" ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function lsSet(k, v) {
    try {
      if (v == null || v === "") localStorage.removeItem(k);
      else localStorage.setItem(k, String(v));
      return true;
    } catch (e) {
      return false;
    }
  }

  function migrateLegacyLightTheme() {
    try {
      if (localStorage.getItem("cb_theme") === "light") {
        localStorage.setItem("cb_theme", "default");
        if (!localStorage.getItem("cb_mode")) localStorage.setItem("cb_mode", "light");
      }
      if (localStorage.getItem("cb_theme") === "certa-green") {
        localStorage.setItem("cb_theme", "green");
      }
    } catch (e) {}
  }

  function clearThemeClasses(el) {
    if (!el || !el.classList) return;
    Array.prototype.slice.call(el.classList).forEach(function (c) {
      if (c.indexOf("theme-") === 0 || c.indexOf("mode-") === 0 || c.indexOf("pre-theme-") === 0) {
        el.classList.remove(c);
      }
    });
  }

  /**
   * Apply saved custom colors. NEVER removeItem cb_custom_* here.
   */
  function applyCustomColors(root) {
    root = root || document.documentElement;
    var accent = hexToRgb(lsGet("cb_custom_accent", ""));
    var accent2 = hexToRgb(lsGet("cb_custom_accent2", ""));
    var surface = hexToRgb(lsGet("cb_custom_surface", ""));

    // Clear previous inline overrides only (CSS vars), not localStorage.
    ["--cb-accent", "--cb-accent-2", "--cb-accent-text", "--cb-accent-rgb", "--cb-accent-2-rgb", "--cb-link", "--cb-surface"].forEach(function (p) {
      root.style.removeProperty(p);
    });
    root.classList.remove("cb-has-custom-accent", "cb-has-custom-surface");

    if (accent) {
      root.style.setProperty("--cb-accent", accent.hex);
      root.style.setProperty("--cb-link", accent.hex);
      root.style.setProperty("--cb-accent-text", accent.hex);
      root.style.setProperty("--cb-accent-rgb", accent.r + ", " + accent.g + ", " + accent.b);
      root.classList.add("cb-has-custom-accent");
    }
    if (accent2) {
      root.style.setProperty("--cb-accent-2", accent2.hex);
      root.style.setProperty("--cb-accent-2-rgb", accent2.r + ", " + accent2.g + ", " + accent2.b);
    }
    if (surface) {
      root.style.setProperty("--cb-surface", surface.hex);
      root.classList.add("cb-has-custom-surface");
    }
  }

  /** Intentional clear only — wired to Settings "Reset custom colors". */
  function resetCustomColors() {
    try {
      localStorage.removeItem("cb_custom_accent");
      localStorage.removeItem("cb_custom_accent2");
      localStorage.removeItem("cb_custom_surface");
    } catch (e) {}
    applyCustomColors(document.documentElement);
    applyRice({ persist: false });
  }

  function applyWallpaper(root) {
    root = root || document.documentElement;
    var wall = lsGet("cb_wallpaper", "");
    var tint = parseInt(lsGet("cb_wallpaper_tint", "55"), 10);
    var blur = parseInt(lsGet("cb_wallpaper_blur", "0"), 10);
    if (isNaN(tint)) tint = 55;
    if (isNaN(blur)) blur = 0;
    tint = Math.max(0, Math.min(90, tint));
    blur = Math.max(0, Math.min(20, blur));

    if (wall) {
      root.classList.add("cb-has-wallpaper");
      if (document.body) document.body.classList.add("cb-has-wallpaper");
      root.style.setProperty("--cb-wallpaper", 'url("' + wall.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '")');
      root.style.setProperty("--cb-wallpaper-tint", tint + "%");
      root.style.setProperty("--cb-wallpaper-blur", blur + "px");
    } else {
      root.classList.remove("cb-has-wallpaper");
      if (document.body) document.body.classList.remove("cb-has-wallpaper");
      root.style.removeProperty("--cb-wallpaper");
      root.style.removeProperty("--cb-wallpaper-tint");
      root.style.removeProperty("--cb-wallpaper-blur");
    }
  }

  function applyRice(opts) {
    migrateLegacyLightTheme();
    opts = opts || {};
    var root = document.documentElement;
    var theme = normalizeTheme(opts.theme != null ? opts.theme : lsGet("cb_theme", "default"));
    var mode = normalizeMode(opts.mode != null ? opts.mode : lsGet("cb_mode", "dark"));

    if (opts.persist !== false) {
      lsSet("cb_theme", theme);
      lsSet("cb_mode", mode);
    }

    root.dataset.theme = theme;
    root.dataset.mode = mode;

    if (document.body) {
      clearThemeClasses(document.body);
      if (theme !== "default") document.body.classList.add("theme-" + theme);
      document.body.classList.add("mode-" + mode);
    }

    clearThemeClasses(root);
    if (theme !== "default") root.classList.add("pre-theme-" + theme);

    applyCustomColors(root);
    applyWallpaper(root);

    return { theme: theme, mode: mode };
  }

  function fileToWallpaperDataUrl(file, cb) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      cb(new Error("Pick an image file"), null);
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { cb(new Error("Could not read file"), null); };
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var maxW = 1600;
        var scale = img.width > maxW ? maxW / img.width : 1;
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        var quality = 0.72;
        var dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 1800000 && quality > 0.4) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length > 2200000) {
          cb(new Error("Image still too large after compress. Try a smaller file."), null);
          return;
        }
        cb(null, dataUrl);
      };
      img.onerror = function () { cb(new Error("Invalid image"), null); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function earlyBoot() {
    migrateLegacyLightTheme();
    applyRice({ persist: false });
  }

  global.CoolbradorRice = {
    KNOWN: KNOWN,
    LABELS: LABELS,
    normalizeTheme: normalizeTheme,
    normalizeMode: normalizeMode,
    applyRice: applyRice,
    applyCustomColors: applyCustomColors,
    resetCustomColors: resetCustomColors,
    applyWallpaper: applyWallpaper,
    fileToWallpaperDataUrl: fileToWallpaperDataUrl,
    earlyBoot: earlyBoot,
    hexToRgb: hexToRgb,
    lsGet: lsGet,
    lsSet: lsSet
  };
})(window);
