/**
 * Chipper Game Board live feed — serve via coolbrador.com Cloud Functions.
 * Write path remains browser Save → Firestore chipper/feed (cb-chipper-feed-sync.js).
 * GET handlers read that doc so Chipper never talks to Firestore directly.
 *
 * Requires Blaze to deploy. Until then, static /data/*.json (agent deploy) is the
 * coolbrador.com source of truth for Chipper.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const FEED_PATH = "chipper/chipper_game_board_feed.json";
const BOARD_PATH = "chipper/BeeSid.json";
const { toGamePost, mergeFeed } = require("./socialFeed");
const FS_DOC = "chipper/feed";

function cors(req, res) {
  const origin = req.get("origin") || "*";
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

function bucket() {
  try {
    return admin.storage().bucket("coolbrador.firebasestorage.app");
  } catch (e) {
    return admin.storage().bucket();
  }
}

async function writeJson(path, obj) {
  const file = bucket().file(path);
  try {
    await file.delete();
  } catch (_) {}
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  await file.save(body, {
    resumable: false,
    validation: false,
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public,max-age=60,must-revalidate",
      metadata: { replacedAt: new Date().toISOString() },
    },
  });
}

async function readJson(path) {
  const file = bucket().file(path);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf8"));
}

async function readFirestoreFeedDoc() {
  const snap = await admin.firestore().doc(FS_DOC).get();
  if (!snap.exists) return null;
  return snap.data() || null;
}

function parseJsonField(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  return null;
}

async function curatedFeed() {
  const data = await readFirestoreFeedDoc();
  if (data) {
    const feed = parseJsonField(data.payload);
    if (feed && Array.isArray(feed.posts)) {
      feed.meta = Object.assign({}, feed.meta || {}, {
        liveSource: "firestore:chipper/feed",
        servedAt: new Date().toISOString(),
      });
      return feed;
    }
  }
  // Storage fallback (legacy publish path)
  const stored = await readJson(FEED_PATH);
  if (stored) return stored;
  return {
    board: "chipper-game-board",
    version: 0,
    meta: { empty: true, source: "storage-miss" },
    posts: [],
  };
}

async function sharedGamePosts() {
  const snapshot = await admin.firestore().collection('posts').where('board', '==', 'BeeSid').orderBy('createdAt','desc').limit(50).get();
  return Promise.all(snapshot.docs.map(async document => {
    const post = { ...document.data(), id: document.id };
    const [profile, reactions] = await Promise.all([
      admin.firestore().collection('profiles').doc(post.profileId).get(),
      document.ref.collection('reactions').get()
    ]);
    return toGamePost(post, profile.exists ? profile.data() : null, reactions.docs.map(r => r.data()));
  }));
}
async function liveFeed() {
  const [base, posts] = await Promise.all([curatedFeed(), sharedGamePosts()]);
  return mergeFeed(base, posts);
}
async function curatedBoard() {
  const data = await readFirestoreFeedDoc();
  if (data) {
    const board = parseJsonField(data.board);
    if (board && Array.isArray(board.posts)) {
      board.meta = Object.assign({}, board.meta || {}, {
        liveSource: "firestore:chipper/feed.board",
        servedAt: new Date().toISOString(),
      });
      return board;
    }
  }
  const stored = await readJson(BOARD_PATH);
  if (stored) return stored;
  return {
    board: "BeeSid",
    version: 0,
    posts: [],
    meta: { empty: true },
  };
}

async function liveBoard() {
  const [base, posts] = await Promise.all([curatedBoard(), sharedGamePosts()]);
  return { ...base, posts: [...posts.map(p => ({ ...p, text:p.body, userId:p.author })), ...(base.posts || [])] };
}

exports.publishChipperFeed = functions.https.onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return res.status(400).json({ ok: false, error: "invalid JSON" });
    }
  }
  body = body || {};

  try {
    const header = req.get('Authorization') || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ ok:false, error:'Sign in required' });
    const claims = await admin.auth().verifyIdToken(header.slice(7), true);
    if (claims.moderator !== true) return res.status(403).json({ ok:false, error:'Moderator access required' });
  } catch (_) {
    return res.status(401).json({ ok:false, error:'Invalid authentication' });
  }

  const feed = body.feed;
  const board = body.board;
  if (!feed || typeof feed !== "object" || !Array.isArray(feed.posts)) {
    return res.status(400).json({ ok: false, error: "feed.posts required" });
  }
  if (!board || typeof board !== "object" || !Array.isArray(board.posts)) {
    return res.status(400).json({ ok: false, error: "board.posts required" });
  }

  const nowIso = new Date().toISOString();
  feed.meta = Object.assign({}, feed.meta || {}, {
    publishedAt: nowIso,
    source: "mod-panel-publish",
    replaced: true,
  });
  board.version =
    Number(board.version || (feed.meta && feed.meta.boardVersion) || 0) ||
    Date.now();
  board.updatedAt = nowIso;

  try {
    await writeJson(FEED_PATH, feed);
    await writeJson(BOARD_PATH, board);
    // Also mirror into Firestore so GET live path stays current.
    await admin.firestore().doc(FS_DOC).set(
      {
        payload: JSON.stringify(feed),
        board: JSON.stringify(board),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(nowIso)),
        postCount: (feed.posts || []).length,
        boardName: "BeeSid",
      },
      { merge: true }
    );
  } catch (err) {
    console.error("publishChipperFeed write failed", err);
    return res.status(500).json({
      ok: false,
      error: String((err && err.message) || err),
    });
  }

  return res.status(200).json({
    ok: true,
    postCount: feed.posts.length,
    boardVersion: board.version,
    publishedAt: feed.meta.publishedAt,
  });
});

function sendJson(res, obj) {
  res.set("Content-Type", "application/json; charset=utf-8");
  res.set("Cache-Control", "public,max-age=30,must-revalidate");
  return res.status(200).send(JSON.stringify(obj));
}

exports.getChipperFeed = functions.https.onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }
  try {
    const feed = await liveFeed();
    return sendJson(res, feed);
  } catch (err) {
    console.error("getChipperFeed", err);
    return res.status(500).json({ ok: false, error: "read failed" });
  }
});

exports.getBeeSidBoard = functions.https.onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }
  try {
    const board = await liveBoard();
    return sendJson(res, board);
  } catch (err) {
    console.error("getBeeSidBoard", err);
    return res.status(500).json({ ok: false, error: "read failed" });
  }
});
