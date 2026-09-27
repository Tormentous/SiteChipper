// Uses only local demo emulators. Run with npm run dev:full active.
const assert=require('node:assert/strict');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.FIREBASE_STORAGE_EMULATOR_HOST='127.0.0.1:9199';
const admin=require('../functions/node_modules/firebase-admin');
admin.initializeApp({projectId:'demo-coolbrador',storageBucket:'demo-coolbrador.appspot.com'});
const uid='deletion-http-smoke', db=admin.firestore(), url='http://127.0.0.1:8000/api/account/delete';
async function request(token,body){return fetch(url,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});}
async function main(){
 await db.doc('accountDeletions/'+uid).delete();await admin.auth().createUser({uid,email:'deletion-http@example.test'});
 const custom=await admin.auth().createCustomToken(uid);
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});
 const {idToken}=await response.json();assert.ok(idToken);
 await db.doc('profiles/deletion-legacy').set({uid,displayName:'Deletion fixture'});
 await db.doc('posts/deletion-http').set({authorId:uid,text:'Delete me',media:{path:'media/'+uid+'/image'}});
 await admin.storage().bucket().file('media/'+uid+'/image').save('synthetic');
 assert.equal((await request(null,{confirmation:'DELETE'})).status,401);
 assert.equal((await request(idToken,{confirmation:'no'})).status,400);
 const pieces=idToken.split('.');const payload=JSON.parse(Buffer.from(pieces[1],'base64url'));payload.auth_time-=600;pieces[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');
 assert.equal((await request(pieces.join('.'),{confirmation:'DELETE'})).status,401);
 assert.equal((await request(idToken,{confirmation:'DELETE'})).status,202);
 const deadline=Date.now()+60000;
 while((await db.doc('accountDeletions/'+uid).get()).data()?.status!=='complete') {if(Date.now()>deadline)throw Error('Deletion trigger did not complete');await new Promise(resolve=>setTimeout(resolve,500));}
 assert.equal((await db.doc('profiles/deletion-legacy').get()).exists,false);assert.equal((await db.doc('posts/deletion-http').get()).exists,false);
 assert.equal((await admin.storage().bucket().file('media/'+uid+'/image').exists())[0],false);
 await assert.rejects(admin.auth().getUser(uid),{code:'auth/user-not-found'});
 console.log('PASS: HTTP authentication, confirmation, recent-login enforcement and asynchronous account deletion trigger.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>admin.app().delete());
