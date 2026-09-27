(function () {
  const RAISED_KEY = "christmas_raised";
  const DONATIONS_KEY = "christmas_donations";

  function escapeHtml(s) {
    if (window.CoolbradorPosts) return window.CoolbradorPosts.escapeHtml(s);
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function donorUserId(name) {
    var map = {
      AnthonySpade: "4", BeeSid: "1", Cardbrador: "2", GyattToad: "3",
      GiftGoblin: "7", SnowChipper: "12", Citizen: "0"
    };
    return map[name] || name || "guest";
  }

  var GIFT_SEED_VERSION = "3";
  var GIFT_DONOR_SEED_KEY = "gift_donor_seed_v";

  function seedDonors() {
    var donations = [];
    try { donations = JSON.parse(localStorage.getItem(DONATIONS_KEY) || "[]"); } catch (e) { donations = []; }
    var need = localStorage.getItem(GIFT_DONOR_SEED_KEY) !== GIFT_SEED_VERSION;
    if (need || !donations.length) {
      donations = [
        { name: "AnthonySpade", amount: 50, message: "For the good boys and girls of Coolbrador", type: "Donate Once", date: Date.now() - 86400000 * 3, avatar: "/shared/TestImages/ProfilePhotos/AnthonySpade.png", media: "/shared/TestImages/World%20Leaders.jpg" },
        { name: "BeeSid", amount: 25, message: "May your stockings be full of rhombuses", type: "Monthly", date: Date.now() - 86400000 * 2, avatar: "/shared/TestImages/ProfilePhotos/BeeSid.png", media: "/shared/TestImages/Propaganda.jpg" },
        { name: "Cardbrador", amount: 100, message: null, type: "Donate Once", date: Date.now() - 86400000, avatar: "/shared/TestImages/ProfilePhotos/Cardbrador.png", media: "/shared/TestImages/Liltle%20Jimmy%20but%20Sonic.png" },
        { name: "GyattToad", amount: 10, message: "tiny gift, huge vibes", type: "Donate Once", date: Date.now() - 3600000, avatar: "/shared/TestImages/ProfilePhotos/GyattToad.png", media: "/shared/TestImages/Fake%20Friends.gif" }
      ];
      localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
      var total = donations.reduce(function (s, d) { return s + d.amount; }, 0);
      localStorage.setItem(RAISED_KEY, String(total));
      localStorage.setItem(GIFT_DONOR_SEED_KEY, GIFT_SEED_VERSION);
    }
    return donations;
  }

  function renderLeaderboard(donations) {
    var totals = {};
    var messagesByName = {};
    var avatarByName = {};
    var mediaByName = {};
    var dateByName = {};
    donations.forEach(function (d) {
      totals[d.name] = (totals[d.name] || 0) + d.amount;
      if (d.message) messagesByName[d.name] = d.message;
      if (d.avatar) avatarByName[d.name] = d.avatar;
      if (d.media) mediaByName[d.name] = d.media;
      if (d.date) dateByName[d.name] = d.date;
    });
    var sorted = Object.keys(totals).map(function (n) { return [n, totals[n]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 30);
    var CP = window.CoolbradorPosts;
    var el = document.getElementById("topDonors");
    if (!el) return;
    if (!sorted.length) {
      el.innerHTML = '<p class="empty-feed">No donations yet. Be the first Labrador!</p>';
      return;
    }
    el.classList.add("hub-feed", "gallery", "items");
    el.innerHTML = sorted.map(function (pair, i) {
      var name = pair[0], amt = pair[1];
      var msg = messagesByName[name] || ("Gifted $" + amt.toLocaleString() + " to the drive.");
      var mediaUrl = mediaByName[name];
      var pseudo = {
        id: "donor-" + i,
        username: name,
        userId: donorUserId(name),
        text: msg,
        timestamp: dateByName[name] || Date.now(),
        yeahs: [],
        replies: [],
        views: 0,
        media: mediaUrl ? { type: "image", url: mediaUrl } : null
      };
      if (CP && CP.renderPostCard) {
        return CP.renderPostCard(pseudo, {
          showBoard: false,
          hideBoard: true,
          showMenu: false,
          showActions: false,
          showYeahSection: false,
          className: "post-donor",
          skipThreadLink: true,
          avatar: avatarByName[name],
          headerExtra: '<span class="post-meta donor-rank">#' + (i + 1) + ' · $' + amt.toLocaleString() + "</span>"
        });
      }
      return (
        '<div class="donor-entry"><div class="donor-main">' +
        (avatarByName[name] ? '<img class="donor-avatar" src="' + avatarByName[name] + '" alt="" width="32" height="32" style="border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;">' : "") +
        '<span class="rank">#' + (i + 1) + "</span>" +
        '<span class="name">' + escapeHtml(name) + "</span>" +
        '<span class="amount">$' + amt.toLocaleString() + "</span></div>" +
        (messagesByName[name] ? '<div class="donor-message">' + escapeHtml(messagesByName[name]) + "</div>" : "") +
        "</div>"
      );
    }).join("");
  }


  document.addEventListener("DOMContentLoaded", function () {
    var donations = seedDonors();
    var raisedEl = document.getElementById("giftRaised") || document.querySelector(".raised");
    var total = Number(localStorage.getItem(RAISED_KEY) || 0);
    if (raisedEl) raisedEl.textContent = "$" + total.toLocaleString();
    renderLeaderboard(donations);

    document.querySelectorAll(".donate-btn").forEach(function (btn) {
      btn.onclick = function () {
        var type = btn.textContent.trim();
        var name = prompt("Your name/nickname (shown publicly):") || "Anonymous";
        var amount = prompt("Enter " + type.toLowerCase() + " donation amount ($):");
        var message = prompt("Optional message:");
        if (amount && !isNaN(amount) && Number(amount) > 0) {
          var num = Number(amount);
          total += num;
          localStorage.setItem(RAISED_KEY, String(total));
          if (raisedEl) raisedEl.textContent = "$" + total.toLocaleString();
          donations.push({ name: name, amount: num, message: message || null, type: type, date: Date.now() });
          localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
          renderLeaderboard(donations);
          alert("Thank you " + name + " for donating $" + amount + "! (Demo only. No real payment.)");
        }
      };
    });

    var collapse = document.querySelector(".gift-page .section-header.collapsible");
    if (collapse) {
      collapse.addEventListener("click", function () {
        var content = collapse.parentElement.querySelector(".leaderboard-content");
        if (!content) return;
        content.classList.toggle("collapsed");
        var btn = collapse.querySelector(".collapse-btn");
        if (btn) btn.textContent = content.classList.contains("collapsed") ? "+" : "-";
      });
    }
  });
})();