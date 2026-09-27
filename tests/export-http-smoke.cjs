// Local synthetic account only; never accepts remote provider endpoints.
const assert=require('node:assert/strict');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const admin=require('../functions/node_modules/firebase-admin');admin.initializeApp({projectId:'demo-coolbrador'});
const uid='export-http-fixture',db=admin.firestore(),url='http://127.0.0.1:8000/api/account/export';
async function request(token){return fetch(url,{method:'POST',headers:token?{Authorization:'Bearer '+token}:{}});}
async function main(){
 await db.doc('accountDeletions/'+uid).delete();await db.doc('exportQuota/'+uid).delete();
 try{await admin.auth().deleteUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;}
 await admin.auth().createUser({uid,email:'export-http@example.test'});
 const custom=await admin.auth().createCustomToken(uid);
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});
 const {idToken}=await response.json();assert.ok(idToken);
 await db.doc('profiles/'+uid).set({uid,displayName:'Export HTTP fixture'});
 assert.equal((await fetch(url)).status,405);
 assert.equal((await request()).status,401);
 const parts=idToken.split('.'),payload=JSON.parse(Buffer.from(parts[1],'base64url'));payload.auth_time-=600;parts[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');
 assert.equal((await request(parts.join('.'))).status,401);
 const result=await request(idToken);assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');
 assert.ok(result.headers.get('content-disposition').includes('attachment'));
 const data=await result.json();assert.equal(data.account.uid,uid);assert.equal(data.records.find(r=>r.path==='profiles/'+uid).data.displayName,'Export HTTP fixture');
 assert.equal((await request(idToken)).status,429);
 console.log('PASS: export route, authentication, recent login, private account selection, no-store and cooldown.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
 await db.doc('profiles/'+uid).delete();await db.doc('exportQuota/'+uid).delete();
 try{await admin.auth().deleteUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;}
 await admin.app().delete();
});
