const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
if (!admin.apps.length) admin.initializeApp();

// No credentials, password hashes, access tokens or other people's private messages.
async function collectAccountData(uid, { maxBytes = 8 * 1024 * 1024, maxScanned = 50000 } = {}) {
  const db = admin.firestore(), user = await admin.auth().getUser(uid);
  const result = {
    format: 'coolbrador-account-v1', exportedAt: new Date().toISOString(),
    account: { uid, email: user.email || null, emailVerified: user.emailVerified, displayName: user.displayName || null, createdAt: user.metadata.creationTime },
    scope: 'Current account content and settings. Media URLs are included, not binaries. Service logs, backups and content already deleted are not included. Contact support for a broader access request.',
    records: []
  };
  let bytes = Buffer.byteLength(JSON.stringify(result)), scanned = 0;
  function add(snap) {
    if (!snap.exists) return;
    let data=snap.data();
    if(snap.ref.parent.id==='profiles')data=Object.fromEntries(['uid','displayName','username','bio','avatarUrl','avatarPath','createdAt','searchTokens'].filter(key=>key in data).map(key=>[key,data[key]]));
    const record = { path: snap.ref.path, data };
    // Timestamps serialize explicitly for portable consumption.
    const json = JSON.stringify(record, (_, value) => value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value);
    bytes += Buffer.byteLength(json);
    if (bytes > maxBytes) throw Object.assign(Error('This account needs a larger export. Contact support for a complete copy.'), { code: 'export-too-large' });
    result.records.push(JSON.parse(json));
  }
  async function walk(query, visit = add) {
    let cursor;
    for (;;) {
      const page = await (cursor ? query.startAfter(cursor) : query).limit(100).get();
      scanned += page.size;
      if (scanned > maxScanned) throw Object.assign(Error('This account needs an assisted export. Contact support for a complete copy.'), { code: 'export-too-large' });
      for (const snap of page.docs) await visit(snap);
      if (page.size < 100) break;
      cursor = page.docs.at(-1);
    }
  }
  for (const [collection, field] of [['profiles','uid'],['posts','authorId'],['reposts','authorId'],['polls','authorId'],['boards','ownerId'],['reports','reporter']]) {
    await walk(db.collection(collection).where(field, '==', uid));
  }
  await walk(db.collectionGroup('comments').where('authorId', '==', uid));
  await walk(db.collection('moderationDecisions').where('recipients', 'array-contains', uid));
  await walk(db.collection('friendships').where('participants', 'array-contains', uid));
  for (const name of ['blocks','notifications','conversationReads','activity']) await walk(db.collection(`users/${uid}/${name}`));
  const privateRecord = await db.doc('accountPrivate/' + uid).get();
  // Legacy migration only stores contact details here; explicitly whitelist them.
  if (privateRecord.exists) result.privateContact = { email: privateRecord.get('email') || null, phone: privateRecord.get('phone') || privateRecord.get('phoneNumber') || null };
  await walk(db.collection('conversations').where('participants','array-contains',uid), async thread => {
    add(thread);
    await walk(thread.ref.collection('messages').where('senderId','==',uid));
  });
  // Legacy votes/reactions use the owner's UID as their document ID.
  for (const [parents, children] of [['polls','votes'],['posts','reactions']]) {
    await walk(db.collection(parents), async parent => add(await parent.ref.collection(children).doc(uid).get()));
  }
  return result;
}
exports.collectAccountData = collectAccountData;
exports.exportAccountData = functions.runWith({ timeoutSeconds: 300, memory: '512MB' }).https.onRequest(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let identity;
  try {
    const token = /^Bearer (.+)$/.exec(req.get('authorization') || '')?.[1];
    if (!token) throw Error('Missing token');
    identity = await admin.auth().verifyIdToken(token, true);
  } catch { return res.status(401).json({ error: 'Sign in again to download your data.' }); }
  if (!Number.isFinite(identity.auth_time) || Date.now()/1000 - identity.auth_time > 300) return res.status(401).json({ error: 'For your privacy, sign out and sign in again before downloading your data.' });
  try {
    const db = admin.firestore(), quota = db.doc('exportQuota/' + identity.uid);
    await db.runTransaction(async tx => {
      const [deletion, last] = await Promise.all([tx.get(db.doc('accountDeletions/' + identity.uid)),tx.get(quota)]);
      if (deletion.exists) throw Object.assign(Error('Account deletion is in progress.'), { status: 403 });
      if (last.exists && Date.now() - last.get('at').toMillis() < 60000) throw Object.assign(Error('Please wait a minute before requesting another download.'), { status: 429 });
      tx.set(quota, { at: FieldValue.serverTimestamp() });
    });
    const data = await collectAccountData(identity.uid);
    res.set('Content-Disposition', 'attachment; filename="coolbrador-account.json"');
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || (error.code === 'export-too-large' ? 413 : 503);
    return res.status(status).json({ error: status === 503 ? 'Could not prepare your download. Please try again later.' : error.message });
  }
});
