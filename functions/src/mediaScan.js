/**
 * Coolbrador mediaScan — Arachnid Shield proxy (credentials NEVER in frontend).
 *
 * Setup:
 *   1) Create an Arachnid Shield account at https://shield.projectarachnid.com
 *   2) firebase functions:secrets:set ARACHNID_SHIELD_USER
 *      firebase functions:secrets:set ARACHNID_SHIELD_PASS
 *   3) Deploy this function and wire hosting rewrite /api/media-scan → mediaScan
 *
 * Returns { ok, classification } only — never echo hashes or evasion tips.
 */
const functions = require("firebase-functions");
const Busboy = require("busboy");
const fetch = require("node-fetch");
const admin = require('firebase-admin');
const {Timestamp}=require('firebase-admin/firestore');
const {mediaVerdict}=require('./mediaVerdict');
if(!admin.apps.length)admin.initializeApp();

const SHIELD_URL = "https://api.shield.projectarachnid.com/v1/media";

function readMultipart(req) {
  return new Promise(function (resolve, reject) {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 15 * 1024 * 1024, files: 1 } });
    let fileBuf = null;
    let fileMime = "application/octet-stream";
    let fileName = "upload.bin";
    busboy.on("file", function (field, stream, info) {
      const chunks = [];
      fileMime = (info && info.mimeType) || fileMime;
      fileName = (info && info.filename) || fileName;
      stream.on("data", function (d) { chunks.push(d); });
      stream.on("limit", function () { reject(new Error("file too large")); });
      stream.on("end", function () { fileBuf = Buffer.concat(chunks); });
    });
    busboy.on("error", reject);
    busboy.on("finish", function () {
      if (!fileBuf) return reject(new Error("missing file"));
      resolve({ buffer: fileBuf, mime: fileMime, name: fileName });
    });
    if (req.rawBody) busboy.end(req.rawBody);
    else req.pipe(busboy);
  });
}

exports.mediaScan = functions.runWith({secrets:["ARACHNID_SHIELD_USER","ARACHNID_SHIELD_PASS"],timeoutSeconds:60,memory:"256MB"}).https.onRequest(async function (req, res) {
  res.set("Access-Control-Allow-Origin", req.get("origin") || "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ ok: false, classification: "error" });

  let identity;
  try { identity=await admin.auth().verifyIdToken((req.get('authorization')||'').replace(/^Bearer /,''),true); }
  catch (_) { return res.status(401).json({ok:false,classification:'unauthorized'}); }
  try {
    const db=admin.firestore(),quota=db.doc('scanQuota/'+identity.uid);
    await db.runTransaction(async tx=>{
      const [previous,deletion]=await Promise.all([tx.get(quota),tx.get(db.doc('accountDeletions/'+identity.uid))]);
      if(deletion.exists)throw Error('disabled');
      if(previous.exists&&Date.now()-previous.data().at.toMillis()<2000)throw Error('rate');
      tx.set(quota,{at:Timestamp.now()});
    });
  } catch(error) { return res.status(error.message==='disabled'?403:429).json({ok:false,classification:'try_later'}); }

  const user = process.env.ARACHNID_SHIELD_USER || (functions.config().arachnid && functions.config().arachnid.user);
  const pass = process.env.ARACHNID_SHIELD_PASS || (functions.config().arachnid && functions.config().arachnid.pass);
  if (!user || !pass) {
    // Not configured yet — frontend will soft-skip remote hash scan.
    return res.status(501).json({ ok: true, classification: "unconfigured", skipped: true });
  }

  try {
    const file = await readMultipart(req);
    const auth = Buffer.from(String(user) + ":" + String(pass)).toString("base64");
    const form = new (require("form-data"))();
    form.append("media", file.buffer, { filename: file.name, contentType: file.mime });

    const upstream = await fetch(SHIELD_URL, {
      method: "POST",
      headers: Object.assign({ Authorization: "Basic " + auth }, form.getHeaders()),
      body: form, timeout: 30000
    });

    let data = {};
    try { data = await upstream.json(); } catch (_) { data = {}; }

    const verdict=mediaVerdict(upstream.status,data);
    return res.status(verdict.classification==='unavailable'?503:200).json(verdict);
  } catch (err) {
    console.error("mediaScan error", err && err.message);
    return res.status(503).json({ ok: false, classification: "unavailable" });
  }
});
