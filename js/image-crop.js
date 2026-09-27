/* Coolbrador image crop: pan + zoom before apply. */
(function () {
  "use strict";

  var CSS_ID = "cb-image-crop-css";
  var ROOT_ID = "cbImageCropRoot";
  var IMAGE_MAX_BYTES = 20 * 1024 * 1024;

  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = [
      "#" + ROOT_ID + "{position:fixed;inset:0;z-index:5200;display:flex;align-items:center;justify-content:center;padding:20px;background:color-mix(in srgb,var(--cb-navy) 72%,transparent);backdrop-filter:blur(12px);}",
      "#" + ROOT_ID + "[hidden]{display:none!important;}",
      ".cb-crop-dialog{width:min(560px,100%);background:var(--cb-navy);border:1px solid rgba(var(--cb-accent-rgb),0.32);box-shadow:0 18px 48px rgba(0,0,0,0.45);color:var(--cb-text);padding:16px;}",
      ".cb-crop-title{margin:0 0 10px;font-size:1.1rem;}",
      ".cb-crop-stage-wrap{position:relative;width:100%;max-height:min(58vh,420px);background:var(--cb-surface);border:1px solid rgba(var(--cb-accent-rgb),0.22);overflow:hidden;touch-action:none;cursor:grab;user-select:none;}",
      ".cb-crop-stage-wrap.is-dragging{cursor:grabbing;}",
      ".cb-crop-stage{position:relative;width:100%;height:100%;overflow:hidden;}",
      ".cb-crop-img{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;will-change:transform;max-width:none!important;}",
      ".cb-crop-guide{position:absolute;inset:0;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.45);}",
      ".cb-crop-guide.is-circle{border-radius:50%;}",
      ".cb-crop-guide.is-rect{border-radius:0;}",
      ".cb-crop-hint{margin:8px 0 0;color:var(--cb-muted);font-size:0.82rem;}",
      ".cb-crop-zoom{display:flex;align-items:center;gap:10px;margin-top:12px;}",
      ".cb-crop-zoom label{color:var(--cb-muted);font-size:0.85rem;min-width:3.2em;}",
      ".cb-crop-zoom input[type=range]{flex:1;accent-color:var(--cb-accent);}",
      ".cb-crop-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}",
      ".cb-crop-actions button{appearance:none!important;-webkit-appearance:none!important;min-width:88px!important;width:auto!important;height:auto!important;display:inline-flex!important;align-items:center;justify-content:center;padding:8px 14px!important;font:inherit!important;font-size:0.95rem!important;font-weight:700!important;cursor:pointer;border-radius:999px!important;border:1px solid rgba(var(--cb-accent-rgb),0.35)!important;background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;color:var(--cb-accent-text,#fff)!important;box-shadow:none!important;clip-path:none!important;}",
      ".cb-crop-actions button.ghost{background:transparent!important;background-image:none!important;color:var(--cb-text)!important;border:1px solid rgba(var(--cb-accent-rgb),0.35)!important;}",
      ".cb-crop-actions button.primary{background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;border:none!important;color:var(--cb-accent-text,#fff)!important;}",
      ".cb-crop-editable{cursor:pointer!important;}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function approxDataUrlBytes(dataUrl) {
    var i = String(dataUrl || "").indexOf(",");
    var b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
    return Math.floor((b64.length * 3) / 4);
  }

  function open(opts) {
    opts = opts || {};
    var src = opts.src;
    if (!src) return Promise.reject(new Error("No image"));
    ensureCss();

    var aspect = opts.aspect == null ? 1 : Number(opts.aspect);
    if (!(aspect > 0)) aspect = 0;
    var shape = opts.shape === "circle" ? "circle" : "rect";
    var maxEdge = Math.max(64, Number(opts.maxEdge) || 1024);
    var mime = opts.mime || (shape === "circle" ? "image/png" : "image/jpeg");
    var quality = typeof opts.quality === "number" ? opts.quality : 0.92;
    var onApply = typeof opts.onApply === "function" ? opts.onApply : null;

    return new Promise(function (resolve, reject) {
      var existing = document.getElementById(ROOT_ID);
      if (existing) existing.remove();

      var root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.innerHTML =
        '<div class="cb-crop-dialog">' +
          '<h2 class="cb-crop-title">Adjust image</h2>' +
          '<div class="cb-crop-stage-wrap" id="cbCropStageWrap">' +
            '<div class="cb-crop-stage" id="cbCropStage">' +
              '<img class="cb-crop-img" id="cbCropImg" alt="">' +
              '<div class="cb-crop-guide" id="cbCropGuide" aria-hidden="true"></div>' +
            "</div>" +
          "</div>" +
          '<p class="cb-crop-hint">Drag to pan. Scroll or use the slider to zoom.</p>' +
          '<div class="cb-crop-zoom">' +
            '<label for="cbCropZoom">Zoom</label>' +
            '<input type="range" id="cbCropZoom" min="1" max="100" value="1" step="1">' +
          "</div>" +
          '<div class="cb-crop-actions">' +
            '<button type="button" class="ghost" id="cbCropCancel">Cancel</button>' +
            '<button type="button" class="primary" id="cbCropApply">Apply</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(root);

      var wrap = root.querySelector("#cbCropStageWrap");
      var imgEl = root.querySelector("#cbCropImg");
      var guide = root.querySelector("#cbCropGuide");
      var zoomEl = root.querySelector("#cbCropZoom");
      var btnCancel = root.querySelector("#cbCropCancel");
      var btnApply = root.querySelector("#cbCropApply");

      var natW = 0, natH = 0;
      var viewW = 0, viewH = 0;
      var minScale = 1, maxScale = 1, scale = 1;
      var tx = 0, ty = 0;
      var dragging = false;
      var lastX = 0, lastY = 0;
      var closed = false;

      function layoutView() {
        var maxW = Math.min(wrap.parentElement ? wrap.parentElement.clientWidth - 32 : 520, 520);
        if (!(maxW > 40)) maxW = 520;
        var maxH = Math.min(window.innerHeight * 0.58, 420);
        if (aspect > 0) {
          viewW = maxW;
          viewH = viewW / aspect;
          if (viewH > maxH) {
            viewH = maxH;
            viewW = viewH * aspect;
          }
        } else {
          var ir = natW / Math.max(1, natH);
          viewW = maxW;
          viewH = viewW / ir;
          if (viewH > maxH) {
            viewH = maxH;
            viewW = viewH * ir;
          }
        }
        wrap.style.width = Math.round(viewW) + "px";
        wrap.style.height = Math.round(viewH) + "px";
        wrap.style.margin = "0 auto";
        guide.className = "cb-crop-guide " + (shape === "circle" ? "is-circle" : "is-rect");
      }

      function recomputeScales() {
        minScale = Math.max(viewW / natW, viewH / natH);
        maxScale = minScale * 4;
        scale = clamp(scale || minScale, minScale, maxScale);
        constrain();
        syncZoomUi();
        applyTransform();
      }

      function constrain() {
        var w = natW * scale;
        var h = natH * scale;
        var minX = viewW - w;
        var minY = viewH - h;
        if (w <= viewW) tx = (viewW - w) / 2;
        else tx = clamp(tx, minX, 0);
        if (h <= viewH) ty = (viewH - h) / 2;
        else ty = clamp(ty, minY, 0);
      }

      function applyTransform() {
        imgEl.style.width = natW + "px";
        imgEl.style.height = natH + "px";
        imgEl.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
      }

      function syncZoomUi() {
        var t = maxScale === minScale ? 1 : (scale - minScale) / (maxScale - minScale);
        zoomEl.value = String(Math.round(1 + t * 99));
      }

      function setScaleFromUi() {
        var t = (Number(zoomEl.value) - 1) / 99;
        var next = minScale + t * (maxScale - minScale);
        var cx = viewW / 2;
        var cy = viewH / 2;
        var ix = (cx - tx) / scale;
        var iy = (cy - ty) / scale;
        scale = clamp(next, minScale, maxScale);
        tx = cx - ix * scale;
        ty = cy - iy * scale;
        constrain();
        applyTransform();
      }

      function close(result, err) {
        if (closed) return;
        closed = true;
        window.removeEventListener("keydown", onKey);
        root.remove();
        if (err) reject(err);
        else resolve(result || null);
      }

      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          close(null);
        }
      }

      function exportDataUrl() {
        var outW, outH;
        if (aspect > 0) {
          if (aspect >= 1) {
            outW = maxEdge;
            outH = Math.max(1, Math.round(outW / aspect));
          } else {
            outH = maxEdge;
            outW = Math.max(1, Math.round(outH * aspect));
          }
        } else {
          var ratio = viewW / Math.max(1, viewH);
          if (ratio >= 1) {
            outW = maxEdge;
            outH = Math.max(1, Math.round(outW / ratio));
          } else {
            outH = maxEdge;
            outW = Math.max(1, Math.round(outH * ratio));
          }
        }

        var canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        var ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        if (shape === "circle") {
          ctx.clearRect(0, 0, outW, outH);
          ctx.beginPath();
          ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        } else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, outW, outH);
        }

        var sx = (-tx) / scale;
        var sy = (-ty) / scale;
        var sw = viewW / scale;
        var sh = viewH / scale;
        ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, outW, outH);

        var useMime = mime;
        var q = quality;
        var dataUrl = canvas.toDataURL(useMime, q);
        var guard = 0;
        while (approxDataUrlBytes(dataUrl) > IMAGE_MAX_BYTES && guard < 8) {
          if (useMime !== "image/jpeg") {
            useMime = "image/jpeg";
            q = 0.85;
          } else {
            q = Math.max(0.45, q - 0.1);
          }
          if (useMime === "image/jpeg" && shape === "circle") {
            var c2 = document.createElement("canvas");
            c2.width = outW;
            c2.height = outH;
            var g = c2.getContext("2d");
            g.fillStyle = "#0b1524";
            g.fillRect(0, 0, outW, outH);
            g.beginPath();
            g.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2);
            g.closePath();
            g.clip();
            g.drawImage(canvas, 0, 0);
            dataUrl = c2.toDataURL("image/jpeg", q);
          } else {
            dataUrl = canvas.toDataURL(useMime, q);
          }
          guard++;
        }
        if (approxDataUrlBytes(dataUrl) > IMAGE_MAX_BYTES) {
          throw new Error("File too large (max ~20MB).");
        }
        return dataUrl;
      }

      btnCancel.addEventListener("click", function () { close(null); });
      btnApply.addEventListener("click", function () {
        try {
          var dataUrl = exportDataUrl();
          if (onApply) onApply(dataUrl);
          close(dataUrl);
        } catch (err) {
          close(null, err);
        }
      });
      zoomEl.addEventListener("input", setScaleFromUi);

      wrap.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        dragging = true;
        wrap.classList.add("is-dragging");
        lastX = e.clientX;
        lastY = e.clientY;
        try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      });
      wrap.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        tx += dx;
        ty += dy;
        constrain();
        applyTransform();
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove("is-dragging");
        try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      wrap.addEventListener("pointerup", endDrag);
      wrap.addEventListener("pointercancel", endDrag);
      wrap.addEventListener("wheel", function (e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? -0.08 : 0.08;
        var next = clamp(scale * (1 + delta), minScale, maxScale);
        var rect = wrap.getBoundingClientRect();
        var cx = e.clientX - rect.left;
        var cy = e.clientY - rect.top;
        var ix = (cx - tx) / scale;
        var iy = (cy - ty) / scale;
        scale = next;
        tx = cx - ix * scale;
        ty = cy - iy * scale;
        constrain();
        syncZoomUi();
        applyTransform();
      }, { passive: false });

      window.addEventListener("keydown", onKey);

      imgEl.onload = function () {
        natW = imgEl.naturalWidth || imgEl.width;
        natH = imgEl.naturalHeight || imgEl.height;
        if (!natW || !natH) {
          close(null, new Error("Could not load image."));
          return;
        }
        layoutView();
        scale = 0;
        recomputeScales();
        tx = (viewW - natW * scale) / 2;
        ty = (viewH - natH * scale) / 2;
        constrain();
        applyTransform();
      };
      imgEl.onerror = function () {
        close(null, new Error("Could not load image."));
      };
      try { imgEl.crossOrigin = "anonymous"; } catch (err) {}
      imgEl.src = src;

      window.addEventListener("resize", function onResize() {
        if (closed) {
          window.removeEventListener("resize", onResize);
          return;
        }
        if (!natW) return;
        var cx = (viewW / 2 - tx) / scale;
        var cy = (viewH / 2 - ty) / scale;
        layoutView();
        recomputeScales();
        tx = viewW / 2 - cx * scale;
        ty = viewH / 2 - cy * scale;
        constrain();
        applyTransform();
      });
    });
  }

  window.CoolbradorImageCrop = {
    open: open,
    IMAGE_MAX_BYTES: IMAGE_MAX_BYTES
  };
})();
