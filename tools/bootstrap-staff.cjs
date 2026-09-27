#!/usr/bin/env node
// Trusted operator bootstrap only. Dry run by default; explicit project/account required.
const admin=require('../functions/node_modules/firebase-admin');
const projectId=process.env.GCLOUD_PROJECT,uid=process.argv.find(x=>x.startsWith('--uid='))?.slice(6);
if(!projectId||!uid||uid.includes('/'))throw Error('Set GCLOUD_PROJECT and --uid=<existing-account-uid>.');
admin.initializeApp({projectId});
async function main(){
 await admin.auth().getUser(uid);
 const db=admin.firestore(),admins=await db.collection('staff').where('role','==','admin').where('active','==',true).get();
 if(!admins.empty)throw Error('An administrator already exists. Manage staff through the workspace.');
 if(!process.argv.includes('--apply')){console.log('Dry run: existing account verified; no active administrator. Add --apply to grant first administrator.');return;}
 await db.runTransaction(async tx=>{
   const lock=db.doc('staffBootstrap/initial'),snapshot=await tx.get(lock);
   if(snapshot.exists)throw Error('Bootstrap has already been used. A trusted operator must review recovery.');
   tx.create(lock,{uid,createdAt:admin.firestore.FieldValue.serverTimestamp()});
   tx.set(db.doc('staff/'+uid),{role:'admin',active:true,name:'Initial administrator',version:1,updatedAt:admin.firestore.FieldValue.serverTimestamp(),updatedBy:'operator-bootstrap'});
   tx.create(db.collection('staffAudit').doc(),{actor:'operator-bootstrap',subject:uid,action:'bootstrap',role:'admin',active:true,createdAt:admin.firestore.FieldValue.serverTimestamp()});
 });console.log('Initial staff administrator created. Sign in and open /mod.html.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>admin.app().delete());
