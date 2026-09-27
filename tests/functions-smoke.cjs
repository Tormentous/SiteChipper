// Run against `npm run dev:full`. All traffic and fixtures are forced to local emulators.
const assert = require('node:assert/strict');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({projectId:'demo-coolbrador'});
async function main() {
 const db=admin.firestore(), original=await db.doc('chipper/feed').get();
 const owner='http-smoke-owner', id='http-smoke-post';
 const feedURL='http://127.0.0.1:8000/api/chipper-game-board-feed';
 const bucket=admin.storage().bucket('coolbrador.firebasestorage.app');
 const files=['chipper/chipper_game_board_feed.json','chipper/BeeSid.json'];
 const originals=await Promise.all(files.map(async path=>{const file=bucket.file(path);return (await file.exists())[0]?(await file.download())[0]:null;}));
 const publisher='http://127.0.0.1:5001/demo-coolbrador/us-central1/publishChipperFeed';
 try {
  await db.doc('profiles/'+owner).set({uid:owner,displayName:'Game smoke player',avatarUrl:'/users/default/pfp.jpg'});
  await db.doc('posts/'+id).set({authorId:owner,profileId:owner,board:'BeeSid',text:'A shared game-feed smoke post',media:null,inGame:true,createdAt:admin.firestore.Timestamp.now()});
  await db.doc('posts/'+id+'/reactions/test').set({yeah:true,repost:false});
  await db.doc('chipper/feed').set({payload:JSON.stringify({board:'chipper-game-board',version:7,sensitivity:{chipperDefault:'hide'},posts:[{id:'curated-smoke',body:'Preserved archive'}]}),board:JSON.stringify({board:'BeeSid',posts:[]})});
  const response=await fetch(feedURL); assert.equal(response.status,200);
  const feed=await response.json(), shared=feed.posts.find(p=>p.boardPostId===id);
  assert.ok(shared); assert.equal(shared.body,'A shared game-feed smoke post'); assert.equal(shared.yeahs,1);
  assert.equal(shared.url,'https://coolbrador.com/post/'+id); assert.ok(feed.posts.some(p=>p.id==='curated-smoke'));
  const legacy=await (await fetch('http://127.0.0.1:8000/data/chipper_game_board_feed.json')).json();
  assert.deepEqual(legacy.posts.map(p=>p.id),feed.posts.map(p=>p.id));
  const board=await (await fetch('http://127.0.0.1:8000/api/beesid-board')).json(); assert.ok(board.posts.some(p=>p.boardPostId===id));
  const rejected=await fetch(publisher,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pin:'coolbrador',feed:{posts:[]},board:{posts:[]}})});
  assert.equal(rejected.status,401);
  const token=await admin.auth().createCustomToken(owner);
  const login=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,returnSecureToken:true})});
  const identity=await login.json(); assert.ok(identity.idToken);
  const nonModerator=await fetch(publisher,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+identity.idToken},body:JSON.stringify({feed:{posts:[]},board:{posts:[]}})});
  assert.equal(nonModerator.status,403);
  const moderatorToken=await admin.auth().createCustomToken(owner,{moderator:true});
  const moderatorLogin=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:moderatorToken,returnSecureToken:true})});
  const moderator=await moderatorLogin.json();
  const published=await fetch(publisher,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+moderator.idToken},body:JSON.stringify({feed:{board:'chipper-game-board',posts:[{id:'authorized-smoke',body:'Moderator curated post'}]},board:{board:'BeeSid',posts:[]}})});
  assert.equal(published.status,200); assert.equal((await published.json()).postCount,1);
  console.log('PASS: live shared/curated game feed, legacy alias, board mirror, anonymous and non-moderator publisher rejection, authorized moderator publishing.');
 } finally {
  await Promise.all(files.map((path,i)=>originals[i] ? bucket.file(path).save(originals[i],{metadata:{contentType:'application/json'}}) : bucket.file(path).delete({ignoreNotFound:true})));
  if(original.exists) await original.ref.set(original.data()); else await db.doc('chipper/feed').delete();
  await db.doc('posts/'+id+'/reactions/test').delete(); await db.doc('posts/'+id).delete(); await db.doc('profiles/'+owner).delete();
  await admin.auth().deleteUser(owner).catch(()=>{}); await admin.app().delete();
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
