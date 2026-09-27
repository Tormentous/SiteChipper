const {test}=require('node:test');const assert=require('node:assert/strict');const {execFileSync}=require('node:child_process');const admin=require('../functions/node_modules/firebase-admin');
test('search backfill is explicit, dry-run by default, repeatable and excludes contacts',async()=>{
 const app=admin.initializeApp({projectId:'demo-search-index'},'search-index'),db=app.firestore();
 try{
 await db.doc('profiles/legacy').set({displayName:'River Labrador',bio:'Drawing club',email:'private-contact@example.test'});
 await db.doc('posts/legacy').set({text:'A tiny Chipper drawing'});
 const run=(args=[])=>execFileSync(process.execPath,['tools/index-social-search.mjs',...args],{env:{...process.env,GCLOUD_PROJECT:'demo-search-index',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'},encoding:'utf8'});
 assert.match(run(),/Would index 2/);assert.equal((await db.doc('profiles/legacy').get()).data().searchTokens,undefined);
 assert.match(run(['--apply']),/Indexed 2/);assert.match(run(),/Would index 0/);
 const profile=(await db.doc('profiles/legacy').get()).data();assert.deepEqual(profile.searchTokens,['river','labrador','drawing','club']);assert.equal(profile.email,'private-contact@example.test');
 const found=await db.collection('posts').where('searchTokens','array-contains','chipper').get();assert.equal(found.size,1);
 }finally{await app.delete();}
});
