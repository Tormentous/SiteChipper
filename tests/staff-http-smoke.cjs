const assert=require('node:assert/strict');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const admin=require('../functions/node_modules/firebase-admin');admin.initializeApp({projectId:'demo-coolbrador'});
const db=admin.firestore(),uid='staff-http-fixture',caseId='staff-http-case';
async function request(token,body){return fetch('http://localhost:8000/api/staff/moderation',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});}
async function main(){
 await db.doc('accountDeletions/'+uid).delete();await admin.auth().createUser({uid});
 const custom=await admin.auth().createCustomToken(uid);
 const response=await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});const {idToken}=await response.json();assert.ok(idToken);
 assert.equal((await request(null,{action:'queue'})).status,401);assert.equal((await request(idToken,{action:'queue'})).status,403);
 await db.doc('staff/'+uid).set({role:'moderator',active:true,name:'HTTP fixture',version:1});
 assert.equal((await request(idToken,{action:'session'})).status,200);
 await db.doc('posts/'+caseId).set({authorId:'fixture-author',text:'Synthetic review fixture'});
 await db.doc('reports/'+caseId).set({reporter:'fixture-reporter',postId:caseId,reason:'Synthetic report',createdAt:admin.firestore.Timestamp.now()});
 assert.equal((await request(idToken,{action:'claim',caseId,version:0})).status,200);
 assert.equal((await request(idToken,{action:'note',caseId,version:0,note:'stale'})).status,409);
 assert.equal((await request(idToken,{action:'note',caseId,version:1,note:'Private fixture note'})).status,200);
 assert.equal((await request(idToken,{action:'resolve',caseId,version:2,outcome:'keep',basis:'Community rules',ground:'No breach',reason:'Synthetic content reviewed and allowed.'})).status,200);
 const detail=await (await request(idToken,{action:'detail',caseId})).json();assert.equal(detail.workflow.status,'resolved');assert.equal(typeof detail.rows[0].createdAt,'string');assert.equal(detail.rows.length,3);
 await db.doc('staff/'+uid).update({active:false});assert.equal((await request(idToken,{action:'queue'})).status,403);
 console.log('PASS: staff HTTP authentication, role checks, claim, stale conflict, internal note, private decision, ISO timestamps and immediate access revocation.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
 for(const path of ['posts/'+caseId,'reports/'+caseId,'staff/'+uid,'moderationCases/'+caseId])await db.recursiveDelete(db.doc(path));
 const receipts=await db.collection('moderationDecisions').where('reportId','==',caseId).get();for(const r of receipts.docs)await r.ref.delete();
 try{await admin.auth().deleteUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;}await admin.app().delete();
});
