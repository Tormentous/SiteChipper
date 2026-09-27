/**
 * Coolbrador Mod Panel - edit users (incl. fake demos), post text + media.
 */
(function () {
  "use strict";

  var DEFAULT_PIN = "coolbrador";
  var KNOWN_BOARDS = [
    "General", "BeeSid", "beesid", "testboard", "ChipperCorner",
    "Starry", "Labradoria", "MutinyDesk", "GiftDrive", "FarmReport",
    "Invasions", "Mutinies4Lyfe", "FarmDESTROYERSCLUB"
  ];
  /* Boards with static JSON under /data/boards/ (auto-hydrate if LS empty). */
  var HYDRATE_BOARDS = ["BeeSid"];
  /* Seed posts for community boards that have no static JSON (mirrors seed-demo). */
  var COMMUNITY_SEED_BOARDS = [
    { name: "Starry", desc: "Night-sky posts and vibe checks.", media: "/img/Starheld.png", text: "Starheld check. Who else is staring up?" },
    { name: "ChipperCorner", desc: "Planet Chipper chatter before launch.", media: "/img/PlanetChipperHomepage.png", text: "Chipper corner is open. Kicks and giggles only." },
    { name: "Labradoria", desc: "Sim talk for La Brador and the pack.", media: "/img/TheSeas.png", text: "La Brador map drop. Labradors welcome." },
    { name: "MutinyDesk", desc: "Receipts, charges, and plank energy.", media: "/shared/TestImages/Propaganda.jpg", text: "Mutiny desk is staffed. Bring receipts." },
    { name: "GiftDrive", desc: "Seasonal gifts, stockings, charity bits.", media: "/img/Tropical.png", text: "Gift drive thread. Stockings optional." },
    { name: "FarmReport", desc: "For You farm posts and chill updates.", media: "/shared/TestImages/Farm.jpg", text: "Farm report: vibes irrigated, chaos harvested." },
    { name: "Invasions", desc: "Invasion watch and raid chatter.", media: "/img/Osaka_Stars.png", text: "Invasion desk is open. Report sightings." },
    { name: "Mutinies4Lyfe", desc: "Mutiny forever energy.", media: "/shared/TestImages/Propaganda.jpg", text: "Mutinies4Lyfe check-in. Bring snacks." },
    { name: "FarmDESTROYERSCLUB", desc: "Farm chaos club.", media: "/shared/TestImages/Farm.jpg", text: "FarmDESTROYERSCLUB is in session." }
  ];

  /* Canonical demo roster (ids 0/1 reserved for real Labradors). Extra Miiverse
   * personas get 24+ so they show in Users even when BeeSid.json only stamps
   * a colliding numeric userId or a bare username. */
  var DEMO_USERS = [
    { id: "2", displayName: "Cardbrador", handle: "cardbrador", defaultAvatar: "/shared/TestImages/ProfilePhotos/Cardbrador.png" },
    { id: "3", displayName: "BeeSid", handle: "beesid", defaultAvatar: "/shared/TestImages/ProfilePhotos/BeeSid.png" },
    { id: "4", displayName: "Miguel", handle: "miguel", defaultAvatar: "/shared/TestImages/ProfilePhotos/Miguel.webp" },
    { id: "5", displayName: "GyattToad", handle: "gyatttoad", defaultAvatar: "/shared/TestImages/ProfilePhotos/GyattToad.png" },
    { id: "6", displayName: "AnthonySpade", handle: "anthonyspade", defaultAvatar: "/shared/TestImages/ProfilePhotos/AnthonySpade.png" },
    { id: "7", displayName: "Barcat", handle: "barcat", defaultAvatar: "/shared/TestImages/ProfilePhotos/Barcat.png" },
    { id: "8", displayName: "EvilRobot", handle: "evilrobot", defaultAvatar: "/shared/TestImages/ProfilePhotos/EvilRobot.jpg" },
    { id: "9", displayName: "AbovegroundBro", handle: "abovegroundbro", defaultAvatar: "/shared/TestImages/ProfilePhotos/AbovegroundBro.png" },
    { id: "10", displayName: "NerdDog", handle: "nerddog", defaultAvatar: "/shared/TestImages/ProfilePhotos/NerdDog.png" },
    { id: "11", displayName: "OrangeTabby", handle: "orangetabby", defaultAvatar: "/shared/TestImages/ProfilePhotos/OrangeTabby.png" },
    { id: "12", displayName: "EvilKid23", handle: "evilkids23", defaultAvatar: "/shared/TestImages/ProfilePhotos/EvilKid23.png" },
    { id: "13", displayName: "NoFilterBro", handle: "nofilterbro", defaultAvatar: "/shared/TestImages/ProfilePhotos/NoFilterBro.png" },
    { id: "14", displayName: "CoolDog", handle: "cooldog", defaultAvatar: "/shared/TestImages/ProfilePhotos/CoolDog.png" },
    { id: "15", displayName: "ANIMEGIRL", handle: "animegirl", defaultAvatar: "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png" },
    { id: "16", displayName: "PantsWetterLabrador", handle: "pantswetter", defaultAvatar: "/shared/TestImages/ProfilePhotos/CoolDog.png" },
    { id: "17", displayName: "RhombusRex", handle: "rhombusrex", defaultAvatar: "/shared/TestImages/ProfilePhotos/EvilRobot.jpg" },
    { id: "18", displayName: "SnackBandit", handle: "snackbandit", defaultAvatar: "/shared/TestImages/ProfilePhotos/GyattToad.png" },
    { id: "19", displayName: "BarTabby", handle: "bartabby", defaultAvatar: "/shared/TestImages/ProfilePhotos/OrangeTabby.png" },
    { id: "20", displayName: "PuddlePirate", handle: "puddlepirate", defaultAvatar: "/shared/TestImages/ProfilePhotos/Miguel.webp" },
    { id: "21", displayName: "TreatTaxer", handle: "treattaxer", defaultAvatar: "/shared/TestImages/ProfilePhotos/Barcat.png" },
    { id: "22", displayName: "SofaThief", handle: "sofathief", defaultAvatar: "/shared/TestImages/ProfilePhotos/NerdDog.png" },
    { id: "23", displayName: "BarkBroker", handle: "barkbroker", defaultAvatar: "/shared/TestImages/ProfilePhotos/AbovegroundBro.png" },
    { id: "24", displayName: "Chipper", handle: "chipper", defaultAvatar: "/img/PlanetChipperHomepage.png" },
    { id: "25", displayName: "LabPuppy", handle: "labpuppy", defaultAvatar: "/shared/TestImages/ProfilePhotos/CoolDog.png" },
    { id: "26", displayName: "MetalLabFan", handle: "metallabfan", defaultAvatar: "/shared/TestImages/ProfilePhotos/NerdDog.png" },
    { id: "27", displayName: "PollenPete", handle: "pollenpete", defaultAvatar: "/shared/TestImages/ProfilePhotos/GyattToad.png" },
    { id: "28", displayName: "CrateKid", handle: "cratekid", defaultAvatar: "/shared/TestImages/ProfilePhotos/AnthonySpade.png" }
  ];

  var DEMO_BY_ID = {};
  var DEMO_BY_NAME = {};
  DEMO_USERS.forEach(function (d) {
    DEMO_BY_ID[d.id] = d;
    DEMO_BY_NAME[String(d.displayName).toLowerCase()] = d;
    DEMO_BY_NAME[String(d.handle).toLowerCase()] = d;
  });
  /* BeeSid.json uses userId "chipper" for Chipper's board note. */
  DEMO_BY_ID["chipper"] = DEMO_BY_ID["24"];

  function el(id) { return document.getElementById(id); }

  function toast(msg, ok) {
    var node = el("modStatus");
    if (!node) return;
    node.textContent = msg || "";
    node.classList.toggle("is-error", ok === false);
  }

  function currentUid() {
    try { return String(localStorage.getItem("currentUserId") || "").trim(); } catch (e) { return ""; }
  }

  function expectedPin() {
    try {
      var custom = localStorage.getItem("cb_mod_pin");
      if (custom) return String(custom);
    } catch (e) {}
    return DEFAULT_PIN;
  }

  function isUnlocked() {
    try {
      if (sessionStorage.getItem("cb_mod_ok") === "1") return true;
      var uids = JSON.parse(localStorage.getItem("cb_mod_uids") || "[]");
      var id = currentUid();
      return !!(id && Array.isArray(uids) && uids.map(String).indexOf(id) !== -1);
    } catch (e) { return false; }
  }

  function unlock(pin) {
    if (String(pin || "") !== expectedPin()) return false;
    try { sessionStorage.setItem("cb_mod_ok", "1"); } catch (e) {}
    return true;
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      var msg = (e && e.name === "QuotaExceededError")
        ? "localStorage full (often a big data-URL upload). Use a shorter URL or smaller file."
        : ("Save failed: " + (e && e.message ? e.message : "storage error"));
      toast(msg, false);
      return false;
    }
  }

  function readUser(id) {
    try {
      var u = JSON.parse(localStorage.getItem("user_" + id) || "{}");
      return u && typeof u === "object" ? u : {};
    } catch (e) { return {}; }
  }

  function readProfile(id) {
    try {
      var p = JSON.parse(localStorage.getItem("profile_" + id) || "null");
      return p && typeof p === "object" ? p : null;
    } catch (e) { return null; }
  }

  function getPfp(id) {
    try {
      if (window.CoolbradorPosts && typeof window.CoolbradorPosts.getPfp === "function") {
        var fromApi = window.CoolbradorPosts.getPfp(id);
        if (fromApi) return fromApi;
      }
      var direct = localStorage.getItem("pfp_" + id);
      if (direct) return direct;
      var u = readUser(id);
      if (u.avatar || u.pfp || u.photoURL || u.photo || u.profilePicture) {
        return u.avatar || u.pfp || u.photoURL || u.photo || u.profilePicture;
      }
      var p = readProfile(id);
      if (p && (p.avatar || p.pfp || p.photoURL)) return p.avatar || p.pfp || p.photoURL;
      var demo = DEMO_BY_ID[String(id)];
      if (demo) return demo.defaultAvatar;
      return "/users/default/pfp.jpg";
    } catch (e) { return "/users/default/pfp.jpg"; }
  }

  function ensureUserRecord(id, meta) {
    id = String(id);
    if (!id) return;
    meta = meta || {};
    var demo = DEMO_BY_ID[id] || DEMO_BY_NAME[String(meta.displayName || meta.username || "").toLowerCase()];
    var name = meta.displayName || meta.username || (demo && demo.displayName) || ("User " + id);
    var handle = String(meta.handle || (demo && demo.handle) || name.toLowerCase().replace(/\s+/g, "")).replace(/^@/, "");
    var avatar = meta.avatar || (demo && demo.defaultAvatar) || "/users/default/pfp.jpg";
    var existing = readUser(id);
    var hasUser = !!(localStorage.getItem("user_" + id));
    if (!hasUser || !(existing.displayName || existing.username)) {
      var u = existing;
      u.username = u.username || name;
      u.displayName = u.displayName || name;
      u.handle = u.handle || handle;
      u.profilePicture = u.profilePicture || u.avatar || u.pfp || avatar;
      u.avatar = u.avatar || u.profilePicture;
      u.demo = u.demo != null ? u.demo : true;
      if (!safeSet("user_" + id, JSON.stringify(u))) return;
    }
    if (!localStorage.getItem("profile_" + id)) {
      safeSet("profile_" + id, JSON.stringify({
        id: id,
        displayName: name,
        handle: handle,
        avatar: avatar,
        demo: true
      }));
    }
    if (!localStorage.getItem("pfp_" + id)) {
      safeSet("pfp_" + id, avatar);
    }
  }

  function ensureDemoUsers() {
    DEMO_USERS.forEach(function (d) {
      ensureUserRecord(d.id, d);
    });
    /* Alias string id used in BeeSid board note. */
    ensureUserRecord("chipper", DEMO_BY_ID["24"]);
  }

  function harvestAuthorsFromPosts() {
    var seenNames = {};
    listBoardKeys().forEach(function (key) {
      readPosts(key).forEach(function (p) {
        function consider(node) {
          if (!node) return;
          var name = String(node.username || node.displayName || "").trim();
          var uid = node.userId != null ? String(node.userId) : (node.authorId != null ? String(node.authorId) : "");
          if (uid) ensureUserRecord(uid, {
            displayName: name || undefined,
            handle: node.handle,
            avatar: node.avatar || node.pfp || node.avatar_url
          });
          if (!name) return;
          var low = name.toLowerCase();
          if (seenNames[low]) return;
          seenNames[low] = true;
          var demo = DEMO_BY_NAME[low];
          if (demo) {
            ensureUserRecord(demo.id, {
              displayName: demo.displayName,
              handle: demo.handle,
              avatar: node.avatar || node.pfp || node.avatar_url || demo.defaultAvatar
            });
            return;
          }
          /* Unknown author name without a coherent user record: stable demo:Name id. */
          var rec = uid ? readUser(uid) : {};
          var recName = String(rec.displayName || rec.username || "").toLowerCase();
          if (uid && recName && recName === low) return;
          if (uid && DEMO_BY_ID[uid] && String(DEMO_BY_ID[uid].displayName).toLowerCase() === low) return;
          var fakeId = "demo:" + name.replace(/\s+/g, "");
          ensureUserRecord(fakeId, {
            displayName: name,
            handle: String(node.handle || name).replace(/^@/, "").toLowerCase(),
            avatar: node.avatar || node.pfp || node.avatar_url
          });
        }
        consider(p);
        (p.replies || []).forEach(consider);
      });
    });
  }

  function listBoardKeys() {
    var keys = {};
    function add(k) { if (k) keys[k] = true; }
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      if (/^posts_\/b\//i.test(k)) add(k);
    }
    KNOWN_BOARDS.forEach(function (name) {
      add("posts_/b/" + name);
      add("posts_/b/" + String(name).toLowerCase());
    });
    return Object.keys(keys).sort();
  }

  function boardLabel(key) {
    return String(key || "").replace(/^posts_\/b\//i, "");
  }

  function readPosts(key) {
    try {
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function writePosts(key, list) {
    return safeSet(key, JSON.stringify(list || []));
  }

  function currentBoardKey() {
    var sel = el("modBoardSelect");
    var v = sel && sel.value ? String(sel.value) : "";
    if (v) return v;
    var keys = listBoardKeys();
    return keys.length ? keys[0] : "posts_/b/BeeSid";
  }

  function currentBoardName() {
    return boardLabel(currentBoardKey()) || "BeeSid";
  }

  function isBeeSidName(name) {
    return /^beesid$/i.test(String(name || "").trim());
  }

  /** Prefer the LS key for a board name that currently holds the most posts. */
  function preferBoardKey(boardName) {
    var name = String(boardName || "").trim() || "BeeSid";
    var cands = [
      "posts_/b/" + name,
      "posts_/b/" + name.toLowerCase(),
      "posts_/b/" + name.toUpperCase(),
      "posts_/b/" + (name.charAt(0).toUpperCase() + name.slice(1))
    ];
    var best = "posts_/b/" + name;
    var bestLen = -1;
    var seen = {};
    function consider(k) {
      if (!k || seen[k]) return;
      seen[k] = true;
      var n = readPosts(k).length;
      if (n > bestLen) {
        bestLen = n;
        best = k;
      }
    }
    cands.forEach(consider);
    var want = name.toLowerCase();
    listBoardKeys().forEach(function (k) {
      if (boardLabel(k).toLowerCase() === want) consider(k);
    });
    return best;
  }

  function seedCommunityBoardIfEmpty(boardName) {
    boardName = String(boardName || "").trim();
    if (!boardName || isBeeSidName(boardName)) return { ok: false, reason: "skip" };
    var key = "posts_/b/" + boardName;
    if (readPosts(key).length) return { ok: true, skipped: true, key: key, count: readPosts(key).length };
    var meta = null;
    for (var i = 0; i < COMMUNITY_SEED_BOARDS.length; i++) {
      if (COMMUNITY_SEED_BOARDS[i].name === boardName) { meta = COMMUNITY_SEED_BOARDS[i]; break; }
    }
    if (boardName === "General") {
      var gPosts = [
        {
          id: Date.now() - 5000,
          username: "Cardbrador",
          displayName: "Cardbrador",
          userId: "2",
          text: "Welcome aboard. Pick a community when you post. General is the default landing board.",
          media: null,
          timestamp: new Date(Date.now() - 5000).toISOString(),
          yeahs: [],
          replies: [],
          views: 12
        }
      ];
      if (!writePosts(key, gPosts)) return { ok: false, reason: "quota" };
      try {
        if (!localStorage.getItem("boardmeta_/b/General")) {
          localStorage.setItem("boardmeta_/b/General", JSON.stringify({
            name: "General",
            desc: "Default landing community. Most people post in their own boards; General is the shared front porch."
          }));
        }
      } catch (e) {}
      return { ok: true, key: key, count: gPosts.length, seeded: true };
    }
    if (!meta) return { ok: false, reason: "no-seed" };
    var idx = COMMUNITY_SEED_BOARDS.indexOf(meta);
    var t0 = Date.now() - (idx + 1) * 7000;
    var seeded = [
      {
        id: t0,
        username: ["Cardbrador", "BeeSid", "Miguel", "GyattToad", "CoolDog", "NerdDog"][idx % 6],
        displayName: ["Cardbrador", "BeeSid", "Miguel", "GyattToad", "CoolDog", "NerdDog"][idx % 6],
        userId: String([2, 3, 4, 5, 14, 10][idx % 6]),
        text: meta.text,
        media: { type: "image", url: meta.media },
        timestamp: new Date(t0).toISOString(),
        yeahs: ["3"].slice(0, (idx % 2) + 1),
        replies: [],
        views: 10 + idx * 3
      },
      {
        id: t0 - 1000,
        username: ["AnthonySpade", "Barcat", "ANIMEGIRL", "OrangeTabby", "AbovegroundBro", "NoFilterBro"][idx % 6],
        displayName: ["AnthonySpade", "Barcat", "ANIMEGIRL", "OrangeTabby", "AbovegroundBro", "NoFilterBro"][idx % 6],
        userId: String([6, 7, 15, 11, 9, 13][idx % 6]),
        text: "Testing " + boardName + " for the pack.",
        media: null,
        timestamp: new Date(t0 - 1000).toISOString(),
        yeahs: [],
        replies: [],
        views: 4 + idx
      }
    ];
    if (!writePosts(key, seeded)) return { ok: false, reason: "quota" };
    try {
      var mkey = "boardmeta_/b/" + boardName;
      if (!localStorage.getItem(mkey)) {
        localStorage.setItem(mkey, JSON.stringify({ name: boardName, desc: meta.desc, test: true }));
      }
    } catch (e2) {}
    return { ok: true, key: key, count: seeded.length, seeded: true };
  }

  function ensureCommunityBoardsSeeded() {
    seedCommunityBoardIfEmpty("General");
    COMMUNITY_SEED_BOARDS.forEach(function (b) {
      seedCommunityBoardIfEmpty(b.name);
    });
  }

  /* --- Chipper feed derivation (no hardcoded post bodies) --- */
  var CHIPPER_MIRROR_KEY = "chipper_game_board_feed_mirror";
  var CHIPPER_BOARD_MIRROR_KEY = "cb_boards_BeeSid_mirror";
  var SITE_ORIGIN = "https://coolbrador.com";

  function yeahCount(p) {
    if (!p) return 0;
    if (Array.isArray(p.yeahs)) return p.yeahs.length;
    var n = Number(p.yeahs);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function viewCount(p) {
    var n = Number(p && p.views);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function absMediaUrl(url) {
    var s = String(url || "").trim();
    if (!s) return "";
    if (s.indexOf("data:") === 0 || s.indexOf("blob:") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === "/") return SITE_ORIGIN + s;
    return SITE_ORIGIN + "/" + s.replace(/^\.\//, "");
  }

  function mediaListForFeed(p) {
    var m = p && p.media;
    if (!m) {
      if (p && (p.mediaUrl || p.image)) {
        return [{ url: absMediaUrl(p.mediaUrl || p.image), type: "image" }];
      }
      return [];
    }
    if (Array.isArray(m)) {
      return m.map(function (item) {
        if (!item) return null;
        if (typeof item === "string") return { url: absMediaUrl(item), type: "image" };
        if (item.url) return { url: absMediaUrl(item.url), type: item.type || "image" };
        return null;
      }).filter(Boolean);
    }
    if (m && m.url) return [{ url: absMediaUrl(m.url), type: m.type || "image" }];
    if (typeof m === "string") return [{ url: absMediaUrl(m), type: "image" }];
    return [];
  }

  function chronoSortPosts(posts) {
    return (posts || []).slice().sort(function (a, b) {
      var ta = Date.parse(a && a.timestamp || "") || Number(a && a.id) || 0;
      var tb = Date.parse(b && b.timestamp || "") || Number(b && b.id) || 0;
      if (ta !== tb) return ta - tb;
      return (Number(a && a.id) || 0) - (Number(b && b.id) || 0);
    });
  }

  function beeSidKeyCandidates() {
    return ["posts_/b/BeeSid", "posts_/b/beesid", "posts_/b/BEESID", "posts_/b/Beesid"];
  }

  /** Prefer the BeeSid LS key that currently holds the most posts. */
  function preferBeeSidKey() {
    return preferBoardKey("BeeSid");
  }

  function readBeeSidPosts() {
    return readPosts(preferBeeSidKey());
  }

  function readCurrentBoardPosts() {
    var key = currentBoardKey();
    var name = boardLabel(key);
    var preferred = preferBoardKey(name);
    var posts = readPosts(preferred);
    if (posts.length) return { key: preferred, name: boardLabel(preferred), posts: posts };
    posts = readPosts(key);
    return { key: key, name: name, posts: posts };
  }

  function boardVersionHint(posts, boardName) {
    boardName = String(boardName || "BeeSid");
    try {
      var raw = localStorage.getItem("boardmeta_/b/" + boardName);
      if (!raw && isBeeSidName(boardName)) raw = localStorage.getItem("boardmeta_/b/BeeSid");
      if (raw) {
        var meta = JSON.parse(raw);
        if (meta && meta.version != null && isFinite(Number(meta.version))) {
          return Number(meta.version);
        }
      }
    } catch (e) {}
    if (isBeeSidName(boardName)) {
      try {
        var flag = localStorage.getItem("cb_beesid_miiverse_v5");
        if (flag === "1") return 5;
      } catch (e2) {}
      return Math.max(1, (posts || []).length ? 5 : 1);
    }
    return Math.max(1, (posts || []).length ? 1 : 1);
  }

  function buildChipperFeedFromPosts(posts, boardVersion) {
    var chrono = chronoSortPosts(posts);
    var out = [];
    for (var i = 0; i < chrono.length; i++) {
      var p = chrono[i];
      var n = i + 1;
      var yc = yeahCount(p);
      var author = p.username || p.displayName || "unknown";
      var handle = String(p.handle || author).replace(/^@/, "").toLowerCase();
      var display = p.displayName || author;
      var cgId = "cg-" + (n < 10 ? "0" + n : String(n));
      out.push({
        id: cgId,
        author: author,
        display_name: display,
        handle: handle,
        username: handle,
        avatar_url: absMediaUrl(p.avatar_url || ""),
        feeling: p.feeling || "happy",
        body: p.text != null ? String(p.text) : String(p.body || ""),
        media: mediaListForFeed(p),
        likes: yc,
        yeahs: yc,
        views: viewCount(p),
        url: SITE_ORIGIN + "/b/BeeSid/post/" + n + "/comments/",
        sensitive: !!p.sensitive,
        contentWarnings: Array.isArray(p.contentWarnings) ? p.contentWarnings : [],
        boardPostId: String(p.id || ""),
        timestamp: p.timestamp
      });
    }
    out.reverse();
    var ver = boardVersion != null ? Number(boardVersion) : boardVersionHint(posts, "BeeSid");
    if (!isFinite(ver)) ver = 1;
    return {
      board: "chipper-game-board",
      version: ver,
      meta: {
        source: "derived-from-boards/BeeSid.json",
        derivedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
        boardVersion: ver,
        note: "yeahs/likes = len(board.yeahs); views = board.views. Do not hardcode.",
        mirror: true
      },
      sensitivity: {
        webDefault: "show",
        chipperDefault: "hide",
        adultHiddenByDefault: true,
        pornHardBlocked: true,
        note: "Illegal/porn media hard-blocked sitewide. 18+ hidden by default. Sensitive speech: web SHOW, Chipper HIDE. Seed posts are funny/clean only."
      },
      posts: out
    };
  }

  function buildBoardDoc(boardName, posts, boardVersion) {
    boardName = String(boardName || "BeeSid");
    var ver = boardVersion != null ? Number(boardVersion) : boardVersionHint(posts, boardName);
    if (!isFinite(ver)) ver = 1;
    var bee = isBeeSidName(boardName);
    return {
      board: bee ? "BeeSid" : boardName,
      version: ver,
      meta: {
        source: "mod-panel-publish",
        note: bee
          ? "Chipper Game Board posts. Feed yeahs/likes/views are derived from this file."
          : ("Community board " + boardName + " published from mod panel."),
        gameBoard: bee,
        gameBoardLabel: bee ? "Chipper Game Board" : undefined
      },
      posts: chronoSortPosts(posts).map(function (p) {
        var media = p.media || null;
        if (media && media.url) {
          media = { url: absMediaUrl(media.url), type: media.type || "image" };
        } else if (!media && (p.mediaUrl || p.image)) {
          media = { url: absMediaUrl(p.mediaUrl || p.image), type: "image" };
        }
        return {
          id: String(p.id),
          username: p.username,
          displayName: p.displayName || p.username,
          userId: p.userId != null ? String(p.userId) : "",
          text: p.text != null ? p.text : (p.body || ""),
          body: p.body != null ? p.body : (p.text || ""),
          media: media,
          timestamp: p.timestamp,
          yeahs: Array.isArray(p.yeahs) ? p.yeahs.map(String) : [],
          replies: Array.isArray(p.replies) ? p.replies : [],
          views: viewCount(p),
          avatar_url: absMediaUrl(p.avatar_url || ""),
          handle: p.handle || "",
          feeling: p.feeling || "happy",
          tags: p.tags || [],
          pinned: !!p.pinned,
          isGameBoardNote: !!p.isGameBoardNote,
          boardNote: !!p.boardNote
        };
      })
    };
  }

  function rebuildChipperFeedMirror(optMsg) {
    var posts = readBeeSidPosts();
    if (!posts.length) return null;
    var feed = buildChipperFeedFromPosts(posts);
    try {
      localStorage.setItem(CHIPPER_MIRROR_KEY, JSON.stringify(feed));
      localStorage.setItem(CHIPPER_BOARD_MIRROR_KEY, JSON.stringify(buildBoardDoc("BeeSid", posts, feed.meta.boardVersion)));
    } catch (e) {}
    /* Auto-push live Firestore chipper/feed — no Publish / unlock required. */
    if (window.CoolbradorChipperFeed) {
      try {
        if (typeof window.CoolbradorChipperFeed.mirrorFromBoard === "function") {
          window.CoolbradorChipperFeed.mirrorFromBoard({ immediate: false });
        } else if (typeof window.CoolbradorChipperFeed.schedulePush === "function") {
          window.CoolbradorChipperFeed.schedulePush();
        }
      } catch (e2) {}
    }
    if (optMsg) toast(optMsg, true);
    return feed;
  }

  function downloadJsonFile(filename, obj) {
    var text = JSON.stringify(obj, null, 2) + "\n";
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      try { URL.revokeObjectURL(url); } catch (e) {}
      try { a.remove(); } catch (e2) {}
    }, 1500);
  }

  function ensureBeeSidHydratedThen(cb) {
    ensureBoardHydratedThen("BeeSid", preferBeeSidKey(), cb);
  }

  /** Hydrate the named board from LS, static JSON, or community seed (never ignores selection). */
  function ensureBoardHydratedThen(boardName, boardKey, cb) {
    boardName = String(boardName || "").trim() || "BeeSid";
    boardKey = boardKey || preferBoardKey(boardName);
    var posts = readPosts(boardKey);
    if (!posts.length) posts = readPosts(preferBoardKey(boardName));
    if (posts.length) {
      cb(null, posts, preferBoardKey(boardName), boardName);
      return;
    }
    hydrateBoardFromJson(boardName, true).then(function (res) {
      var key = (res && res.key) || preferBoardKey(boardName);
      var list = readPosts(key);
      if (list.length) {
        cb(null, list, key, boardName);
        return;
      }
      var seeded = seedCommunityBoardIfEmpty(boardName);
      key = (seeded && seeded.key) || preferBoardKey(boardName);
      list = readPosts(key);
      if (list.length) cb(null, list, key, boardName);
      else cb(new Error("No posts for board " + boardName));
    }).catch(function () {
      var seeded = seedCommunityBoardIfEmpty(boardName);
      var key = (seeded && seeded.key) || preferBoardKey(boardName);
      var list = readPosts(key);
      if (list.length) cb(null, list, key, boardName);
      else cb(new Error("Could not load board " + boardName));
    });
  }

  function getModPublishPin() {
    try {
      var custom = localStorage.getItem("cb_mod_pin");
      if (custom) return String(custom);
    } catch (e) {}
    return "coolbrador";
  }

  var CHIPPER_FS_DOC =
    "https://firestore.googleapis.com/v1/projects/coolbrador/databases/(default)/documents/chipper/feed";
  var CHIPPER_FS_KEY = "AIzaSyDcxFPQU10CvAR8aEas54DEo7foxynsaeM";

  function firestorePatchOrCreate(docId, body) {
    var base = "https://firestore.googleapis.com/v1/projects/coolbrador/databases/(default)/documents/chipper";
    var fieldPaths = Object.keys(body.fields || {});
    var mask = fieldPaths.map(function (f) {
      return "&updateMask.fieldPaths=" + encodeURIComponent(f);
    }).join("");
    var url = base + "/" + encodeURIComponent(docId) + "?key=" + encodeURIComponent(CHIPPER_FS_KEY) + mask;
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    }).then(function (r) {
      if (r.ok) return r.json();
      if (r.status === 404) {
        var createUrl = base + "?documentId=" + encodeURIComponent(docId) + "&key=" + encodeURIComponent(CHIPPER_FS_KEY);
        return fetch(createUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store"
        }).then(function (r2) {
          if (!r2.ok) throw new Error("HTTP " + r2.status);
          return r2.json();
        });
      }
      return r.text().then(function (txt) {
        throw new Error("HTTP " + r.status + " " + String(txt || "").slice(0, 160));
      });
    });
  }

  function publishChipperFeedPack() {
    if (!isUnlocked()) {
      toast("Unlock the mod panel first.", false);
      return;
    }
    var selected = readCurrentBoardPosts();
    var boardName = selected.name || currentBoardName();
    var boardKey = selected.key || currentBoardKey();
    toast("Publishing " + boardName + " from current localStorage state...", true);
    ensureBoardHydratedThen(boardName, boardKey, function (err, posts, usedKey, usedName) {
      if (err) {
        toast("Could not load " + boardName + ": " + (err && err.message ? err.message : err), false);
        return;
      }
      posts = posts || [];
      boardName = usedName || boardName;
      boardKey = usedKey || boardKey;
      if (!posts.length) {
        toast("No posts on " + boardName + " to publish.", false);
        return;
      }
      /* Always re-read from the preferred LS key so Save edits win over stale JSON. */
      var live = readPosts(preferBoardKey(boardName));
      if (live.length) posts = live;

      var bee = isBeeSidName(boardName);
      var boardDoc = buildBoardDoc(boardName, posts);
      var feed = null;
      if (bee) {
        feed = buildChipperFeedFromPosts(posts, boardDoc.version);
        feed.meta = Object.assign({}, feed.meta || {}, {
          publishedAt: new Date().toISOString(),
          source: "mod-panel-firestore",
          replaced: true,
          boardKey: preferBoardKey(boardName)
        });
        try {
          localStorage.setItem(CHIPPER_MIRROR_KEY, JSON.stringify(feed));
          localStorage.setItem(CHIPPER_BOARD_MIRROR_KEY, JSON.stringify(boardDoc));
        } catch (e) {}
      } else {
        try {
          localStorage.setItem("cb_boards_" + boardName + "_mirror", JSON.stringify(boardDoc));
        } catch (e3) {}
      }

      var body;
      var docId;
      if (bee) {
        docId = "feed";
        body = {
          fields: {
            payload: { stringValue: JSON.stringify(feed) },
            board: { stringValue: JSON.stringify(boardDoc) },
            updatedAt: { timestampValue: new Date().toISOString() },
            postCount: { integerValue: String(posts.length) },
            pinGate: { stringValue: getModPublishPin() },
            boardName: { stringValue: "BeeSid" }
          }
        };
      } else {
        docId = "board_" + boardName;
        body = {
          fields: {
            board: { stringValue: JSON.stringify(boardDoc) },
            payload: { stringValue: JSON.stringify(boardDoc) },
            updatedAt: { timestampValue: new Date().toISOString() },
            postCount: { integerValue: String(posts.length) },
            pinGate: { stringValue: getModPublishPin() },
            boardName: { stringValue: boardName }
          }
        };
      }

      firestorePatchOrCreate(docId, body).then(function () {
        if (bee) {
          toast("Published " + posts.length + " BeeSid posts to Chipper feed (chipper/feed). Live feed replaced.", true);
        } else {
          toast("Published " + posts.length + " posts for " + boardName + " (chipper/" + docId + ").", true);
        }
        fillBoards();
        renderPosts();
      }).catch(function (e2) {
        toast("Publish failed: " + (e2 && e2.message ? e2.message : e2), false);
      });
    });
  }


  function normalizeBoardPosts(posts) {
    if (!Array.isArray(posts)) return [];
    return posts.map(function (p) {
      if (!p || typeof p !== "object") return p;
      var media = normalizeMedia(p.media != null ? p.media : (p.mediaUrl || p.image || null));
      return {
        id: p.id,
        username: p.username,
        displayName: p.displayName || p.username,
        userId: p.userId != null ? String(p.userId) : (p.authorId != null ? String(p.authorId) : ""),
        authorId: p.authorId != null ? String(p.authorId) : undefined,
        text: p.text != null ? p.text : (p.body || ""),
        body: p.body != null ? p.body : (p.text || ""),
        media: media,
        mediaUrl: media && media.url ? media.url : (p.mediaUrl || null),
        image: media && media.type === "image" ? media.url : (p.image || null),
        timestamp: p.timestamp,
        yeahs: Array.isArray(p.yeahs) ? p.yeahs : [],
        replies: Array.isArray(p.replies) ? p.replies : [],
        views: Number(p.views) || 0,
        avatar_url: p.avatar_url || "",
        handle: p.handle || "",
        feeling: p.feeling || "happy",
        tags: p.tags || [],
        pinned: !!p.pinned,
        isGameBoardNote: !!p.isGameBoardNote,
        boardNote: !!p.boardNote
      };
    });
  }

  function hydrateBoardFromJson(boardName, force) {
    boardName = String(boardName || "").trim();
    if (!boardName) return Promise.resolve({ ok: false, reason: "no board" });
    var key = preferBoardKey(boardName);
    if (!force) {
      var existing = readPosts(key);
      if (existing.length) {
        return Promise.resolve({ ok: true, skipped: true, key: key, count: existing.length });
      }
    }
    key = "posts_/b/" + boardName;
    var url = "/data/boards/" + boardName + ".json";
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.json();
    }).then(function (data) {
      var raw = data && Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : []);
      var normalized = normalizeBoardPosts(raw);
      if (!normalized.length) throw new Error("No posts in " + url);
      if (!writePosts(key, normalized)) throw new Error("Could not write " + key);
      try {
        if (boardName === "BeeSid") {
          localStorage.setItem("cb_beesid_miiverse_v5", "1");
          localStorage.setItem("boardmeta_/b/BeeSid", JSON.stringify({
            name: "BeeSid",
            desc: "Chipper Game Board",
            icon: "/b/BeeSid/icon.png",
            gameBoard: true
          }));
        }
      } catch (e) {}
      return { ok: true, key: key, count: normalized.length, forced: !!force };
    });
  }

  function autoHydrateKnownBoards() {
    var chain = Promise.resolve();
    HYDRATE_BOARDS.forEach(function (name) {
      chain = chain.then(function () {
        return hydrateBoardFromJson(name, false).catch(function () { return null; });
      });
    });
    chain = chain.then(function () {
      ensureCommunityBoardsSeeded();
      return null;
    });
    return chain;
  }

  /** When the picker changes to an empty board, hydrate JSON or seed community posts. */
  function ensureSelectedBoardLoaded() {
    var sel = el("modBoardSelect");
    if (!sel || !sel.value) return Promise.resolve(null);
    var key = sel.value;
    var name = boardLabel(key);
    var hydrateInput = el("modHydrateBoard");
    if (hydrateInput) hydrateInput.value = name;
    if (readPosts(preferBoardKey(name)).length) return Promise.resolve({ ok: true, skipped: true });
    return hydrateBoardFromJson(name, false).then(function (res) {
      if (res && res.count) return res;
      return seedCommunityBoardIfEmpty(name);
    }).catch(function () {
      return seedCommunityBoardIfEmpty(name);
    }).then(function (res) {
      fillBoards();
      if (sel && res && res.key) sel.value = res.key;
      else if (sel) {
        var pref = preferBoardKey(name);
        if ([].some.call(sel.options, function (o) { return o.value === pref; })) sel.value = pref;
      }
      return res;
    });
  }

  function listUserIds() {
    var ids = {};
    var userRe = /^user_/;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      if (userRe.test(k)) ids[k.slice(5)] = true;
      if (k.indexOf("pfp_") === 0) ids[k.slice(4)] = true;
      if (k.indexOf("profile_") === 0) ids[k.slice(8)] = true;
    }
    DEMO_USERS.forEach(function (d) { ids[d.id] = true; });
    ids["chipper"] = true;
    listBoardKeys().forEach(function (key) {
      readPosts(key).forEach(function (p) {
        if (!p) return;
        if (p.userId != null) ids[String(p.userId)] = true;
        if (p.authorId != null) ids[String(p.authorId)] = true;
        var name = String(p.username || p.displayName || "").trim();
        if (name) {
          var demo = DEMO_BY_NAME[name.toLowerCase()];
          if (demo) ids[demo.id] = true;
          else {
            var rec = p.userId != null ? readUser(String(p.userId)) : {};
            var recName = String(rec.displayName || rec.username || "").toLowerCase();
            if (!recName || recName !== name.toLowerCase()) {
              ids["demo:" + name.replace(/\s+/g, "")] = true;
            }
          }
        }
        (p.replies || []).forEach(function (r) {
          if (!r) return;
          if (r.userId != null) ids[String(r.userId)] = true;
          if (r.authorId != null) ids[String(r.authorId)] = true;
        });
      });
    });
    return Object.keys(ids).filter(Boolean).sort(function (a, b) {
      var na = Number(a), nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na) && isNaN(nb)) return -1;
      if (isNaN(na) && !isNaN(nb)) return 1;
      return String(a).localeCompare(String(b));
    });
  }

  function nodeMatchesUser(node, id, nameHints) {
    if (!node) return false;
    id = String(id);
    if (String(node.userId) === id || String(node.authorId) === id) return true;
    if (id === "24" && (String(node.userId) === "chipper" || String(node.authorId) === "chipper")) return true;
    if (id === "chipper" && (String(node.userId) === "24" || String(node.authorId) === "24")) return true;
    var hints = nameHints || [];
    var uname = String(node.username || node.displayName || "").toLowerCase();
    for (var i = 0; i < hints.length; i++) {
      if (hints[i] && uname === String(hints[i]).toLowerCase()) return true;
    }
    return false;
  }

  function nameHintsForId(id) {
    id = String(id);
    var hints = [];
    var demo = DEMO_BY_ID[id];
    if (demo) {
      hints.push(demo.displayName, demo.handle);
    }
    var u = readUser(id);
    if (u.displayName) hints.push(u.displayName);
    if (u.username) hints.push(u.username);
    if (u.handle) hints.push(u.handle);
    if (id.indexOf("demo:") === 0) hints.push(id.slice(5));
    return hints;
  }

  function propagateUser(id, patch) {
    id = String(id);
    var hints = nameHintsForId(id);
    if (patch.displayName) hints.push(patch.displayName);
    if (patch.handle) hints.push(patch.handle);
    listBoardKeys().forEach(function (key) {
      var posts = readPosts(key);
      var changed = false;
      function touch(node) {
        if (!nodeMatchesUser(node, id, hints)) return;
        if (patch.displayName != null) {
          node.username = patch.displayName;
          node.displayName = patch.displayName;
        }
        if (patch.handle != null) node.handle = patch.handle;
        if (patch.avatar != null) {
          node.avatar = patch.avatar;
          node.pfp = patch.avatar;
          node.avatar_url = patch.avatar;
        }
        /* Point colliding BeeSid personas at their dedicated demo id when saving extras. */
        if (DEMO_BY_ID[id] && Number(id) >= 24 && Number(id) <= 28) {
          node.userId = id;
        }
        if (id === "24") node.userId = "chipper";
        changed = true;
      }
      posts.forEach(function (p) {
        touch(p);
        (p.replies || []).forEach(touch);
      });
      if (changed) writePosts(key, posts);
    });

    try {
      var prof = readProfile(id) || { id: id };
      if (patch.displayName != null) {
        prof.displayName = patch.displayName;
        prof.username = patch.displayName;
      }
      if (patch.handle != null) prof.handle = patch.handle;
      if (patch.avatar != null) {
        prof.avatar = patch.avatar;
        prof.pfp = patch.avatar;
      }
      safeSet("profile_" + id, JSON.stringify(prof));
    } catch (e) {}
  }

  function saveUserEdits(id, fields) {
    id = String(id);
    var u = readUser(id);
    if (fields.displayName != null) {
      u.displayName = fields.displayName;
      u.username = fields.displayName;
    }
    if (fields.handle != null) {
      u.handle = String(fields.handle).replace(/^@/, "");
    }
    if (fields.avatar != null && fields.avatar !== "") {
      u.avatar = fields.avatar;
      u.pfp = fields.avatar;
      u.profilePicture = fields.avatar;
      if (!safeSet("pfp_" + id, fields.avatar)) return false;
    }
    u.demo = u.demo != null ? u.demo : !!DEMO_BY_ID[id];
    if (!safeSet("user_" + id, JSON.stringify(u))) return false;
    propagateUser(id, {
      displayName: u.displayName || u.username,
      handle: u.handle,
      avatar: getPfp(id)
    });
    try { window.dispatchEvent(new Event("cb-auth-changed")); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent("cb-auth-changed", {
        detail: { signedIn: !!currentUid(), userId: currentUid(), mod: true }
      }));
    } catch (e2) {}
    return true;
  }

  function normalizeMedia(raw) {
    if (raw == null || raw === "") return null;
    if (typeof raw === "string") {
      var url = raw.trim();
      if (!url) return null;
      var isVid = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /\/video\//i.test(url);
      return { type: isVid ? "video" : "image", url: url };
    }
    if (Array.isArray(raw)) {
      if (!raw.length) return null;
      return normalizeMedia(raw[0]);
    }
    if (typeof raw === "object") {
      var u2 = raw.url || raw.src || raw.href || "";
      if (!u2) return null;
      var t = String(raw.type || "").toLowerCase();
      if (t.indexOf("video") !== -1) t = "video";
      else if (t.indexOf("image") !== -1 || t.indexOf("img") !== -1) t = "image";
      else t = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u2) ? "video" : "image";
      return { type: t, url: String(u2) };
    }
    return null;
  }

  function getPostMedia(p) {
    if (!p) return null;
    return normalizeMedia(p.media != null ? p.media : (p.mediaUrl || p.image || null));
  }

  function findPostIndex(posts, postId, fallbackIndex) {
    var idStr = String(postId);
    var i;
    for (i = 0; i < posts.length; i++) {
      if (!posts[i]) continue;
      if (String(posts[i].id) === idStr) return i;
    }
    var n = Number(postId);
    if (!isNaN(n)) {
      for (i = 0; i < posts.length; i++) {
        if (!posts[i]) continue;
        if (Number(posts[i].id) === n) return i;
      }
    }
    var fi = Number(fallbackIndex);
    if (!isNaN(fi) && fi >= 0 && fi < posts.length) return fi;
    return -1;
  }

  function savePost(boardKey, postId, fields, fallbackIndex) {
    var posts = readPosts(boardKey);
    var idx = findPostIndex(posts, postId, fallbackIndex);
    if (idx < 0) {
      /* Board key empty / wrong: try sibling casing keys. */
      var label = boardLabel(boardKey);
      var alts = ["posts_/b/" + label, "posts_/b/" + label.toLowerCase(), "posts_/b/" + label.replace(/^./, function (c) { return c.toUpperCase(); })];
      for (var a = 0; a < alts.length; a++) {
        if (alts[a] === boardKey) continue;
        var altPosts = readPosts(alts[a]);
        var altIdx = findPostIndex(altPosts, postId, fallbackIndex);
        if (altIdx >= 0) {
          boardKey = alts[a];
          posts = altPosts;
          idx = altIdx;
          break;
        }
      }
    }
    if (idx < 0) return { ok: false, reason: "not-found" };
    var p = posts[idx];
    if (fields.text != null) {
      p.text = fields.text;
      p.body = fields.text;
    }
    if (fields.clearMedia) {
      p.media = null;
      p.mediaUrl = null;
      p.image = null;
    } else if (fields.media !== undefined) {
      var media = normalizeMedia(fields.media);
      p.media = media;
      p.mediaUrl = media ? media.url : null;
      p.image = media && media.type === "image" ? media.url : null;
    }
    if (!writePosts(boardKey, posts)) return { ok: false, reason: "quota" };
    return { ok: true, key: boardKey, id: p.id };
  }

  function deletePost(boardKey, postId, fallbackIndex) {
    var posts = readPosts(boardKey);
    var idx = findPostIndex(posts, postId, fallbackIndex);
    if (idx < 0) return false;
    posts.splice(idx, 1);
    return writePosts(boardKey, posts);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, "&#39;"); }

  function fileToDataUrl(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(null, reader.result); };
    reader.onerror = function () { cb(new Error("read failed")); };
    reader.readAsDataURL(file);
  }

  function showUnlock() {
    el("modGate").hidden = false;
    el("modApp").hidden = true;
  }

  function showApp() {
    el("modGate").hidden = true;
    el("modApp").hidden = false;
    ensureDemoUsers();
    autoHydrateKnownBoards().then(function () {
      ensureDemoUsers();
      harvestAuthorsFromPosts();
      fillBoards();
      renderUsers();
      renderPosts();
    }).catch(function () {
      ensureDemoUsers();
      harvestAuthorsFromPosts();
      fillBoards();
      renderUsers();
      renderPosts();
    });
  }

  function fillBoards() {
    var sel = el("modBoardSelect");
    if (!sel) return;
    var keys = listBoardKeys();
    var cur = sel.value;
    sel.innerHTML = keys.map(function (k) {
      return '<option value="' + escapeAttr(k) + '">' + escapeHtml(boardLabel(k)) +
        " (" + readPosts(k).length + ")</option>";
    }).join("");
    if (cur && keys.indexOf(cur) !== -1) sel.value = cur;
    else {
      var preferred = preferBeeSidKey();
      if (keys.indexOf(preferred) !== -1 && readPosts(preferred).length) sel.value = preferred;
      else {
        var withPosts = keys.filter(function (k) { return readPosts(k).length > 0; })[0];
        if (withPosts) sel.value = withPosts;
        else if (keys.indexOf(preferred) !== -1) sel.value = preferred;
      }
    }
    var hydrateInput = el("modHydrateBoard");
    if (hydrateInput && sel.value) hydrateInput.value = boardLabel(sel.value);
  }

  function renderUsers() {
    var host = el("modUsersList");
    if (!host) return;
    ensureDemoUsers();
    harvestAuthorsFromPosts();
    var ids = listUserIds();
    if (!ids.length) {
      host.innerHTML = '<p class="mod-empty">No users in localStorage yet. Fake demo Labradors should appear after Refresh.</p>';
      return;
    }
    host.innerHTML = ids.map(function (id) {
      var u = readUser(id);
      var p = readProfile(id) || {};
      var demo = DEMO_BY_ID[id];
      var name = u.displayName || u.username || p.displayName || (demo && demo.displayName) || ("User " + id);
      var handle = String(u.handle || p.handle || (demo && demo.handle) || "").replace(/^@/, "");
      var pfp = getPfp(id);
      var urlVal = pfp.indexOf("data:") === 0 ? "" : pfp;
      var badge = demo || u.demo || String(id).indexOf("demo:") === 0
        ? '<span class="mod-badge">demo</span>'
        : "";
      return (
        '<article class="mod-card" data-user-id="' + escapeHtml(id) + '">' +
          '<div class="mod-card-head">' +
            '<img class="mod-pfp" src="' + escapeHtml(pfp) + '" alt="">' +
            "<div><strong>" + escapeHtml(name) + "</strong> " + badge +
            '<div class="mod-muted">id ' + escapeHtml(id) +
            (handle ? (" | @" + escapeHtml(handle)) : "") + "</div></div>" +
          "</div>" +
          '<label>Display name<input data-field="displayName" value="' + escapeAttr(name) + '"></label>' +
          '<label>Username / handle<input data-field="handle" value="' + escapeAttr(handle) + '"></label>' +
          '<label>Profile picture URL<input data-field="avatar" value="' + escapeAttr(urlVal) + '" placeholder="https://... or upload"></label>' +
          '<label class="mod-file">Upload pfp<input type="file" accept="image/*" data-field="avatarFile"></label>' +
          '<div class="mod-actions"><button type="button" class="mod-btn" data-act="save-user">Save user</button></div>' +
        "</article>"
      );
    }).join("");
  }

  function mediaPreviewHtml(media) {
    if (!media || !media.url) {
      return '<div class="mod-media-preview mod-media-empty">No media</div>';
    }
    if (media.type === "video") {
      return '<div class="mod-media-preview"><video src="' + escapeAttr(media.url) + '" muted playsinline></video>' +
        '<div class="mod-muted">video</div></div>';
    }
    return '<div class="mod-media-preview"><img src="' + escapeAttr(media.url) + '" alt="">' +
      '<div class="mod-muted">image</div></div>';
  }

  function renderPosts() {
    var host = el("modPostsList");
    var sel = el("modBoardSelect");
    if (!host || !sel) return;
    var key = sel.value || listBoardKeys()[0];
    if (!key) {
      host.innerHTML = '<p class="mod-empty">No boards found. Pick a board name and click Load demo board (JSON) or Refresh to seed community boards.</p>';
      return;
    }
    var posts = readPosts(key);
    if (!posts.length) {
      host.innerHTML =
        '<p class="mod-empty">No posts on this board in localStorage yet. Click <strong>Load demo board</strong> (reads /data/boards/' +
        escapeHtml(boardLabel(key)) + '.json when available) or <strong>Refresh</strong> to seed community boards.</p>';
      return;
    }
    host.innerHTML = posts.map(function (p, idx) {
      var text = p.text != null ? p.text : (p.body || "");
      var trunc = String(text).length > 80 ? String(text).slice(0, 80) + "..." : text;
      var media = getPostMedia(p);
      var mediaUrl = media && media.url ? media.url : "";
      return (
        '<article class="mod-card" data-post-id="' + escapeAttr(String(p.id)) +
          '" data-board-key="' + escapeAttr(key) +
          '" data-post-index="' + idx + '">' +
          '<div class="mod-card-head">' +
            '<img class="mod-pfp" src="' + escapeHtml(getPfp(p.userId || p.authorId)) + '" alt="">' +
            "<div><strong>" + escapeHtml(p.username || p.displayName || "User") + "</strong>" +
            '<div class="mod-muted">#' + (idx + 1) + " | id " + escapeHtml(String(p.id)) +
            " | uid " + escapeHtml(String(p.userId || p.authorId || "")) +
            (trunc ? (" | " + escapeHtml(trunc)) : "") + "</div></div>" +
          "</div>" +
          '<label>Post text<textarea data-field="text" rows="4">' + escapeHtml(text) + "</textarea></label>" +
          mediaPreviewHtml(media) +
          '<label>Media URL<input data-field="mediaUrl" value="' + escapeAttr(mediaUrl) + '" placeholder="https://... image or video"></label>' +
          '<label class="mod-file">Upload media<input type="file" accept="image/*,video/*" data-field="mediaFile"></label>' +
          '<div class="mod-actions">' +
            '<button type="button" class="mod-btn" data-act="save-post">Save post</button>' +
            '<button type="button" class="mod-btn ghost" data-act="clear-media">Clear media</button>' +
            '<button type="button" class="mod-btn mod-btn-danger" data-act="del-post">Delete</button>' +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function refreshAll(msg) {
    ensureDemoUsers();
    harvestAuthorsFromPosts();
    fillBoards();
    renderUsers();
    renderPosts();
    if (msg) toast(msg, true);
  }

  function onClick(e) {
    var tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) {
      var tab = tabBtn.getAttribute("data-tab");
      document.querySelectorAll(".mod-tab").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-tab") === tab);
      });
      el("modUsersPane").hidden = tab !== "users";
      el("modPostsPane").hidden = tab !== "posts";
      return;
    }

    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var card = btn.closest(".mod-card");

    if (act === "unlock") {
      if (unlock((el("modPin") || {}).value || "")) {
        toast("Unlocked.", true);
        showApp();
      } else toast("Wrong PIN.", false);
      return;
    }

    if (act === "save-user" && card) {
      var id = card.getAttribute("data-user-id");
      var displayName = ((card.querySelector('[data-field="displayName"]') || {}).value || "").trim();
      var handle = ((card.querySelector('[data-field="handle"]') || {}).value || "").trim();
      var avatar = ((card.querySelector('[data-field="avatar"]') || {}).value || "").trim();
      var fileInput = card.querySelector('[data-field="avatarFile"]');
      function finish(url) {
        var ok = saveUserEdits(id, {
          displayName: displayName,
          handle: handle,
          avatar: url || avatar || getPfp(id)
        });
        if (ok) {
          rebuildChipperFeedMirror();
          toast("Saved user " + id + ".", true);
          renderUsers();
          renderPosts();
        }
      }
      if (fileInput && fileInput.files && fileInput.files[0]) {
        fileToDataUrl(fileInput.files[0], function (err, dataUrl) {
          if (err) { toast("Could not read image.", false); return; }
          finish(dataUrl);
        });
      } else finish(null);
      return;
    }

    if ((act === "save-post" || act === "clear-media") && card) {
      var key = card.getAttribute("data-board-key");
      var postId = card.getAttribute("data-post-id");
      var postIndex = card.getAttribute("data-post-index");
      var text = (card.querySelector('[data-field="text"]') || {}).value || "";
      var mediaUrl = ((card.querySelector('[data-field="mediaUrl"]') || {}).value || "").trim();
      var mediaFile = card.querySelector('[data-field="mediaFile"]');

      function doSave(mediaField, clear) {
        var result = savePost(key, postId, {
          text: text,
          media: clear ? undefined : mediaField,
          clearMedia: !!clear
        }, postIndex);
        if (result.ok) {
          if (isBeeSidName(boardLabel(result.key || key))) rebuildChipperFeedMirror();
          if (isBeeSidName(boardLabel(result.key || key))) {
            toast(clear ? "Media cleared. Chipper feed auto-updating..." : "Post saved. Chipper feed auto-updating...", true);
          } else {
            toast(clear ? "Media cleared and post saved." : "Post saved (text + media).", true);
          }
          fillBoards();
          renderPosts();
        } else if (result.reason === "quota") {
          /* toast already set */
        } else {
          toast("Post not found in " + key + " (id " + postId + "). Try Load demo board, then save again.", false);
        }
      }

      if (act === "clear-media") {
        doSave(null, true);
        return;
      }

      if (mediaFile && mediaFile.files && mediaFile.files[0]) {
        var f = mediaFile.files[0];
        fileToDataUrl(f, function (err, dataUrl) {
          if (err) { toast("Could not read media file.", false); return; }
          var type = f.type && f.type.indexOf("video") === 0 ? "video" : "image";
          doSave({ type: type, url: dataUrl }, false);
        });
      } else if (mediaUrl) {
        doSave(mediaUrl, false);
      } else {
        /* Text-only save: leave existing media untouched (use Clear media to remove). */
        doSave(undefined, false);
      }
      return;
    }

    if (act === "del-post" && card) {
      if (!confirm("Delete this post?")) return;
      if (deletePost(card.getAttribute("data-board-key"), card.getAttribute("data-post-id"), card.getAttribute("data-post-index"))) {
        if (isBeeSidName(boardLabel(card.getAttribute("data-board-key")))) rebuildChipperFeedMirror();
        toast("Post deleted.", true);
      } else {
        toast("Post not found.", false);
      }
      fillBoards();
      renderPosts();
      return;
    }

    if (act === "refresh") {
      autoHydrateKnownBoards().then(function () {
        refreshAll("Refreshed.");
      }).catch(function () {
        refreshAll("Refreshed.");
      });
      return;
    }

    if (act === "load-demo-board") {
      var name = ((el("modHydrateBoard") || {}).value || "BeeSid").trim() || "BeeSid";
      toast("Loading /data/boards/" + name + ".json ...", true);
      hydrateBoardFromJson(name, true).then(function (res) {
        ensureDemoUsers();
        harvestAuthorsFromPosts();
        fillBoards();
        var sel = el("modBoardSelect");
        if (sel && res.key) sel.value = res.key;
        renderUsers();
        renderPosts();
        if (isBeeSidName(name)) rebuildChipperFeedMirror();
        toast("Loaded " + res.count + " posts into " + res.key + ".", true);
      }).catch(function (err) {
        var seeded = seedCommunityBoardIfEmpty(name);
        if (seeded && seeded.ok && seeded.count) {
          ensureDemoUsers();
          harvestAuthorsFromPosts();
          fillBoards();
          var sel2 = el("modBoardSelect");
          if (sel2 && seeded.key) sel2.value = seeded.key;
          renderUsers();
          renderPosts();
          toast("No JSON for " + name + "; seeded " + seeded.count + " community posts into " + seeded.key + ".", true);
          return;
        }
        toast("Could not load board: " + (err && err.message ? err.message : err), false);
      });
      return;
    }

    if (act === "publish-chipper-feed") {
      publishChipperFeedPack();
      return;
    }

    if (act === "set-pin") {
      var next = prompt("New mod PIN (this device only):", expectedPin());
      if (next == null || !String(next).trim()) return;
      try { localStorage.setItem("cb_mod_pin", String(next).trim()); } catch (e) {}
      toast("PIN updated.", true);
      return;
    }

    if (act === "add-me-mod") {
      var uid = currentUid();
      if (!uid) { toast("Sign in first.", false); return; }
      var uids = [];
      try { uids = JSON.parse(localStorage.getItem("cb_mod_uids") || "[]"); } catch (e) { uids = []; }
      if (!Array.isArray(uids)) uids = [];
      if (uids.map(String).indexOf(uid) === -1) uids.push(uid);
      if (!safeSet("cb_mod_uids", JSON.stringify(uids))) return;
      toast("Added user " + uid + " as mod on this device.", true);
    }
  }

  function onChange(e) {
    if (e.target && e.target.id === "modBoardSelect") {
      ensureSelectedBoardLoaded().then(function () {
        renderPosts();
      }).catch(function () {
        renderPosts();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", onClick);
    document.body.addEventListener("change", onChange);
    if (isUnlocked()) showApp();
    else showUnlock();
  });
})();

