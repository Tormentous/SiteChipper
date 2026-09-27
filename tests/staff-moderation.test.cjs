const {test,before,after}=require('node:test');const assert=require('node:assert/strict');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const admin=require('../functions/node_modules/firebase-admin');admin.initializeApp({projectId:'demo-staff-workflow'});
const {execute}=require('../functions/src/staffModeration');const db=admin.firestore();
const identity=uid=>({uid,auth_time:Date.now()/1000});
before(async()=>{for(const [uid,role] of [['admin','admin'],['lead','lead'],['mod','moderator'],['second','moderator']])await db.doc('staff/'+uid).set({active:true,role,name:uid,version:1});await admin.auth().createUser({uid:'employee'});});
after(()=>admin.app().delete());
async function report(id){await db.doc('posts/'+id).set({authorId:'author',text:'Fixture'});await db.doc('reports/'+id).set({reporter:'reporter',postId:id,reason:'Review fixture',createdAt:admin.firestore.Timestamp.now()});}
test('staff role boundary rejects members, deactivated legacy claims and privilege escalation',async()=>{
 await assert.rejects(execute(identity('member'),{action:'queue'}),{status:403});
 await db.doc('staff/revoked').set({active:false,role:'moderator'});
 await assert.rejects(execute({...identity('revoked'),moderator:true},{action:'session'}),{status:403});
 assert.equal((await execute({...identity('legacy'),moderator:true},{action:'session'})).role,'moderator');
 await assert.rejects(execute(identity('mod'),{action:'setStaff',uid:'employee',role:'admin',active:true,name:'Employee',version:0}),{status:403});
 await assert.rejects(execute(identity('admin'),{action:'setStaff',uid:'admin',role:'moderator',active:true,name:'Self',version:1}),{status:400});
 await execute(identity('admin'),{action:'setStaff',uid:'employee',role:'moderator',active:true,name:'Employee',version:0});
 await assert.rejects(execute(identity('admin'),{action:'setStaff',uid:'employee',role:'admin',active:true,name:'Employee',version:0}),{status:409});
 assert.equal((await db.doc('staff/employee').get()).get('role'),'moderator');
 assert.equal((await db.collection('staffAudit').get()).size,1);
});
test('competing claims, private notes, escalation and resolution are audited atomically',async()=>{
 await report('case');
 const results=await Promise.allSettled(['mod','second'].map(uid=>execute(identity(uid),{action:'claim',caseId:'case',version:0})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
 const owner=(await db.doc('moderationCases/case').get()).get('assignee'),other=owner==='mod'?'second':'mod';
 await assert.rejects(execute(identity(other),{action:'note',caseId:'case',version:1,note:'Forbidden'}),{status:403});
 await execute(identity(owner),{action:'note',caseId:'case',version:1,note:'Internal investigation detail'});
 await assert.rejects(execute(identity(owner),{action:'release',caseId:'case',version:1}),{status:409});
 await execute(identity(owner),{action:'triage',caseId:'case',version:2,status:'escalated',priority:'urgent'});
 const decision={action:'resolve',caseId:'case',version:3,outcome:'remove',basis:'Community rules',ground:'Threats',reason:'Specific violation facts'};
 await assert.rejects(execute(identity(owner),decision),{status:403});
 await execute(identity('lead'),decision);
 assert.equal((await db.doc('posts/case').get()).exists,false);assert.equal((await db.doc('reports/case').get()).exists,false);
 const workflow=(await db.doc('moderationCases/case').get()).data();assert.equal(workflow.status,'resolved');assert.equal(workflow.resolvedBy,'lead');assert.equal(workflow.version,4);
 assert.equal((await db.collection('moderationCases/case/events').get()).size,4);
 const receipts=await db.collection('moderationDecisions').get();assert.equal(receipts.size,2);
 for(const receipt of receipts.docs){assert.equal(receipt.get('recipients').length,1);assert.ok(!JSON.stringify(receipt.data()).includes('Internal investigation'));}
 await assert.rejects(execute(identity('lead'),decision),{status:409});
});
test('case pages include context and closed history; writes reject malformed references',async()=>{
 await report('next');await execute(identity('mod'),{action:'claim',caseId:'next',version:0});
 await execute(identity('lead'),{action:'assign',caseId:'next',version:1,assignee:'second'});
 const detail=await execute(identity('second'),{action:'detail',caseId:'next'});assert.equal(detail.workflow.assignee,'second');assert.equal(detail.content.text,'Fixture');assert.equal(detail.rows.length,2);
 assert.equal((await execute(identity('lead'),{action:'history'})).rows[0].id,'case');
 await assert.rejects(execute(identity('mod'),{action:'claim',caseId:'bad/path',version:0}),{status:400});
 await assert.rejects(execute(identity('mod'),{action:'queue',cursor:'staff/admin'}),{status:400});
 await execute(identity('admin'),{action:'setStaff',uid:'employee',role:'moderator',active:false,name:'Employee',version:1});
 await assert.rejects(execute({...identity('employee'),moderator:true},{action:'queue'}),{status:403});
});
