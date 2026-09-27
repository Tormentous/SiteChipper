const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { cleanPost, cleanAccount, eraseMedia } = require('./socialCleanup');
const retrying = functions.runWith({ timeoutSeconds: 540, memory: '512MB', failurePolicy: true });

exports.requestAccountDeletion = functions.https.onRequest(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let identity;
  try {
    const token = /^Bearer (.+)$/.exec(req.get('authorization') || '')?.[1];
    if (!token) throw Error('Missing token');
    identity = await admin.auth().verifyIdToken(token, true);
  } catch (_) { return res.status(401).json({ error: 'Sign in again to delete your account.' }); }
  if (Date.now() / 1000 - identity.auth_time > 300) return res.status(401).json({ error: 'Confirm your password again before deleting your account.' });
  if (req.body?.confirmation !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm.' });
  try {
    const ref = admin.firestore().doc('accountDeletions/' + identity.uid);
    await admin.firestore().runTransaction(async tx => {
      if (!(await tx.get(ref)).exists) tx.create(ref, { status: 'pending', requestedAt: FieldValue.serverTimestamp() });
    });
    return res.status(202).json({ accepted: true });
  } catch (_) { return res.status(503).json({ error: 'Could not schedule deletion. Please try again.' }); }
});
exports.deleteSocialAccount = retrying.firestore.document('accountDeletions/{uid}').onCreate((_, context) => cleanAccount(context.params.uid));
exports.cleanupDeletedAuthUser = retrying.auth.user().onDelete(user => cleanAccount(user.uid));
exports.cleanupDeletedPost = retrying.firestore.document('posts/{id}').onDelete((snap, context) => cleanPost(context.params.id, snap.data()));
exports.cleanupDeletedReply = retrying.firestore.document('posts/{postId}/comments/{id}').onDelete(async (snap, context) => {
  await eraseMedia(snap.data().media, snap.data().authorId);
  await require('./socialCleanup').eraseQuery(admin.firestore().collectionGroup('notifications').where('commentId', '==', context.params.id));
  await require('./socialCleanup').eraseQuery(admin.firestore().collection('reports').where('commentId', '==', context.params.id));
});
exports.cleanupDeletedPoll = retrying.firestore.document('polls/{id}').onDelete(async (_, context) => { await admin.firestore().recursiveDelete(admin.firestore().doc('polls/' + context.params.id));await require('./socialCleanup').eraseQuery(admin.firestore().collection('reports').where('pollId','==',context.params.id)); });
