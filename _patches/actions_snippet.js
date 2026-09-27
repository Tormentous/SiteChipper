      var actions = document.getElementById("profileActions");
      actions.innerHTML =
        (isOwn ? '<button type="button" class="primary" id="editToggle">Edit</button>' : "") +
        '<div class="cb-share-wrap" id="shareWrap">' +
          '<button type="button" class="cb-icon-btn ghost" id="shareToggle" title="Share" aria-label="Share"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
        "</div>";
      var shareMenuEl = document.getElementById("shareMenu");
      var shareWrapEl = document.getElementById("shareWrap");
      if (shareMenuEl && shareWrapEl && shareMenuEl.parentElement !== shareWrapEl) {
        shareWrapEl.appendChild(shareMenuEl);
      }
