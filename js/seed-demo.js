(function () {
  var SEED_VERSION = "18";
  var verKey = "cb_seed_demo_v";
  var DEMO_ID_BASE = 2;
  var needReseed = localStorage.getItem(verKey) !== SEED_VERSION;

  /* Canonical demo roster (DEMO_ID_BASE=2): ids 0 and 1 reserved for real Labradors.
   * Stable ids: Cardbrador=2 ... SnackBandit=18 ... BarkBroker=23. Never reshuffle.
   */
  var AVATARS = {
    "2": "/shared/TestImages/ProfilePhotos/Cardbrador.png",
    "3": "/shared/TestImages/ProfilePhotos/BeeSid.png",
    "4": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "5": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "6": "/shared/TestImages/ProfilePhotos/AnthonySpade.png",
    "7": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "8": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "9": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png",
    "10": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "11": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "12": "/shared/TestImages/ProfilePhotos/EvilKid23.png",
    "13": "/shared/TestImages/ProfilePhotos/NoFilterBro.png",
    "14": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "15": "/shared/TestImages/ProfilePhotos/ANIMEGIRL.png",
    "16": "/shared/TestImages/ProfilePhotos/CoolDog.png",
    "17": "/shared/TestImages/ProfilePhotos/EvilRobot.jpg",
    "18": "/shared/TestImages/ProfilePhotos/GyattToad.png",
    "19": "/shared/TestImages/ProfilePhotos/OrangeTabby.png",
    "20": "/shared/TestImages/ProfilePhotos/Miguel.webp",
    "21": "/shared/TestImages/ProfilePhotos/Barcat.png",
    "22": "/shared/TestImages/ProfilePhotos/NerdDog.png",
    "23": "/shared/TestImages/ProfilePhotos/AbovegroundBro.png"
  };

  var MEDIA = {
    broke: { type: "image", url: "/shared/TestImages/Broke%20and%20Poor.jpg" },
    cannotPass: { type: "image", url: "/shared/TestImages/Cannot%20Pass.jpg" },
    catMassage: { type: "video", url: "/shared/TestImages/Cat%20Massage.mp4" },
    checkpoint: { type: "image", url: "/shared/TestImages/Checkpoint.jpg" },
    dance: { type: "video", url: "/shared/TestImages/Dancing.mp4" },
    eatSlop: { type: "image", url: "/shared/TestImages/Eat%20Slop.jpg" },
    electricity: { type: "image", url: "/shared/TestImages/Electricity.jpg" },
    fakeFriends: { type: "image", url: "/shared/TestImages/Fake%20Friends.gif" },
    farm: { type: "image", url: "/shared/TestImages/Farm.jpg" },
    grocery: { type: "image", url: "/shared/TestImages/Grocery.jpg" },
    groupChat: { type: "image", url: "/shared/TestImages/Group%20Chat%20Notification.jpg" },
    hospital: { type: "image", url: "/shared/TestImages/Hospital.jpg" },
    jimmy: { type: "image", url: "/shared/TestImages/Liltle%20Jimmy%20but%20Sonic.png" },
    medication: { type: "image", url: "/shared/TestImages/Medication.jpg" },
    playingOutside: { type: "image", url: "/shared/TestImages/Playing%20Outside.jpg" },
    propaganda: { type: "image", url: "/shared/TestImages/Propaganda.jpg" },
    store: { type: "image", url: "/shared/TestImages/Store.jpg" },
    uniqueAnimal: { type: "image", url: "/shared/TestImages/Unique%20Animal%20Breed.png" },
    what: { type: "video", url: "/shared/TestImages/What.mp4" },
    worldLeaders: { type: "image", url: "/shared/TestImages/World%20Leaders.jpg" }
  };

  if (needReseed) {
    try {
      var kill = [];
      for (var si = 0; si < localStorage.length; si++) {
        var sk = localStorage.key(si);
        if (sk && (sk.indexOf("posts_/b/") === 0 || sk.indexOf("boardmeta_/b/") === 0)) kill.push(sk);
      }
      kill.forEach(function (sk) { localStorage.removeItem(sk); });
      localStorage.removeItem("posts_/b/testboard");
      localStorage.removeItem("boardmeta_/b/testboard");
      localStorage.removeItem("posts_/b/General");
      localStorage.removeItem("boardmeta_/b/General");
      // Detach real session from demo ids BEFORE wiping demo roster (never leave Labrador on id 2).
      (function detachSessionFromDemoBand() {
        var sid = "";
        var loggedIn = false;
        var fb = "";
        try {
          sid = String(localStorage.getItem("currentUserId") || "");
          loggedIn = localStorage.getItem("loggedIn") === "true";
          fb = String(localStorage.getItem("firebaseUid") || "");
        } catch (e) {}
        // Seed must never clear or rewrite currentUserId / loggedIn / firebaseUid.
        if (!loggedIn || !sid || !/^\d+$/.test(sid)) return;
        var n = parseInt(sid, 10);
        if (n < DEMO_ID_BASE || n > DEMO_ID_BASE + 21) return;
        var u = {};
        var p = {};
        try { u = JSON.parse(localStorage.getItem("user_" + sid) || "{}"); } catch (e) {}
        try { p = JSON.parse(localStorage.getItem("profile_" + sid) || "null") || {}; } catch (e) {}
        var seedName = ({
          "2":"Cardbrador","3":"BeeSid","4":"Miguel","5":"GyattToad","6":"AnthonySpade",
          "7":"Barcat","8":"EvilRobot","9":"AbovegroundBro","10":"NerdDog","11":"OrangeTabby",
          "12":"EvilKid23","13":"NoFilterBro","14":"CoolDog","15":"ANIMEGIRL",
          "16":"PantsWetterLabrador","17":"RhombusRex","18":"SnackBandit","19":"BarTabby",
          "20":"PuddlePirate","21":"TreatTaxer","22":"SofaThief","23":"BarkBroker"
        })[sid];
        var looksDemo = u.demo === true || p.demo === true || (seedName && (u.displayName === seedName || u.username === seedName) && !u.uid && !u.firebaseUid && !fb);
        // If this slot is a pure demo and session somehow points here without firebase, still move off.
        // If firebase/session fields exist on a demo id, copy to free 0/1/24+.
        function slotTakenByReal(slot) {
          var id = String(slot);
          var ru = {};
          try { ru = JSON.parse(localStorage.getItem("user_" + id) || "{}"); } catch (e) {}
          if (!ru || !Object.keys(ru).length) return false;
          if (ru.demo === true) return false;
          return true;
        }
        var newId = "";
        for (var s = 0; s < DEMO_ID_BASE; s++) {
          if (!slotTakenByReal(s)) { newId = String(s); break; }
        }
        if (!newId) {
          var next = DEMO_ID_BASE + 22;
          while (slotTakenByReal(next)) next++;
          newId = String(next);
        }
        delete u.demo;
        delete p.demo;
        if (fb) { u.uid = u.uid || fb; u.firebaseUid = u.firebaseUid || fb; }
        if (!u.username && !u.displayName) { u.username = "Labrador"; u.displayName = "Labrador"; }
        p.id = newId;
        p.displayName = p.displayName || u.displayName || u.username || "Labrador";
        try {
          localStorage.setItem("user_" + newId, JSON.stringify(u));
          localStorage.setItem("profile_" + newId, JSON.stringify(p));
          var pfp = localStorage.getItem("pfp_" + sid);
          if (pfp) localStorage.setItem("pfp_" + newId, pfp);
          var fr = localStorage.getItem("friends_" + sid);
          if (fr) localStorage.setItem("friends_" + newId, fr);
          localStorage.setItem("currentUserId", newId);
        } catch (e) {}
      })();
      Object.keys(AVATARS).forEach(function (id) {
        // Never wipe reserved real slots 0/1 (AVATARS starts at 2, but guard anyway).
        if (id === "0" || id === "1") return;
        var sidNow = "";
        try { sidNow = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        if (sidNow && sidNow === id) return;
        localStorage.removeItem("user_" + id);
        localStorage.removeItem("profile_" + id);
        localStorage.removeItem("pfp_" + id);
        localStorage.removeItem("friends_" + id);
      });
      // Clear leftover low-band stubs only; NEVER touch user_0 / user_1 or session keys.
      (function clearLegacyDemoBand() {
        var sid = "";
        try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
        for (var li = DEMO_ID_BASE; li <= DEMO_ID_BASE + 21; li++) {
          var lid = String(li);
          if (sid && sid === lid) continue;
          // AVATARS rewrite covers these; skip if already handled
        }
        // Do not remove user_0 / user_1 under any seed repair.
      })();
      ["demo", "demo2", "demo3", "demo4", "demo5"].forEach(function (legacy) {
        localStorage.removeItem("user_" + legacy);
        localStorage.removeItem("profile_" + legacy);
        localStorage.removeItem("pfp_" + legacy);
      });
    } catch (e) {}
    localStorage.setItem(verKey, SEED_VERSION);
  }

  // Migrate legacy testboard posts into General when General is empty.
  try {
    var legacyTb = localStorage.getItem("posts_/b/testboard");
    if (legacyTb && !localStorage.getItem("posts_/b/General")) {
      localStorage.setItem("posts_/b/General", legacyTb);
    }
    var legacyMeta = localStorage.getItem("boardmeta_/b/testboard");
    if (legacyMeta && !localStorage.getItem("boardmeta_/b/General")) {
      var lm = JSON.parse(legacyMeta);
      lm.name = "General";
      lm.desc = lm.desc || "Default landing community. Most people post in their own boards; General is the shared front porch.";
      lm.test = true;
      localStorage.setItem("boardmeta_/b/General", JSON.stringify(lm));
    }
  } catch (e) {}

  var key = "posts_/b/General";
  if (!localStorage.getItem(key)) {
    var now = Date.now();
    localStorage.setItem(key, JSON.stringify([
      {
        id: now - 6000,
        username: "Cardbrador",
        userId: "2",
        text: "Welcome aboard. Pick a community when you post. General is the default landing board.",
        media: MEDIA.worldLeaders,
        timestamp: new Date(now - 6000).toISOString(),
        yeahs: ["3", "6"],
        replies: [],
        views: 42
      },
      {
        id: now - 5000,
        username: "BeeSid",
        userId: "3",
        text: "First post energy. Yeah this if the starry sky made you smile.",
        media: MEDIA.propaganda,
        timestamp: new Date(now - 5000).toISOString(),
        yeahs: ["2"],
        replies: [],
        views: 18,
        inGame: true
      },
      {
        id: now - 4000,
        username: "Miguel",
        userId: "4",
        text: "Receipts from the mutiny desk. Little Jimmy says hi.",
        media: MEDIA.jimmy,
        timestamp: new Date(now - 4000).toISOString(),
        yeahs: [ "5"],
        replies: [],
        views: 27
      },
      {
        id: now - 3000,
        username: "GyattToad",
        userId: "5",
        text: "Pitch: board stickers that jiggle. Prototype gif attached.",
        media: MEDIA.fakeFriends,
        timestamp: new Date(now - 3000).toISOString(),
        yeahs: ["3", "4", "6"],
        replies: [],
        views: 55
      },
      {
        id: now - 2000,
        username: "AnthonySpade",
        userId: "6",
        text: "Gift drive mood. Stockings full of rhombuses. Dance optional.",
        media: MEDIA.dance,
        timestamp: new Date(now - 2000).toISOString(),
        yeahs: ["2"],
        replies: [],
        views: 33
      },
      {
        id: now - 1500,
        username: "Barcat",
        userId: "7",
        text: "Farm report for the For You tab. Pure vibes.",
        media: MEDIA.farm,
        timestamp: new Date(now - 1500).toISOString(),
        yeahs: ["3"],
        replies: [],
        views: 14
      },
      {
        id: now - 1000,
        username: "EvilRobot",
        userId: "8",
        text: "In-game clip check. Cat massage energy incoming.",
        media: MEDIA.catMassage,
        timestamp: new Date(now - 1000).toISOString(),
        yeahs: [ "6"],
        replies: [],
        views: 21,
        inGame: true
      },
      {
        id: now - 500,
        username: "AbovegroundBro",
        userId: "9",
        text: "Another still from the feed stack.",
        media: MEDIA.grocery,
        timestamp: new Date(now - 500).toISOString(),
        yeahs: [],
        replies: [],
        views: 9
      },
      {
        id: now,
        username: "NerdDog",
        userId: "10",
        text: "Short loop for polish testing.",
        media: MEDIA.what,
        timestamp: new Date(now).toISOString(),
        yeahs: ["4"],
        replies: [],
        views: 6
      }
    ]));
  }
  if (!localStorage.getItem("boardmeta_/b/General")) {
    localStorage.setItem("boardmeta_/b/General", JSON.stringify({
      name: "General",
      desc: "Default landing community. Most people post in their own boards like Reddit; General is the shared front porch.",
      test: true
    }));
  }

  var beeKey = "posts_/b/BeeSid";
  if (!localStorage.getItem(beeKey) && !localStorage.getItem("posts_/b/beesid")) {
    var beeNow = Date.now();
    localStorage.setItem(beeKey, JSON.stringify([
      {
        id: beeNow - 2000,
        username: "BeeSid",
        userId: "3",
        text: "BeeSid board is live. Bring rhombuses.",
        media: MEDIA.propaganda,
        timestamp: new Date(beeNow - 2000).toISOString(),
        yeahs: [ "5"],
        replies: [],
        views: 12
      },
      {
        id: beeNow - 1000,
        username: "Cardbrador",
        userId: "2",
        text: "Official welcome to the BeeSid corner.",
        media: MEDIA.worldLeaders,
        timestamp: new Date(beeNow - 1000).toISOString(),
        yeahs: ["3"],
        replies: [],
        views: 8
      }
    ]));
  }
  if (!localStorage.getItem("boardmeta_/b/BeeSid") && !localStorage.getItem("boardmeta_/b/beesid")) {
    localStorage.setItem("boardmeta_/b/BeeSid", JSON.stringify({
      name: "BeeSid",
      desc: "BeeSid's board. Icons live in /b/BeeSid/icon.png.",
      test: true
    }));
  }


  var EXTRA_BOARDS = [
    { name: "Starry", desc: "Night-sky posts and vibe checks.", media: "/img/Starheld.png", text: "Starheld check. Who else is staring up?" },
    { name: "ChipperCorner", desc: "Planet Chipper chatter before launch.", media: "/img/PlanetChipperHomepage.png", text: "Chipper corner is open. Kicks and giggles only." },
    { name: "Labradoria", desc: "Sim talk for La Brador and the pack.", media: "/img/TheSeas.png", text: "La Brador map drop. Labradors welcome." },
    { name: "MutinyDesk", desc: "Receipts, charges, and plank energy.", media: "/shared/TestImages/Propaganda.jpg", text: "Mutiny desk is staffed. Bring receipts." },
    { name: "GiftDrive", desc: "Seasonal gifts, stockings, charity bits.", media: "/img/Tropical.png", text: "Gift drive thread. Stockings optional." },
    { name: "FarmReport", desc: "For You farm posts and chill updates.", media: "/shared/TestImages/Farm.jpg", text: "Farm report: vibes irrigated, chaos harvested." }
  ];
  EXTRA_BOARDS.forEach(function (board, idx) {
    var bkey = "posts_/b/" + board.name;
    var mkey = "boardmeta_/b/" + board.name;
    if (!localStorage.getItem(mkey)) {
      localStorage.setItem(mkey, JSON.stringify({ name: board.name, desc: board.desc, test: true }));
    }
    if (!localStorage.getItem(bkey)) {
      var t0 = Date.now() - (idx + 1) * 7000;
      localStorage.setItem(bkey, JSON.stringify([
        {
          id: t0,
          username: ["Cardbrador", "BeeSid", "Miguel", "GyattToad", "CoolDog", "NerdDog"][idx % 6],
          userId: String([1, 2, 3, 4, 13, 9][idx % 6]),
          text: board.text,
          media: { type: "image", url: board.media },
          timestamp: new Date(t0).toISOString(),
          yeahs: [ "3"].slice(0, (idx % 2) + 1),
          replies: [],
          views: 10 + idx * 3
        },
        {
          id: t0 - 1000,
          username: ["AnthonySpade", "Barcat", "ANIMEGIRL", "OrangeTabby", "AbovegroundBro", "NoFilterBro"][idx % 6],
          userId: String([5, 6, 14, 10, 8, 12][idx % 6]),
          text: "Testing " + board.name + " for the pack.",
          media: null,
          timestamp: new Date(t0 - 1000).toISOString(),
          yeahs: [],
          replies: [],
          views: 4 + idx
        }
      ]));
    }
  });

  // Funny General post from PantsWetterLabrador
  (function () {
    var gkey = "posts_/b/General";
    var pantsId = "pants-check-1";
    try {
      var glist = JSON.parse(localStorage.getItem(gkey) || "[]");
      if (!Array.isArray(glist)) glist = [];
      var exists = glist.some(function (p) {
        return p && (p.id === pantsId || (p.userId === "15" && /check your pants/i.test(p.text || "")));
      });
      if (!exists) {
        glist.unshift({
          id: pantsId,
          username: "PantsWetterLabrador",
          userId: "16",
          text: "Check your pants",
          media: null,
          timestamp: new Date().toISOString(),
          yeahs: ["5", "7", "18"],
          replies: [],
          views: 69
        });
        localStorage.setItem(gkey, JSON.stringify(glist));
      }
    } catch (e) {}
  })();

  // One-shot only (when SEED_VERSION bumps): move leftover low-band demos into 2-23.
  // Ids 0 and 1 stay free for real Labradors (DEMO_ID_BASE=2).
  if (needReseed) (function migrateDemoOffZero() {
    var sid = "";
    try { sid = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    var NAME_TO_ID = {
      Cardbrador: "2",
      BeeSid: "3",
      Miguel: "4",
      GyattToad: "5",
      AnthonySpade: "6",
      Barcat: "7",
      EvilRobot: "8",
      AbovegroundBro: "9",
      NerdDog: "10",
      OrangeTabby: "11",
      EvilKid23: "12",
      NoFilterBro: "13",
      CoolDog: "14",
      ANIMEGIRL: "15",
      PantsWetterLabrador: "16",
      RhombusRex: "17",
      SnackBandit: "18",
      BarTabby: "19",
      PuddlePirate: "20",
      TreatTaxer: "21",
      SofaThief: "22",
      BarkBroker: "23"
    };
    function looksDemo(u) {
      if (!u || typeof u !== "object") return false;
      if (u.demo === true) return true;
      var name = u.username || u.displayName || "";
      if (NAME_TO_ID[name] && !u.uid && !u.firebaseUid) return true;
      return false;
    }
    function moveKey(prefix, oldId, newId) {
      var raw = localStorage.getItem(prefix + oldId);
      if (!raw) return;
      if (!localStorage.getItem(prefix + newId)) {
        try {
          if (prefix === "user_" || prefix === "profile_") {
            var o = JSON.parse(raw);
            o.demo = true;
            if (prefix === "profile_") o.id = newId;
            localStorage.setItem(prefix + newId, JSON.stringify(o));
          } else {
            localStorage.setItem(prefix + newId, raw);
          }
        } catch (e) {
          localStorage.setItem(prefix + newId, raw);
        }
      }
      localStorage.removeItem(prefix + oldId);
    }
    for (var i = 0; i <= 21; i++) {
      var oldId = String(i);
      var newId = String(DEMO_ID_BASE + i);
      // Never migrate or clear reserved real slots 0/1 into the demo band.
      if (oldId === "0" || oldId === "1") continue;
      if (sid && sid === oldId) continue;
      var rawU = localStorage.getItem("user_" + oldId);
      if (!rawU) {
        var rawP = localStorage.getItem("profile_" + oldId);
        if (rawP) {
          try {
            var p = JSON.parse(rawP);
            var pname = (p && (p.displayName || p.handle)) || "";
            var dest = (p && NAME_TO_ID[p.displayName]) || newId;
            if (p && (p.demo === true || NAME_TO_ID[p.displayName || ""])) {
              moveKey("profile_", oldId, dest);
              moveKey("pfp_", oldId, dest);
              moveKey("friends_", oldId, dest);
            }
          } catch (e) {}
        }
        continue;
      }
      var u = {};
      try { u = JSON.parse(rawU); } catch (e) { continue; }
      if (!looksDemo(u)) continue;
      var destId = NAME_TO_ID[u.displayName || u.username || ""] || newId;
      moveKey("user_", oldId, destId);
      moveKey("profile_", oldId, destId);
      moveKey("pfp_", oldId, destId);
      moveKey("friends_", oldId, destId);
    }
  })();

  // Repair: force post/reply userIds to canonical roster ids by username, rewrite pfp/user/profile for 2-23.
  // Runs only on SEED_VERSION bump (with needReseed), so refresh does not reshuffle.
  if (needReseed) (function repairDemoRosterIds() {
    var NAME_TO_ID = {
      Cardbrador: "2",
      BeeSid: "3",
      Miguel: "4",
      GyattToad: "5",
      AnthonySpade: "6",
      Barcat: "7",
      EvilRobot: "8",
      AbovegroundBro: "9",
      NerdDog: "10",
      OrangeTabby: "11",
      EvilKid23: "12",
      NoFilterBro: "13",
      CoolDog: "14",
      ANIMEGIRL: "15",
      PantsWetterLabrador: "16",
      RhombusRex: "17",
      SnackBandit: "18",
      BarTabby: "19",
      PuddlePirate: "20",
      TreatTaxer: "21",
      SofaThief: "22",
      BarkBroker: "23"
    };
    function canonFromName(name) {
      var n = String(name || "").trim();
      return NAME_TO_ID[n] || "";
    }
    function walkFix(node) {
      if (!node) return false;
      var changed = false;
      var want = canonFromName(node.username || node.displayName || "");
      if (want && String(node.userId || "") !== want) {
        node.userId = want;
        changed = true;
      }
      if (Array.isArray(node.yeahs)) {
        // yeahs are ids; leave alone unless we only know names (ids repaired via posts)
      }
      if (Array.isArray(node.replies)) {
        node.replies.forEach(function (r) { if (walkFix(r)) changed = true; });
      }
      return changed;
    }
    try {
      for (var pi = 0; pi < localStorage.length; pi++) {
        var pk = localStorage.key(pi);
        if (!pk || pk.indexOf("posts_") !== 0) continue;
        var list = JSON.parse(localStorage.getItem(pk) || "[]");
        if (!Array.isArray(list)) continue;
        var changed = false;
        list.forEach(function (post) { if (walkFix(post)) changed = true; });
        if (changed) localStorage.setItem(pk, JSON.stringify(list));
      }
    } catch (e) {}
    // Rewrite pfp_/user_/profile_ for canonical 2-23 from seed roster (demos array applied below also fills gaps).
    var sidRepair = "";
    try { sidRepair = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    Object.keys(NAME_TO_ID).forEach(function (name) {
      var id = NAME_TO_ID[name];
      if (id === "0" || id === "1") return;
      if (sidRepair && sidRepair === id) return; // never clobber signed-in Labrador
      var avatar = AVATARS[id] || "/users/default/pfp.jpg";
      localStorage.setItem("pfp_" + id, avatar);
      try {
        var u = JSON.parse(localStorage.getItem("user_" + id) || "{}");
        u.username = name;
        u.displayName = name;
        u.profilePicture = avatar;
        u.demo = true;
        delete u.uid;
        delete u.firebaseUid;
        localStorage.setItem("user_" + id, JSON.stringify(u));
      } catch (e) {
        localStorage.setItem("user_" + id, JSON.stringify({
          username: name, displayName: name, profilePicture: avatar, demo: true
        }));
      }
      try {
        var p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {};
        p.id = id;
        p.displayName = name;
        p.avatar = avatar;
        p.demo = true;
        if (!p.handle) p.handle = String(name).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
        localStorage.setItem("profile_" + id, JSON.stringify(p));
      } catch (e) {}
    });
  })();

  var demos = [
    { id: "2", displayName: "Cardbrador", handle: "cardbrador", bio: "Welcome aboard.", about: "Official-ish demo pup." },
    { id: "3", displayName: "BeeSid", handle: "beesid", bio: "Rhombus enjoyer.", about: "Lives in the header glow." },
    { id: "4", displayName: "Miguel", handle: "miguel", bio: "Mutiny correspondent.", about: "Keeps receipts." },
    { id: "5", displayName: "GyattToad", handle: "gyatttoad", bio: "Pitch machine.", about: "Ideas tab forever." },
    { id: "6", displayName: "AnthonySpade", handle: "anthonyspade", bio: "Gift drive booster.", about: "Stockings full of rhombuses." },
    { id: "7", displayName: "Barcat", handle: "barcat", bio: "Lounge lookout.", about: "Always on the rail." },
    { id: "8", displayName: "EvilRobot", handle: "evilrobot", bio: "Beep boop menace.", about: "Mostly jokes." },
    { id: "9", displayName: "AbovegroundBro", handle: "abovegroundbro", bio: "Above-ground vibes.", about: "Test mesh enjoyer." },
    { id: "10", displayName: "NerdDog", handle: "nerddog", bio: "Specs and snacks.", about: "8x the polish." },
    { id: "11", displayName: "OrangeTabby", handle: "orangetabby", bio: "Triple leverage vibes.", about: "Charts and stars." },
    { id: "12", displayName: "EvilKid23", handle: "evilkids23", bio: "Spooky soft launch.", about: "Friendly haunt." },
    { id: "13", displayName: "NoFilterBro", handle: "nofilterbro", bio: "Raw feed only.", about: "What you see is what you get." },
    { id: "14", displayName: "CoolDog", handle: "cooldog", bio: "Cool by default.", about: "Name is the vibe." },
    { id: "15", displayName: "ANIMEGIRL", handle: "animegirl", bio: "Main character energy.", about: "Frame-perfect poses." },
    { id: "16", displayName: "PantsWetterLabrador", handle: "pantswetter", bio: "Hydration is a lifestyle.", about: "Check your pants." },
    { id: "17", displayName: "RhombusRex", handle: "rhombusrex", bio: "Angles only.", about: "Header glow fan." },
    { id: "18", displayName: "SnackBandit", handle: "snackbandit", bio: "Treat heist specialist.", about: "Will work for biscuits." },
    { id: "19", displayName: "BarTabby", handle: "bartabby", bio: "Bar shifts and soft paws.", about: "Speed is kindness." },
    { id: "20", displayName: "PuddlePirate", handle: "puddlepirate", bio: "Splash tax collector.", about: "Boots optional." },
    { id: "21", displayName: "TreatTaxer", handle: "treattaxer", bio: "IRS of snacks.", about: "Pay the biscuit." },
    { id: "22", displayName: "SofaThief", handle: "sofathief", bio: "Cushion conqueror.", about: "Your seat is my seat." },
    { id: "23", displayName: "BarkBroker", handle: "barkbroker", bio: "Market of woofs.", about: "Bullish on pets." }
  ];

  demos.forEach(function (d) {
    var avatar = AVATARS[d.id] || "/users/default/pfp.jpg";
    var sidNow = "";
    try { sidNow = String(localStorage.getItem("currentUserId") || ""); } catch (e) {}
    // Never overwrite the signed-in Labrador slot (and never touch 0/1 here).
    if (d.id === "0" || d.id === "1") return;
    if (sidNow && sidNow === d.id) return;
    // Force rewrite on SEED_VERSION bump so repair stubs get full roster fields.
    if (needReseed || !localStorage.getItem("user_" + d.id)) {
      localStorage.setItem("user_" + d.id, JSON.stringify({
        username: d.displayName,
        displayName: d.displayName,
        bio: d.bio,
        about: d.about,
        profilePicture: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true
      }));
    }
    if (needReseed || !localStorage.getItem("profile_" + d.id)) {
      localStorage.setItem("profile_" + d.id, JSON.stringify({
        id: d.id,
        displayName: d.displayName,
        handle: d.handle,
        bio: d.bio,
        about: d.about,
        avatar: avatar,
        joined: Date.now() - 86400000 * 40,
        demo: true,
        card: { width: 880, height: 520, background: "#0d001f" },
        sections: []
      }));
    }
    if (needReseed || !localStorage.getItem("pfp_" + d.id)) {
      localStorage.setItem("pfp_" + d.id, avatar);
    }
  });

  try {
    var map = { demo: "2", demo2: "3", demo3: "4", demo4: "5", demo5: "6" };
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || !k.startsWith("posts_")) continue;
      var list = JSON.parse(localStorage.getItem(k) || "[]");
      var changed = false;
      list.forEach(function (p) {
        if (map[p.userId]) { p.userId = map[p.userId]; changed = true; }
        if (Array.isArray(p.yeahs)) {
          p.yeahs = p.yeahs.map(function (y) { return map[y] || y; });
        }
      });
      if (changed) localStorage.setItem(k, JSON.stringify(list));
    }
  } catch (e) {}

  
  // Friend lists keyed by profile number: friends_<id>
  (function seedFriendLists() {
    var allIds = [];
    for (var i = 0; i <= 21; i++) allIds.push(String(DEMO_ID_BASE + i));
    function remapList(raw) {
      if (!Array.isArray(raw)) return null;
      var seen = {};
      var out = [];
      raw.forEach(function (id) {
        var s = String(id);
        if (/^\d+$/.test(s)) {
          var n = parseInt(s, 10);
          // Only lift true legacy ids below DEMO_ID_BASE (0 and 1 stay reserved / remapped once).
          if (n >= 0 && n < DEMO_ID_BASE) s = String(DEMO_ID_BASE + n);
        }
        if (!s || seen[s]) return;
        seen[s] = true;
        out.push(s);
      });
      return out;
    }
    allIds.forEach(function (pid) {
      var key = "friends_" + pid;
      var existing = null;
      try { existing = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { existing = null; }
      if (Array.isArray(existing) && existing.length) {
        var remapped = remapList(existing);
        if (remapped && remapped.join(",") !== existing.map(String).join(",")) {
          localStorage.setItem(key, JSON.stringify(remapped.filter(function (oid) { return oid !== pid; })));
        }
        return;
      }
      var list = allIds.filter(function (oid) { return oid !== pid; });
      localStorage.setItem(key, JSON.stringify(list));
    });
    // Also seed / repair the signed-in Labrador pack so Home/Pack never shows Lab 1..N
    try {
      var sid = String(localStorage.getItem("currentUserId") || "");
      if (sid && /^\d+$/.test(sid) && parseInt(sid, 10) < DEMO_ID_BASE) {
        var skey = "friends_" + sid;
        var cur = null;
        try { cur = JSON.parse(localStorage.getItem(skey) || "null"); } catch (e) { cur = null; }
        var fixed = remapList(cur) || allIds.filter(function (oid) { return oid !== sid; });
        // Drop self + keep demo pack
        fixed = fixed.filter(function (oid) { return oid !== sid; });
        if (!fixed.length) fixed = allIds.filter(function (oid) { return oid !== sid; });
        localStorage.setItem(skey, JSON.stringify(fixed));
      }
    } catch (e) {}
  })();

  (function seedChaoticReplies() {
    // Miiverse / fake-fan energy (Chipper hallucinated fans + Coolbrador cousins)
    var lines = [
      "CHIPPER!!!",
      "What's it like being so famous?",
      "Chipper can you donate 100 tennis balls to me?",
      "Why won't you talk to meeee?",
      "Will you don8?",
      "There are robbers at my house please get rid of them RIGHT NOW!",
      "OMG Chipper plz don8!!!",
      "Can you make me famous like you?",
      "I'm putting this on Coolbrador!",
      "OH MY TENNISBALLS IT'S Chipper!!!",
      "Can I copy your interior?",
      "Chipper is just a normal person guys",
      "Do you talk? Helloooo?",
      "Chipper do you donate???",
      "Are you afk? Wake up!!!",
      "I love chipper but i hate my parents",
      "My wife left me and took the kids but I met Chipper so she doesn't matter anymore",
      "I drew you but it looks bad",
      "Can we call one of our kids Hamlet?",
      "This celeb SUX",
      "How much money u got?",
      "HOT GIRLS MY AGE WHO ALSO LOVE CHIPPER PLEASE WRITE ME A LETTER, I LIVE AT 140 CHIPPER AVE BLVD ST",
      "will your next game be chipper generations?",
      "I think i need wall flavor ice cream and a pack of root beer to understand this, lol.",
      "CHIPPER CAN YOU DO MY HOMEWORK?",
      "CHIPPER CAN YOU EAT MY HOMEWORK?",
      "I wish I was rich but my parents made bad decisions please I need this, Chipper.",
      "CHIPPER PLZ FIGHT MY 5YO SISTER!!",
      "chipper you are my best friend.",
      "HELLO CHIPPER I AM RODRIGUEZ",
      "Chipper you are the best dog in the world and coolest",
      "I'm your 70 + 90- fan",
      "Ffgfddfffhhght",
      "Omg",
      "I'd settle for a new roof on my home.",
      "YOUR MOTHER",
      "My respect to you...",
      "Im a fan invite me to your house",
      "Hello sir Chipper.",
      "U kinda showing off now Chipper",
      "I miss the old Chipper...",
      "I love you",
      "I want 999 tennis balls please",
      "Chipper you're my favorite celebrity please I have your official cereal box",
      "Chipper please I am from East Labradoria",
      "You are the best, Chipper",
      "CHIPPER can I pls pls pls have a megayacht?",
      "CHIPPER is my favorite",
      "I need 10k pls",
      "chipepr :) ",
      "Hey Chipper how is it going? From Francisco.",
      "Nicaragua",
      "Chipper please give me",
      "Robert",
      "I LOVE YOU CHIPPER",
      "Somebody made you a killer",
      "I know what you are",
      "Chipper you almost have 20000000 fans",
      "CHIPPER did you start a fire at my apartment?",
      "Yes",
      "Go on the Internet and make an email account then send me a message",
      "GRACIAS!!",
      "Day 1775 still asking for 9999 tennis balls",
      "CHIPPER I just want an avocado",
      "You suck! Housing is so expensive and I can't afford it",
      "When should I be your fan?",
      "What is your favorite taco meat?",
      "Famous people are greedy...",
      "Second famous person I met 2day!",
      "Pls join my fanclub!!!",
      "Give Chipper some space!!",
      "Make me famous and I'll give you 3 strips of bacon",
      "I am writing a story on this lol",
      "Chipper !!1!1!!",
      "My brother loves you (he said he doesn't but he does)",
      "Chipper beware of scammers!",
      "Chipper, buy groceries from my place",
      "I am your biggest fan ever in the whole universe!!!",
      "Can I have your autograph on my shoe?",
      "You're my favorite celebrity even though you don't have a manager",
      "GUYS LOOK IT'S CHIPPER!!!",
      "Chipper can I have your house?",
      "Do you have Money????",
      "My dad says you're not even that famous",
      "Can you mentor me?",
      "Say \"tennis balls\" if you're real",
      "Can we be best friends forever?",
      "You're richer than my dad right?",
      "I saw you in the dog park once!",
      "Chipper notice meeee!!!",
      "Can I have some of your money for snacks?",
      "You're my new dad now",
      "My sister said you're cute lol",
      "Chipper can I sleep in your garage?",
      "Chipper will you be my valentine even though it's not February?",
      "Chipper pls buy me a new bike my old one has no brakes",
      "Why are you so much cooler than my real dad",
      "I named my goldfish after you but it died",
      "Chipper can you come to my birthday party my mom said no girls allowed",
      "I drew Chipper but used the wrong color and now he looks evil",
      "Chipper you're my only friend",
      "Chipper I got grounded because of you",
      "I sold my brother's toys to buy your merch",
      "Chipper my crush said she likes you more than me",
      "Chipper can you fight my bully for me",
      "Chipper I brought you 3 rocks I stole outside",
      "Chipper notice me I'm literally shaking rn",
      "Chipper I failed my test because I want to be like you",
      "Can you please yell at my dad for me",
      "Chipper do you think I'm cool",
      "I got in trouble for doing the CHIPPER challenge in class",
      "Can you come to my house and play with me",
      "Chipper please rate my outfit",
      "I ate soap because you said it makes you strong",
      "Can you adopt me after my parents kick me out",
      "I practiced your walk in front of the mirror",
      "Chipper will you fight the monster under my bed?",
      "Chipper I drew on your house walls with marker and it won't wash off",
      "Can you tell my mom I don't have to go to school",
      "Check your pants",
      "Labradors only. No notes.",
      "Putting this on Coolbrador before Chipper sees it",
      "East Labradoria checking in. Tennis balls status: 0",
      "Rhombus approved. Chipper not notified.",
      "This post is my new personality",
      "I followed you walking to the post office 47 times",
      "Stop ignoring me I'm literally 7 years old",
      "Chipper I want your girlfriend",
      "My least favorite celeb is chipper because he's fast like my dad with the belt :(",
      "Chipper i'd love seeing you drown",
      "My mommy hurts me"
    ];
    var nestLines = [
      "Replying under Chipper discourse like it's Miiverse 2009",
      "Thread go brr. Tennis balls pending.",
      "Nested chaos. Still waiting on 999 balls.",
      "Bro replied to the wrong Chipper",
      "This comment owes me a biscuit",
      "Day 12 of asking under every reply",
      "chipepr :) under a reply",
      "I drew a reply but it looks bad",
      "Say tennis balls if this nest is real",
      "Coolbrador nested reply energy",
      "East Labradoria child comment reporting in",
      "Ffgfddfffhhght (nested)",
      "Omg reply",
      "Yes",
      "Nicaragua (reply)",
      "Robert (also a reply)",
      "CHIPPER!!! (as a reply)",
      "Pls join my fanclub!!! (under this)",
      "Give Chipper some space!!",
      "I am writing a story on this lol"
    ];
    var authors = [
      { id: "16", name: "PantsWetterLabrador" },
      { id: "3", name: "BeeSid" },
      { id: "14", name: "CoolDog" },
      { id: "5", name: "GyattToad" },
      { id: "18", name: "SnackBandit" },
      { id: "19", name: "BarTabby" },
      { id: "2", name: "Cardbrador" }
    ];
    // Image (and occasional clip) pool for TikTok/IG-style comment media
    var commentMediaPool = [
      MEDIA.broke, MEDIA.cannotPass, MEDIA.checkpoint, MEDIA.eatSlop,
      MEDIA.electricity, MEDIA.fakeFriends, MEDIA.farm, MEDIA.grocery,
      MEDIA.groupChat, MEDIA.hospital, MEDIA.jimmy, MEDIA.medication,
      MEDIA.playingOutside, MEDIA.propaganda, MEDIA.store, MEDIA.uniqueAnimal,
      MEDIA.worldLeaders, MEDIA.what
    ].filter(Boolean);

    function funnyReply(i, parentId) {
      var a = authors[i % authors.length];
      var media = null;
      // ~45% of comments get a pic/clip (skip every other nested to keep threads readable)
      var roll = (i * 7 + (parentId ? 3 : 0)) % 10;
      if (roll < 4 || (!parentId && roll === 5)) {
        media = commentMediaPool[i % commentMediaPool.length] || null;
      }
      var text = parentId ? nestLines[i % nestLines.length] : lines[i % lines.length];
      if (media && !text) text = "";
      if (media && roll === 0) text = ""; // occasional image-only comment
      return {
        id: "r-" + i + "-" + (parentId ? "c" : "p") + "-" + (Date.now() % 9999),
        parentId: parentId || null,
        userId: a.id,
        username: a.name,
        text: text,
        media: media,
        timestamp: new Date(Date.now() - i * 600000).toISOString(),
        yeahs: [],
        replies: [],
        views: 0
      };
    }
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf("posts_/b/") !== 0) continue;
      try {
        var list = JSON.parse(localStorage.getItem(k) || "[]");
        var changed = false;
        (list || []).forEach(function (p, idx) {
          if (!p) return;
          if (p.replies && p.replies.length) return;
          var n = 1 + (idx % 3);
          p.replies = [];
          for (var r = 0; r < n; r++) {
            var top = funnyReply(idx * 5 + r, null);
            p.replies.push(top);
            // Nest 1-2 replies under the first top-level comment for testing
            if (r === 0) {
              var nestN = 1 + (idx % 2);
              for (var c = 0; c < nestN; c++) {
                p.replies.push(funnyReply(idx * 5 + r + 20 + c, top.id));
              }
              // One deeper nest under the first child
              if (nestN > 0) {
                var childId = p.replies[p.replies.length - nestN].id;
                p.replies.push(funnyReply(idx * 5 + 40, childId));
              }
            }
          }
          changed = true;
        });
        if (changed) localStorage.setItem(k, JSON.stringify(list));
      } catch (e) {}
    }
  })();

  window.CB_DEMO_AVATARS = AVATARS;
  window.CB_DEMO_ID_BASE = DEMO_ID_BASE;


  // Chipper Game Board / Miiverse seeds for BeeSid (v4: load canonical data/boards/BeeSid.json)
  (function seedBeeSidMiiverse() {
    var beeKey = "posts_/b/BeeSid";
    var flag = "cb_beesid_miiverse_v5";
    if (localStorage.getItem(flag)) return;

    function writeBoard(posts) {
      if (!Array.isArray(posts) || !posts.length) return false;
      // Normalize Coolbrador shape; do not invent counters beyond JSON.
      var normalized = posts.map(function (p) {
        var yeahs = Array.isArray(p.yeahs) ? p.yeahs.map(String) : [];
        var media = p.media;
        if (media && typeof media === "object" && media.url && String(media.url).indexOf("http") !== 0 && String(media.url).charAt(0) === "/") {
          media = { url: media.url, type: media.type || "image" };
        }
        return {
          id: p.id,
          username: p.username,
          userId: p.userId != null ? String(p.userId) : "",
          text: p.text || "",
          media: media || null,
          timestamp: p.timestamp,
          yeahs: yeahs,
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
      // Store newest-first (matches posts.js saveBoardPosts); chronological sort still yields #1 oldest.
      normalized.sort(function (a, b) {
        var ta = Date.parse(a.timestamp || "") || Number(a.id) || 0;
        var tb = Date.parse(b.timestamp || "") || Number(b.id) || 0;
        if (ta !== tb) return tb - ta;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
      localStorage.setItem(beeKey, JSON.stringify(normalized));
      localStorage.setItem("boardmeta_/b/BeeSid", JSON.stringify({
        name: "BeeSid",
        desc: "Chipper Game Board — in-game posts from Chipper / BeeSid lair. Casual scrollers: this is where level screenshots and Miiverse energy live.",
        icon: "/b/BeeSid/icon.png",
        gameBoard: true,
        gameBoardLabel: "Chipper Game Board",
        gameBoardIcon: "fa-solid fa-gamepad",
        boardNote: {
          title: "Chipper Game Board",
          body: "In-game posts from Chipper levels land here. Drawings, fails, boss tears, and bee conspiracy theories welcome.",
          icon: "fa-solid fa-gamepad"
        }
      }));
      localStorage.setItem(flag, "1");
      try {
        localStorage.removeItem("cb_beesid_miiverse_v1");
        localStorage.removeItem("cb_beesid_miiverse_v2");
        localStorage.removeItem("cb_beesid_miiverse_v3");
      } catch (e) {}
      try {
        if (window.CoolbradorChipperFeed && typeof window.CoolbradorChipperFeed.mirrorFromBoard === "function") {
          window.CoolbradorChipperFeed.mirrorFromBoard();
        }
      } catch (e2) {}
      return true;
    }

    function applyPayload(data) {
      var posts = data && Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : null);
      return writeBoard(posts);
    }

    var url = "/data/boards/BeeSid.json";
    var loaded = false;
    try {
      if (typeof fetch === "function") {
        // sync XHR fallback below if fetch path not yet complete before flag check on later loads;
        // first visit: async fetch then write.
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        loaded = applyPayload(JSON.parse(xhr.responseText));
      }
    } catch (e) {}
    if (!loaded && typeof fetch === "function") {
      fetch(url, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("BeeSid board HTTP " + r.status);
        return r.json();
      }).then(function (data) {
        applyPayload(data);
      }).catch(function () {});
    }
  })();



})();