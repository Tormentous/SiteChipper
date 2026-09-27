const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ storageBucket: "coolbrador.firebasestorage.app" });
async function main() {
  const root = path.resolve(__dirname, "..", "..");
  const bak = path.join(root, "data", "_backup_pre_autopublish");
  const feed = JSON.parse(fs.readFileSync(path.join(bak, "chipper_game_board_feed.json"), "utf8"));
  const board = JSON.parse(fs.readFileSync(path.join(bak, "BeeSid.json"), "utf8"));
  const bucket = admin.storage().bucket();
  async function put(p, obj) {
    const file = bucket.file(p);
    try { await file.delete(); } catch (_) {}
    await file.save(Buffer.from(JSON.stringify(obj), "utf8"), {
      resumable: false,
      metadata: { contentType: "application/json; charset=utf-8", cacheControl: "public,max-age=60,must-revalidate" },
    });
    console.log("wrote", p, "posts", (obj.posts || []).length);
  }
  await put("chipper/chipper_game_board_feed.json", feed);
  await put("chipper/BeeSid.json", board);
  console.log("seed done");
}
main().catch((e) => { console.error(e); process.exit(1); });
