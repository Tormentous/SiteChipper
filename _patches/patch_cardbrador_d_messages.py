# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09")

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"MISSING [{label}]\n---\n{old[:350]}\n---")
    return text.replace(old, new, 1)

path = ROOT / "js" / "messages.js"
text = path.read_text(encoding="utf-8")

text = must_replace(text, '  var SEED_VER = "3";', '  var SEED_VER = "4";', "SEED_VER")

text = must_replace(
    text,
    '''  function sessionUserId() {
    if (global.CoolbradorPosts && global.CoolbradorPosts.sessionUserId) {
      return String(global.CoolbradorPosts.sessionUserId() || "0");
    }
    return "0";
  }''',
    '''  function sessionUserId() {
    try {
      if (global.CoolbradorSession && global.CoolbradorSession.ensureSessionNotDemo) {
        global.CoolbradorSession.ensureSessionNotDemo();
      }
    } catch (e) {}
    if (global.CoolbradorPosts && global.CoolbradorPosts.sessionUserId) {
      var sid = String(global.CoolbradorPosts.sessionUserId() || "");
      if (sid && /^\\d+$/.test(sid)) return sid;
    }
    if (global.CoolbradorSession && global.CoolbradorSession.getSessionUserId) {
      var s2 = String(global.CoolbradorSession.getSessionUserId() || "");
      if (s2 && /^\\d+$/.test(s2)) return s2;
    }
    try {
      var id = String(localStorage.getItem("currentUserId") || "").trim();
      if (id && /^\\d+$/.test(id)) return id;
    } catch (e) {}
    return "";
  }

  function sessionDisplayName() {
    var id = sessionUserId();
    try {
      var p = JSON.parse(localStorage.getItem("profile_" + id) || "null") || {};
      var u = JSON.parse(localStorage.getItem("user_" + id) || "{}");
      return p.displayName || u.displayName || u.username || "Labrador";
    } catch (e) {
      return "Labrador";
    }
  }

  function threadDisplayTitle(thread) {
    if (!thread) return "Chat";
    if (thread.group) {
      var gt = String(thread.groupName || thread.title || "Group").trim();
      var meName = sessionDisplayName();
      // Never label a group chat as the signed-in Labrador.
      if (meName && gt.toLowerCase() === String(meName).toLowerCase()) {
        gt = thread.groupName || "Chipper Corner";
      }
      if (/^chipper\\s*corner$/i.test(gt) || /^chippercorner$/i.test(gt)) return "Chipper Corner";
      return gt || "Group";
    }
    return String(thread.title || "Chat");
  }

  function threadAvatar(thread) {
    if (!thread) return "/users/default/pfp.jpg";
    if (thread.group && thread.groupImage) return thread.groupImage;
    return getPfp(thread.peerId);
  }

  function updateThreadFields(threadN, patch) {
    var list = loadAll();
    var thread = list.find(function (t) { return Number(t.n) === Number(threadN); });
    if (!thread) return null;
    Object.keys(patch || {}).forEach(function (k) { thread[k] = patch[k]; });
    if (thread.group) {
      if (patch.groupName != null) thread.title = patch.groupName;
      if (patch.title != null && patch.groupName == null) thread.groupName = patch.title;
    }
    saveAll(list);
    return thread;
  }''',
    "session + thread display helpers"
)

# Replace seedIfNeeded body
old_seed = '''  function seedIfNeeded() {
    try {
      if (localStorage.getItem(SEED_KEY) === SEED_VER && loadAll().length) return;
    } catch (e) {}

    var now = Date.now();
    var me = "0";
    var threads = [
      {
        n: 1,
        title: "BeeSid",
        peerId: "1",
        messages: [
          { id: "m1", from: "1", text: "CHIPPER!!!", ts: new Date(now - 7200000).toISOString() },
          { id: "m2", from: me, text: "bee please", ts: new Date(now - 7000000).toISOString() },
          { id: "m3", from: "1", text: "Will you don8 999 tennis balls", ts: new Date(now - 6800000).toISOString() },
          { id: "m4", from: me, text: "no", ts: new Date(now - 6600000).toISOString() },
          { id: "m5", from: "1", text: "Day 1775 still asking", ts: new Date(now - 120000).toISOString() }
        ]
      },
      {
        n: 2,
        title: "PantsWetterLabrador",
        peerId: "14",
        messages: [
          { id: "m1", from: "14", text: "Check your pants", ts: new Date(now - 86400000).toISOString() },
          { id: "m2", from: me, text: "why is this always you", ts: new Date(now - 86000000).toISOString() },
          { id: "m3", from: "14", text: "Hydration is a lifestyle", ts: new Date(now - 85000000).toISOString() }
        ]
      },
      {
        n: 3,
        title: "Chipper Corner",
        peerId: "6",
        group: true,
        messages: [
          { id: "m1", from: "6", text: "In-game clip check.", ts: new Date(now - 172800000).toISOString() },
          { id: "m2", from: "3", text: "Rhombus approved.", ts: new Date(now - 172000000).toISOString() },
          { id: "m3", from: "12", text: "I'm putting this on Coolbrador!", ts: new Date(now - 170000000).toISOString() },
          { id: "m4", from: me, text: "east labradoria checking in", ts: new Date(now - 169000000).toISOString() }
        ]
      },
      {
        n: 4,
        title: "GyattToad",
        peerId: "3",
        messages: [
          { id: "m1", from: "3", text: "Pitch: board stickers that jiggle", ts: new Date(now - 4000000).toISOString() },
          { id: "m2", from: me, text: "send prototype", ts: new Date(now - 3900000).toISOString() },
          { id: "m3", from: "3", text: "Already on Coolbrador lol", ts: new Date(now - 3800000).toISOString() }
        ]
      },
      {
        n: 5,
        title: "BarTabby",
        peerId: "17",
        messages: [
          { id: "m1", from: "17", text: "3am laps?", ts: new Date(now - 500000).toISOString() },
          { id: "m2", from: me, text: "always", ts: new Date(now - 480000).toISOString() },
          { id: "m3", from: "17", text: "Bring snacks. Zoomies tax unpaid.", ts: new Date(now - 400000).toISOString() }
        ]
      }
    ];

    saveAll(threads);
    try { localStorage.setItem(SEED_KEY, SEED_VER); } catch (e) {}
  }'''

new_seed = '''  function seedIfNeeded() {
    try {
      if (localStorage.getItem(SEED_KEY) === SEED_VER && loadAll().length) {
        // One-shot soft repair for group titles stuck as the signed-in name.
        repairGroupLabels();
        return;
      }
    } catch (e) {}

    var now = Date.now();
    var me = sessionUserId() || "0";
    var threads = [
      {
        n: 1,
        title: "BeeSid",
        peerId: "3",
        messages: [
          { id: "m1", from: "3", text: "CHIPPER!!!", ts: new Date(now - 7200000).toISOString() },
          { id: "m2", from: me, text: "bee please", ts: new Date(now - 7000000).toISOString() },
          { id: "m3", from: "3", text: "Will you don8 999 tennis balls", ts: new Date(now - 6800000).toISOString() },
          { id: "m4", from: me, text: "no", ts: new Date(now - 6600000).toISOString() },
          { id: "m5", from: "3", text: "Day 1775 still asking", ts: new Date(now - 120000).toISOString() }
        ]
      },
      {
        n: 2,
        title: "PantsWetterLabrador",
        peerId: "16",
        messages: [
          { id: "m1", from: "16", text: "Check your pants", ts: new Date(now - 86400000).toISOString() },
          { id: "m2", from: me, text: "why is this always you", ts: new Date(now - 86000000).toISOString() },
          { id: "m3", from: "16", text: "Hydration is a lifestyle", ts: new Date(now - 85000000).toISOString() }
        ]
      },
      {
        n: 3,
        title: "Chipper Corner",
        groupName: "Chipper Corner",
        peerId: "group_chipper",
        group: true,
        members: ["6", "3", "12", me],
        groupImage: "/img/PlanetChipperHomepage.png",
        messages: [
          { id: "m1", from: "6", text: "In-game clip check.", ts: new Date(now - 172800000).toISOString() },
          { id: "m2", from: "3", text: "Rhombus approved.", ts: new Date(now - 172000000).toISOString() },
          { id: "m3", from: "12", text: "I'm putting this on Coolbrador!", ts: new Date(now - 170000000).toISOString() },
          { id: "m4", from: me, text: "east labradoria checking in", ts: new Date(now - 169000000).toISOString() }
        ]
      },
      {
        n: 4,
        title: "GyattToad",
        peerId: "5",
        messages: [
          { id: "m1", from: "5", text: "Pitch: board stickers that jiggle", ts: new Date(now - 4000000).toISOString() },
          { id: "m2", from: me, text: "send prototype", ts: new Date(now - 3900000).toISOString() },
          { id: "m3", from: "5", text: "Already on Coolbrador lol", ts: new Date(now - 3800000).toISOString() }
        ]
      },
      {
        n: 5,
        title: "BarTabby",
        peerId: "19",
        messages: [
          { id: "m1", from: "19", text: "3am laps?", ts: new Date(now - 500000).toISOString() },
          { id: "m2", from: me, text: "always", ts: new Date(now - 480000).toISOString() },
          { id: "m3", from: "19", text: "Bring snacks. Zoomies tax unpaid.", ts: new Date(now - 400000).toISOString() }
        ]
      }
    ];

    saveAll(threads);
    try { localStorage.setItem(SEED_KEY, SEED_VER); } catch (e) {}
  }

  function repairGroupLabels() {
    var me = sessionUserId();
    var meName = sessionDisplayName();
    var list = loadAll();
    var changed = false;
    list.forEach(function (t) {
      if (!t || !t.group) return;
      if (!t.groupName && t.title) t.groupName = t.title;
      // peerId "6" is a member, not the room title.
      if (String(t.peerId) === "6" || String(t.peerId) === "group_chipper" || /chipper/i.test(String(t.groupName || t.title || ""))) {
        t.groupName = "Chipper Corner";
        t.title = "Chipper Corner";
        if (String(t.peerId) === "6") t.peerId = "group_chipper";
        if (!t.groupImage) t.groupImage = "/img/PlanetChipperHomepage.png";
        if (!Array.isArray(t.members) || !t.members.length) t.members = ["6", "3", "12", me].filter(Boolean);
        changed = true;
      }
      var title = String(t.title || t.groupName || "");
      if (meName && title && title.toLowerCase() === String(meName).toLowerCase()) {
        t.title = t.groupName || "Chipper Corner";
        changed = true;
      }
      // Remap legacy seed "from":"0" bubbles onto current session user when appropriate.
      (t.messages || []).forEach(function (m) {
        if (!m) return;
        if (me && (String(m.from) === "0" || String(m.from) === "2") && String(m.from) !== String(me)) {
          // Only remap placeholder "me" markers, not demo Cardbrador chatter.
          if (String(m.from) === "0") { m.from = me; changed = true; }
        }
      });
    });
    if (changed) saveAll(list);
  }'''

text = must_replace(text, old_seed, new_seed, "seedIfNeeded")

# threadListHtml use display title + group avatar
text = must_replace(
    text,
    '''          '<img class="cb-msg-avatar" src="' + escapeHtml(getPfp(t.peerId)) + '" alt="">' +
          '<span class="cb-msg-thread-body">' +
            '<span class="cb-msg-thread-top">' +
              "<strong>" + escapeHtml(t.title) + "</strong>" +''',
    '''          '<img class="cb-msg-avatar" src="' + escapeHtml(threadAvatar(t)) + '" alt="">' +
          '<span class="cb-msg-thread-body">' +
            '<span class="cb-msg-thread-top">' +
              "<strong>" + escapeHtml(threadDisplayTitle(t)) + "</strong>" +''',
    "thread list title"
)

# bubbles: for mine, optionally show sender name from session in group? User wants sent as current session user - from is already sessionUserId. Display for mine doesn't show name. Good.

# renderChat head with group edit
text = must_replace(
    text,
    '''    head.innerHTML =
      '<div class="cb-msg-chat-peer">' +
        '<img class="cb-msg-avatar" src="' + escapeHtml(getPfp(thread.peerId)) + '" alt="">' +
        "<div>" +
          "<strong>" + escapeHtml(thread.title) + "</strong>" +
          '<span class="cb-msg-sub">' + (thread.group ? "Group chat" : "Direct message") + " - #" + thread.n +
            ' · <a class="cb-msg-profile-link" href="/users/profile/?id=' + encodeURIComponent(thread.peerId || "0") + '">Profile</a>' +
          "</span>" +
        "</div>" +
      "</div>";

    body.innerHTML = bubblesHtml(thread);
    body.scrollTop = body.scrollHeight;
  }''',
    '''    var title = threadDisplayTitle(thread);
    var avatar = threadAvatar(thread);
    var sub = thread.group
      ? ('Group chat - #' + thread.n +
          ' · <button type="button" class="cb-msg-group-edit-btn" data-group-edit="' + thread.n + '">Edit group</button>')
      : ('Direct message - #' + thread.n +
          ' · <a class="cb-msg-profile-link" href="/users/' + encodeURIComponent(thread.peerId || "0") + '">Profile</a>');
    head.innerHTML =
      '<div class="cb-msg-chat-peer">' +
        '<img class="cb-msg-avatar" src="' + escapeHtml(avatar) + '" alt="">' +
        "<div>" +
          "<strong>" + escapeHtml(title) + "</strong>" +
          '<span class="cb-msg-sub">' + sub + "</span>" +
        "</div>" +
      "</div>";

    body.innerHTML = bubblesHtml(thread);
    body.scrollTop = body.scrollHeight;
  }

  function openGroupEdit(threadN) {
    var thread = getByNumber(threadN);
    if (!thread || !thread.group) return;
    var name = window.prompt("Group name", threadDisplayTitle(thread));
    if (name == null) return;
    name = String(name).trim();
    if (!name) name = "Chipper Corner";
    var img = window.prompt("Group image URL (leave blank to keep)", thread.groupImage || "");
    if (img == null) img = thread.groupImage || "";
    img = String(img).trim();
    updateThreadFields(threadN, {
      groupName: name,
      title: name,
      groupImage: img || thread.groupImage || ""
    });
    refreshActiveUi();
  }''',
    "renderChat group edit"
)

# mini head titles
text = must_replace(
    text,
    '''            '<img class="cb-msg-avatar" src="' + escapeHtml(getPfp(thread.peerId)) + '" alt="">' +
            '<div class="cb-msg-mini-peer">' +
              "<strong>" + escapeHtml(thread.title) + "</strong>" +
              '<span class="cb-msg-sub">' + (thread.group ? "Group" : "DM") + " · #" + thread.n + "</span>" +
            "</div>";''',
    '''            '<img class="cb-msg-avatar" src="' + escapeHtml(threadAvatar(thread)) + '" alt="">' +
            '<div class="cb-msg-mini-peer">' +
              "<strong>" + escapeHtml(threadDisplayTitle(thread)) + "</strong>" +
              '<span class="cb-msg-sub">' + (thread.group ? "Group" : "DM") + " · #" + thread.n + "</span>" +
            "</div>";''',
    "mini head title"
)

# document title
text = must_replace(
    text,
    '''    document.title = thread ? thread.title + " - Messages - Coolbrador" : "Messages - Coolbrador";''',
    '''    document.title = thread ? threadDisplayTitle(thread) + " - Messages - Coolbrador" : "Messages - Coolbrador";''',
    "doc title"
)

# scheduleAutoReply typing name for groups
text = must_replace(
    text,
    '''    var name = thread.title || "Lab";
    var thinkMs = 1000 + Math.floor(Math.random() * 900);
    typingTimer = setTimeout(function () {
      if (Number(activeThreadN()) !== Number(threadN)) return;
      showTyping(name, thread.peerId);
      replyTimer = setTimeout(function () {
        if (Number(activeThreadN()) !== Number(threadN)) return;
        hideTyping();
        var fromId = thread.group ? (["1", "3", "6", "12"][Math.floor(Math.random() * 4)]) : thread.peerId;''',
    '''    var name = thread.group ? "Chipper Corner" : (thread.title || "Lab");
    var thinkMs = 1000 + Math.floor(Math.random() * 900);
    typingTimer = setTimeout(function () {
      if (Number(activeThreadN()) !== Number(threadN)) return;
      var typingFrom = thread.group
        ? (["6", "3", "12", "5"][Math.floor(Math.random() * 4)])
        : thread.peerId;
      showTyping(name, typingFrom);
      replyTimer = setTimeout(function () {
        if (Number(activeThreadN()) !== Number(threadN)) return;
        hideTyping();
        var fromId = thread.group ? (["6", "3", "12", "5"][Math.floor(Math.random() * 4)]) : thread.peerId;''',
    "auto reply ids"
)

# Wire group edit click in page wire()
text = must_replace(
    text,
    '''    var list = document.getElementById("msgThreadList");
    if (list && !list.dataset.wired) {
      list.dataset.wired = "1";
      list.addEventListener("click", function (e) {
        var btn = e.target.closest(".cb-msg-thread[data-thread-n]");''',
    '''    var chatHead = document.getElementById("msgChatHead");
    if (chatHead && !chatHead.dataset.groupEditWired) {
      chatHead.dataset.groupEditWired = "1";
      chatHead.addEventListener("click", function (e) {
        var edit = e.target.closest("[data-group-edit]");
        if (!edit) return;
        e.preventDefault();
        openGroupEdit(edit.getAttribute("data-group-edit"));
      });
    }

    var list = document.getElementById("msgThreadList");
    if (list && !list.dataset.wired) {
      list.dataset.wired = "1";
      list.addEventListener("click", function (e) {
        var btn = e.target.closest(".cb-msg-thread[data-thread-n]");''',
    "wire group edit"
)

# sendMessage: ensure from is session and never empty demo
text = must_replace(
    text,
    '''    var msg = {
      id: "m-" + Date.now(),
      from: sessionUserId(),
      text: text,
      ts: new Date().toISOString()
    };''',
    '''    var fromId = sessionUserId();
    if (!fromId) {
      toast("Sign in to send messages");
      return false;
    }
    var msg = {
      id: "m-" + Date.now(),
      from: fromId,
      text: text,
      ts: new Date().toISOString()
    };''',
    "sendMessage from guard"
)

# AUTO_REPLIES keys for BeeSid was "1" - add "3" alias already have "3". Fix group concat.
text = must_replace(
    text,
    '''    if (thread && thread.group) {
      pool = AUTO_REPLIES._default.concat(AUTO_REPLIES["1"]).concat(AUTO_REPLIES["3"]);
    }''',
    '''    if (thread && thread.group) {
      pool = AUTO_REPLIES._default.concat(AUTO_REPLIES["3"] || []).concat(AUTO_REPLIES["6"] || []);
    }''',
    "group auto replies"
)

# filter search also uses title - update to display title
text = must_replace(
    text,
    '''      return String(t.title || "").toLowerCase().indexOf(filter) >= 0 ||
        previewLine(t).toLowerCase().indexOf(filter) >= 0;''',
    '''      return String(threadDisplayTitle(t) || "").toLowerCase().indexOf(filter) >= 0 ||
        previewLine(t).toLowerCase().indexOf(filter) >= 0;''',
    "filter display title"
)

path.write_text(text, encoding="utf-8")
print("OK messages.js")
