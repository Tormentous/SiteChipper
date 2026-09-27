// Idempotent cleanup shared by deletion jobs, Auth deletion and content triggers.
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function eachPage(query, callback) {
  let cursor;
  for (;;) {
    const page = await (cursor ? query.startAfter(cursor) : query).limit(100).get();
    if (page.empty) return;
    // Bounded concurrency avoids exhausting Firestore/Storage sockets.
    for (let i = 0; i < page.docs.length; i += 10) await Promise.all(page.docs.slice(i, i + 10).map(callback));
    cursor = page.docs.at(-1);
  }
}
async function eraseQuery(query) { await eachPage(query, snap => db.recursiveDelete(snap.ref)); }
function mediaPath(value, uid) {
  return typeof value?.path === 'string' && value.path.startsWith(`media/${uid}/`) && value.path.split('/').length === 3 ? value.path : null;
}
async function eraseMedia(value, uid) {
  const path = mediaPath(value, uid);
  if (path) await admin.storage().bucket().file(path).delete({ ignoreNotFound: true });
}
async function cleanPost(id, data) {
  const ref = db.doc('posts/' + id);
  await eachPage(ref.collection('comments'), async snap => { await eraseMedia(snap.data().media, snap.data().authorId); await snap.ref.delete(); });
  await eraseQuery(ref.collection('reactions'));
  await eraseQuery(db.collection('reposts').where('postId', '==', id));
  await eraseQuery(db.collectionGroup('notifications').where('postId', '==', id));
  await eraseQuery(db.collection('reports').where('postId', '==', id));
  await eraseMedia(data.media, data.authorId);
}
async function cleanAccount(uid) {
  // This tombstone also closes direct SDK writes during retries or partial failure.
  await db.doc('accountDeletions/' + uid).set({ status: 'running' }, { merge: true });
  try { await admin.auth().updateUser(uid, { disabled: true }); await admin.auth().revokeRefreshTokens(uid); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  await eachPage(db.collection('posts').where('authorId', '==', uid), async snap => { await cleanPost(snap.id, snap.data()); await snap.ref.delete(); });
  await eachPage(db.collectionGroup('comments').where('authorId', '==', uid), async snap => { await eraseMedia(snap.data().media, uid); await snap.ref.delete(); });
  await eraseQuery(db.collection('reposts').where('authorId', '==', uid));
  await eraseQuery(db.collection('friendships').where('participants', 'array-contains', uid));
  await eachPage(db.collection('conversations').where('participants', 'array-contains', uid), async snap => {
    await eraseQuery(snap.ref.collection('messages').where('senderId', '==', uid));
    // Keep the other participant's messages, with the removed account anonymized in UI.
  });
  await eachPage(db.collection('polls').where('authorId', '==', uid), snap => db.recursiveDelete(snap.ref));
  // Older votes/reactions use the UID as document ID, without an indexed owner field.
  await eachPage(db.collection('polls'), snap => snap.ref.collection('votes').doc(uid).delete());
  await eachPage(db.collection('posts'), snap => snap.ref.collection('reactions').doc(uid).delete());
  await eraseQuery(db.collectionGroup('notifications').where('senderId', '==', uid));
  await eraseQuery(db.collection('reports').where('reporter', '==', uid));
  await eachPage(db.collection('boards').where('ownerId', '==', uid), snap => snap.ref.update({ ownerId: null }));
  await eraseQuery(db.collection('profiles').where('uid', '==', uid));
  await db.recursiveDelete(db.doc('users/' + uid));
  await db.doc('accountPrivate/' + uid).delete();
  await db.doc('scanQuota/' + uid).delete();
  await admin.storage().bucket().deleteFiles({ prefix: `media/${uid}/` });
  try { await admin.auth().deleteUser(uid); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  await db.doc('accountDeletions/' + uid).set({ status: 'complete', completedAt: FieldValue.serverTimestamp() }, { merge: true });
}
module.exports = { eachPage, eraseQuery, eraseMedia, cleanPost, cleanAccount, mediaPath };
