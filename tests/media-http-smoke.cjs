// Only the local authentication, quota and unconfigured-provider paths are tested.
const assert=require('node:assert/strict');process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
const admin=require('../functions/node_modules/firebase-admin');admin.initializeApp({projectId:'demo-coolbrador'});
(async()=>{const uid='media-http-smoke';
 try{
  await admin.firestore().doc('scanQuota/'+uid).delete();await admin.firestore().doc('accountDeletions/'+uid).delete();
  await admin.auth().createUser({uid});const custom=await admin.auth().createCustomToken(uid);
  const login=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});const {idToken}=await login.json();
  const url='http://127.0.0.1:8000/api/media-scan';
  assert.equal((await fetch(url,{method:'POST'})).status,401);
  const options={method:'POST',headers:{Authorization:'Bearer '+idToken}};
  const response=await fetch(url,options);assert.equal(response.status,501);assert.equal((await response.json()).classification,'unconfigured');
  assert.equal((await fetch(url,options)).status,429);
  console.log('PASS: authenticated media proxy, request cooldown, explicit unconfigured-provider response. Upstream scanning not tested.');
 }finally{await admin.auth().deleteUser(uid).catch(()=>{});await admin.app().delete();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
