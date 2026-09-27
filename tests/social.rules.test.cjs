const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, setDoc: rawSetDoc, getDoc, getDocs, addDoc: rawAddDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, runTransaction } = require('firebase/firestore');
const { ref, uploadBytes } = require('firebase/storage');
let env, alice, bob, outsider, guest;
function kindFor(path) {
 const p=path.split('/');
 if(p.length===2)return {posts:'post',polls:'poll',boards:'board',reports:'report',friendships:'friend'}[p[0]];
 if(p[0]==='posts'&&p[2]==='comments')return 'reply';
 if(p[0]==='conversations'&&p[2]==='messages')return 'message';
}
function actor(db) { return db===alice||db===alice?._delegate?'alice':db===bob||db===bob?._delegate?'bob':db===outsider||db===outsider?._delegate?'outsider':null; }
function stamp(batch,db,kind,id) { batch.set(doc(db,'users',actor(db)||'guest','activity',kind),{at:serverTimestamp(),operationId:id}); }
// Existing authorization cases isolate each operation from its rate-limit history.
// Dedicated tests below exercise quota reuse without this fixture reset.
async function setDoc(ref,value) {
 const kind=kindFor(ref.path),uid=actor(ref.firestore);if(!kind)return rawSetDoc(ref,value);
 if(uid)await env.withSecurityRulesDisabled(context=>deleteDoc(doc(context.firestore(),'users',uid,'activity',kind)));
 const batch=writeBatch(ref.firestore);stamp(batch,ref.firestore,kind,ref.id);batch.set(ref,value);return batch.commit();
}
async function addDoc(ref,value) { const target=doc(ref);await setDoc(target,value);return target; }

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
  await assertFails(updateDoc(doc(alice,'profiles','alice'),{avatarPath:'media/bob/stolen'}));
  await assertFails(updateDoc(doc(alice,'profiles','alice'),{searchTokens:'invalid'}));
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
  const batch=writeBatch(bob);stamp(batch,bob,'reply','comment-1');
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

test('reposts require ownership and a matching reaction in the same atomic write', async () => {
  await setDoc(doc(alice,'posts','repost-test'),post('alice'));
  const value={authorId:'bob',profileId:'bob',postId:'repost-test',createdAt:serverTimestamp()};
  await assertFails(setDoc(doc(bob,'reposts','bob__repost-test'),value));
  const batch=writeBatch(bob);
  batch.set(doc(bob,'posts','repost-test','reactions','bob'),{yeah:false,repost:true});
  batch.set(doc(bob,'reposts','bob__repost-test'),value);
  await assertSucceeds(batch.commit());
  assert.equal((await getDoc(doc(guest,'reposts','bob__repost-test'))).data().postId,'repost-test');
  await assertFails(deleteDoc(doc(alice,'reposts','bob__repost-test')));
  await assertSucceeds(deleteDoc(doc(bob,'reposts','bob__repost-test')));
});
test('community creation protects built-ins and editing is owner-only',async()=>{
 const value={name:'Drawing Club',description:'Our drawings',ownerId:'alice',createdAt:serverTimestamp()};
 await assertFails(setDoc(doc(alice,'boards','general'),value));
 await assertSucceeds(setDoc(doc(alice,'boards','drawing-club'),value));
 await assertFails(updateDoc(doc(bob,'boards','drawing-club'),{description:'Hijacked'}));
 await assertSucceeds(setDoc(doc(bob,'posts','custom-board'),{...post('bob'),board:'drawing-club',inGame:false}));
 await assertFails(setDoc(doc(bob,'posts','unknown-board'),{...post('bob'),board:'unknown-board',inGame:false}));
});

test('deletion tombstone locks stale sessions out of all social writes',async()=>{
 await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'accountDeletions','alice'),{status:'pending'}));
 await assertFails(setDoc(doc(alice,'posts','after-delete'),post('alice')));
 await assertFails(updateDoc(doc(alice,'profiles','alice'),{displayName:'Resurrected'}));
 await assertFails(setDoc(doc(alice,'conversations','alice__bob','messages','after-delete'),{senderId:'alice',text:'No',createdAt:serverTimestamp()}));
 await assertFails(uploadBytes(ref(env.authenticatedContext('alice').storage(),'media/alice/after-delete'),new Uint8Array([1]),{contentType:'image/png'}));
 await assertFails(deleteDoc(doc(alice,'accountDeletions','alice')));
 await env.withSecurityRulesDisabled(async context=>deleteDoc(doc(context.firestore(),'accountDeletions','alice')));
});

test('conversation unread state is participant-private and message activity cannot be forged',async()=>{
 const message=doc(bob,'conversations','alice__bob','messages','activity');const batch=writeBatch(bob);
 await env.withSecurityRulesDisabled(context=>deleteDoc(doc(context.firestore(),'users','bob','activity','message')));stamp(batch,bob,'message','activity');
 batch.set(message,{senderId:'bob',text:'New message',createdAt:serverTimestamp()});
 batch.update(doc(bob,'conversations','alice__bob'),{lastMessageId:'activity',lastSenderId:'bob',updatedAt:serverTimestamp()});
 await assertSucceeds(batch.commit());
 await assertFails(updateDoc(doc(alice,'conversations','alice__bob'),{lastSenderId:'bob',lastMessageId:'activity',updatedAt:serverTimestamp()}));
 await assertSucceeds(setDoc(doc(alice,'users','alice','conversationReads','alice__bob'),{readAt:serverTimestamp()}));
 await assertFails(getDoc(doc(bob,'users','alice','conversationReads','alice__bob')));
 await assertFails(setDoc(doc(outsider,'users','outsider','conversationReads','alice__bob'),{readAt:serverTimestamp()}));
});
test('poll owner may close voting permanently and remove a poll, with other owners denied',async()=>{
 await assertFails(updateDoc(doc(bob,'polls','test'),{closedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(doc(alice,'polls','test'),{closedAt:serverTimestamp()}));
 await assertFails(setDoc(doc(alice,'polls','test','votes','alice'),{choice:0,createdAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(alice,'polls','test'),{closedAt:null}));
 await assertFails(deleteDoc(doc(bob,'polls','test')));
 await assertSucceeds(deleteDoc(doc(alice,'polls','test')));
});

test('posting throttles are atomic, cannot be bypassed with direct writes or reset by clients',async()=>{
 await env.withSecurityRulesDisabled(context=>deleteDoc(doc(context.firestore(),'users','alice','activity','post')));
 const first=writeBatch(alice);stamp(first,alice,'post','rate-first');first.set(doc(alice,'posts','rate-first'),post('alice'));await assertSucceeds(first.commit());
 await assertFails(rawSetDoc(doc(alice,'posts','rate-no-stamp'),post('alice')));
 const second=writeBatch(alice);stamp(second,alice,'post','rate-second');second.set(doc(alice,'posts','rate-second'),post('alice'));await assertFails(second.commit());
 await assertFails(deleteDoc(doc(alice,'users','alice','activity','post')));
 await env.withSecurityRulesDisabled(context=>deleteDoc(doc(context.firestore(),'users','alice','activity','post')));
 const bulk=writeBatch(alice);stamp(bulk,alice,'post','bulk-one');bulk.set(doc(alice,'posts','bulk-one'),post('alice'));bulk.set(doc(alice,'posts','bulk-two'),post('alice'));await assertFails(bulk.commit());
});

test('reply and poll reports require a real target and remain moderator-private',async()=>{
 await assertSucceeds(addDoc(collection(bob,'reports'),{reporter:'bob',postId:'reply-test',commentId:'comment-1',reason:'Reply report',createdAt:serverTimestamp()}));
 await assertFails(addDoc(collection(bob,'reports'),{reporter:'bob',postId:'reply-test',commentId:'missing',reason:'Fake reply',createdAt:serverTimestamp()}));
 await setDoc(doc(alice,'polls','reported-poll'),{authorId:'alice',profileId:'alice',title:'Report me',options:['A','B'],board:'General',createdAt:serverTimestamp()});
 await assertSucceeds(addDoc(collection(bob,'reports'),{reporter:'bob',pollId:'reported-poll',reason:'Poll report',createdAt:serverTimestamp()}));
 await assertFails(addDoc(collection(bob,'reports'),{reporter:'bob',pollId:'reported-poll',postId:'shared',reason:'Ambiguous target',createdAt:serverTimestamp()}));
 await assertFails(getDocs(collection(bob,'reports')));
 const mod=env.authenticatedContext('moderator',{moderator:true}).firestore();
 await assertSucceeds(getDocs(collection(mod,'reports')));
 await assertFails(deleteDoc(doc(mod,'posts','reply-test','comments','comment-1')));
 await assertFails(deleteDoc(doc(mod,'polls','reported-poll')));
});

test('friends feeds may query author batches without making friendships public',async()=>{
 const {orderBy,limit}=require('firebase/firestore');
 await assertSucceeds(getDocs(query(collection(alice,'posts'),where('authorId','in',['bob']),orderBy('createdAt','desc'),limit(30))));
 await assertSucceeds(getDocs(query(collection(alice,'posts'),where('board','==','BeeSid'),where('authorId','in',['bob']),orderBy('createdAt','desc'),limit(30))));
 await assertFails(getDocs(collection(guest,'friendships')));
});

test('reporters see only their reports and decision recipients cannot forge or alter outcomes',async()=>{
 const mod=env.authenticatedContext('decision-mod',{moderator:true}).firestore();
 const ownQuery=query(collection(bob,'reports'),where('reporter','==','bob'));
 assert.ok((await assertSucceeds(getDocs(ownQuery))).size>0);
 await assertFails(getDocs(query(collection(alice,'reports'),where('reporter','==','bob'))));
 const decision={recipients:['bob'],reportId:'report-reference',target:'posts/shared',action:'keep',basis:'Community rules',ground:'No breach',reason:'Reviewed context; no rule violation found.',createdAt:serverTimestamp()};
 await assertFails(setDoc(doc(bob,'moderationDecisions','forged'),decision));
 await assertFails(setDoc(doc(mod,'moderationDecisions','private-outcome'),decision));
 await env.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'moderationDecisions','private-outcome'),decision));
 await assertSucceeds(getDoc(doc(bob,'moderationDecisions','private-outcome')));
 await assertFails(getDoc(doc(alice,'moderationDecisions','private-outcome')));
 await assertFails(getDoc(doc(guest,'moderationDecisions','private-outcome')));
 await assertSucceeds(getDocs(query(collection(bob,'moderationDecisions'),where('recipients','array-contains','bob'))));
 await assertFails(getDocs(collection(bob,'moderationDecisions')));
 await assertFails(updateDoc(doc(bob,'moderationDecisions','private-outcome'),{reason:'changed'}));
 await assertFails(deleteDoc(doc(bob,'moderationDecisions','private-outcome')));
 await assertFails(setDoc(doc(mod,'moderationDecisions','blank-reason'),{...decision,reason:''}));
 const batch=writeBatch(mod);
 batch.set(doc(mod,'moderationDecisions','atomic-removal'),{...decision,action:'remove'});
 batch.delete(doc(mod,'posts','shared'));
 await assertFails(batch.commit());
 assert.equal((await getDoc(doc(guest,'posts','shared'))).exists(),true);
});

test('staff cannot bypass audited server workflows or elevate their own role',async()=>{
 const mod=env.authenticatedContext('workflow-mod',{moderator:true}).firestore();
 await assertFails(setDoc(doc(mod,'staff','workflow-mod'),{role:'admin',active:true}));
 await assertFails(setDoc(doc(mod,'moderationCases','case'),{assignee:'workflow-mod'}));
 await assertFails(getDocs(collection(mod,'staffAudit')));
 await assertFails(deleteDoc(doc(mod,'posts','shared')));
 const reports=await getDocs(collection(mod,'reports'));assert.ok(reports.size>0);
 await assertFails(deleteDoc(doc(mod,'reports',reports.docs[0].id)));
 await env.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'staff','workflow-mod'),{active:false,role:'moderator'}));
 await assertFails(getDocs(collection(mod,'reports')));
 await assertFails(setDoc(doc(mod,'chipper','feed'),{payload:'{}'}));
});
