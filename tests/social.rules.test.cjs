const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, runTransaction } = require('firebase/firestore');
const { ref, uploadBytes } = require('firebase/storage');
let env, alice, bob, outsider, guest;
const profile = uid => ({uid, displayName:uid,bio:'',avatarUrl:'/users/default/pfp.jpg',createdAt:serverTimestamp()});
const post = uid => ({authorId:uid,profileId:uid,board:'BeeSid',text:'Hello Chipper',media:null,inGame:true,createdAt:serverTimestamp(),editedAt:null});
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-coolbrador-tests',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});
  await env.clearFirestore();
  alice=env.authenticatedContext('alice').firestore(); bob=env.authenticatedContext('bob').firestore(); outsider=env.authenticatedContext('outsider').firestore(); guest=env.unauthenticatedContext().firestore();
  await setDoc(doc(alice,'profiles','alice'),profile('alice')); await setDoc(doc(bob,'profiles','bob'),profile('bob'));
});
after(async () => { await env.cleanup(); });
test('profiles: owner-only updates, no private email or impersonation', async () => {
  await assertSucceeds(getDoc(doc(guest,'profiles','alice')));
  await assertFails(setDoc(doc(guest,'profiles','anon'),profile('anon')));
  await assertFails(setDoc(doc(outsider,'profiles','somebody-else'),profile('outsider')));
  await assertFails(updateDoc(doc(bob,'profiles','alice'),{displayName:'Hijacked'}));
  await assertFails(updateDoc(doc(alice,'profiles','alice'),{uid:'bob'}));
  await assertFails(updateDoc(doc(alice,'profiles','alice'),{email:'private@example.test'}));
  await assertFails(updateDoc(doc(alice,'profiles','alice'),{avatarUrl:'javascript:alert(1)'}));
  await assertSucceeds(updateDoc(doc(alice,'profiles','alice'),{displayName:'Alice',bio:'Chipper player'}));
  assert.equal((await getDoc(doc(bob,'profiles','alice'))).data().displayName,'Alice');
});
test('posts: shared persistence and immutable attribution', async () => {
  await assertFails(setDoc(doc(guest,'posts','anonymous'),post('alice')));
  await assertFails(setDoc(doc(bob,'posts','forged'),{...post('bob'),profileId:'alice'}));
  await assertFails(setDoc(doc(alice,'posts','oversized'),{...post('alice'),text:'x'.repeat(2001)}));
  await assertSucceeds(setDoc(doc(alice,'posts','shared'),post('alice')));
  assert.equal((await getDoc(doc(bob,'posts','shared'))).data().text,'Hello Chipper');
  await assertSucceeds(getDoc(doc(guest,'posts','shared')));
  await assertFails(updateDoc(doc(bob,'posts','shared'),{text:'Stolen',editedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'posts','shared'),{authorId:'bob'}));
  await assertSucceeds(updateDoc(doc(alice,'posts','shared'),{text:'Edited',editedAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(bob,'posts','shared')));
});
test('concurrent reactions preserve both users and prohibit spoofing', async () => {
  await setDoc(doc(alice,'posts','reactions'),post('alice'));
  await Promise.all([setDoc(doc(alice,'posts','reactions','reactions','alice'),{yeah:true,repost:false}),setDoc(doc(bob,'posts','reactions','reactions','bob'),{yeah:true,repost:false})]);
  assert.equal((await getDocs(collection(guest,'posts','reactions','reactions'))).size,2);
  await assertFails(setDoc(doc(alice,'posts','reactions','reactions','bob'),{yeah:false,repost:false}));
  await assertFails(setDoc(doc(bob,'posts','missing','reactions','bob'),{yeah:true,repost:false}));
});
test('reply + notification batch is private and cannot be forged', async () => {
  await setDoc(doc(alice,'posts','reply-test'),post('alice'));
  const batch=writeBatch(bob);
  batch.set(doc(bob,'posts','reply-test','comments','comment-1'),{authorId:'bob',profileId:'bob',text:'Nice!',media:null,createdAt:serverTimestamp()});
  const note={senderId:'bob',profileId:'bob',kind:'reply',postId:'reply-test',commentId:'comment-1',text:'Nice!',read:false,createdAt:serverTimestamp()};
  batch.set(doc(bob,'users','alice','notifications','comment-1'),note);
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(alice,'users','alice','notifications','comment-1')));
  await assertFails(getDoc(doc(bob,'users','alice','notifications','comment-1')));
  await assertFails(setDoc(doc(bob,'users','alice','notifications','fake'),{...note,commentId:'fake'}));
  await assertSucceeds(updateDoc(doc(alice,'users','alice','notifications','comment-1'),{read:true}));
  await assertFails(deleteDoc(doc(outsider,'posts','reply-test','comments','comment-1')));
});
test('friend requests require recipient acceptance and participant access', async () => {
  await assertSucceeds(setDoc(doc(alice,'friendships','alice__bob'),{participants:['alice','bob'],requester:'alice',status:'pending',createdAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'friendships','alice__bob'),{status:'accepted'}));
  await assertFails(getDoc(doc(outsider,'friendships','alice__bob')));
  await assertSucceeds(updateDoc(doc(bob,'friendships','alice__bob'),{status:'accepted'}));
  await assertSucceeds(getDocs(query(collection(bob,'friendships'),where('participants','array-contains','bob'))));
  await assertFails(updateDoc(doc(bob,'friendships','alice__bob'),{participants:['bob','outsider']}));
});
test('DMs persist across participants, prohibit outsiders and forged senders', async () => {
  const thread={participants:['alice','bob'],createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(alice,'conversations','alice__bob'),thread));
  await assertFails(getDoc(doc(outsider,'conversations','alice__bob')));
  await assertFails(setDoc(doc(alice,'conversations','duplicate'),thread));
  await assertSucceeds(setDoc(doc(alice,'conversations','alice__bob','messages','one'),{senderId:'alice',text:'Hi Bob',createdAt:serverTimestamp()}));
  assert.equal((await getDoc(doc(bob,'conversations','alice__bob','messages','one'))).data().text,'Hi Bob');
  await assertFails(getDoc(doc(outsider,'conversations','alice__bob','messages','one')));
  await assertFails(getDocs(collection(guest,'conversations','alice__bob','messages')));
  await assertFails(setDoc(doc(bob,'conversations','alice__bob','messages','forged'),{senderId:'alice',text:'Forged',createdAt:serverTimestamp()}));
  await assertSucceeds(getDocs(query(collection(bob,'conversations'),where('participants','array-contains','bob'))));
});
test('blocking is enforced on message, reply, reaction and friend writes', async () => {
  await setDoc(doc(alice,'posts','block-test'),post('alice'));
  await setDoc(doc(alice,'users','alice','blocks','bob'),{createdAt:serverTimestamp()});
  await assertFails(getDocs(collection(bob,'users','alice','blocks')));
  await assertFails(setDoc(doc(bob,'conversations','alice__bob','messages','blocked'),{senderId:'bob',text:'No',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(bob,'posts','block-test','comments','blocked'),{authorId:'bob',profileId:'bob',text:'No',media:null,createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(bob,'posts','block-test','reactions','bob'),{yeah:true,repost:false}));
  await deleteDoc(doc(alice,'friendships','alice__bob'));
  await assertFails(setDoc(doc(bob,'friendships','alice__bob'),{participants:['alice','bob'],requester:'bob',status:'pending',createdAt:serverTimestamp()}));
  await deleteDoc(doc(alice,'users','alice','blocks','bob'));
});
test('polls: immutable single vote, valid options, no ballot stuffing', async () => {
  await assertSucceeds(setDoc(doc(alice,'polls','test'),{authorId:'alice',profileId:'alice',title:'Next game?',options:['Chipper','Drawing'],board:'General',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(bob,'polls','test','votes','alice'),{choice:0,createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(bob,'polls','test','votes','bob'),{choice:8,createdAt:serverTimestamp()}));
  await assertSucceeds(setDoc(doc(bob,'polls','test','votes','bob'),{choice:1,createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(bob,'polls','test','votes','bob'),{choice:0,createdAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(bob,'polls','test','votes','bob')));
  await assertSucceeds(getDocs(collection(guest,'polls','test','votes')));
});
test('only moderators may publish the Chipper feed; reports cannot expose others', async () => {
  await assertFails(setDoc(doc(guest,'chipper','feed'),{payload:'{}'}));
  await assertFails(setDoc(doc(alice,'chipper','feed'),{payload:'{}'}));
  await assertSucceeds(setDoc(doc(env.authenticatedContext('mod',{moderator:true}).firestore(),'chipper','feed'),{payload:'{}'}));
  await assertSucceeds(addDoc(collection(bob,'reports'),{reporter:'bob',postId:'shared',reason:'Test report',createdAt:serverTimestamp()}));
  await assertFails(getDocs(collection(alice,'reports')));
});
test('media: authenticated owner, size/type validation and public reads', async () => {
  const owner=env.authenticatedContext('alice').storage(), other=env.authenticatedContext('bob').storage(), anon=env.unauthenticatedContext().storage();
  await assertSucceeds(uploadBytes(ref(owner,'media/alice/image'),new Uint8Array([1,2,3]),{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(other,'media/alice/other'),new Uint8Array([1]),{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(anon,'media/alice/anon'),new Uint8Array([1]),{contentType:'image/png'}));
  await assertFails(uploadBytes(ref(owner,'media/alice/script'),new Uint8Array([1]),{contentType:'text/html'}));
  await assertFails(uploadBytes(ref(owner,'media/alice/huge'),new Uint8Array(10*1024*1024+1),{contentType:'image/png'}));
});
