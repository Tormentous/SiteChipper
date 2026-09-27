const functions=require('firebase-functions');
const admin=require('firebase-admin');
const {FieldValue,FieldPath}=require('firebase-admin/firestore');
if(!admin.apps.length)admin.initializeApp();
const db=admin.firestore();
const roles=['moderator','lead','admin'];
function problem(status,message){return Object.assign(Error(message),{status});}
function id(value){if(typeof value!=='string'||!value||value.length>150||value.includes('/'))throw problem(400,'Invalid record reference.');return value;}
function text(value,max,label){if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw problem(400,`${label} is required (maximum ${max} characters).`);return value.trim();}
function roleFor(identity,snapshot){if(snapshot.exists)return snapshot.get('active')===true&&roles.includes(snapshot.get('role'))?snapshot.get('role'):null;return identity.moderator===true?'moderator':null;}
async function requireStaff(identity,tx){
 const get=ref=>tx?tx.get(ref):ref.get();
 const [staff,deletion]=await Promise.all([get(db.doc('staff/'+identity.uid)),get(db.doc('accountDeletions/'+identity.uid))]);
 const role=roleFor(identity,staff);if(!role||deletion.exists)throw problem(403,'Active staff access is required.');return role;
}
function targetFor(report){return report.pollId?'polls/'+id(report.pollId):'posts/'+id(report.postId)+(report.commentId?'/comments/'+id(report.commentId):'');}
function jsonValue(value){if(value?.toDate)return value.toDate().toISOString();if(Array.isArray(value))return value.map(jsonValue);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,jsonValue(v)]));return value;}
function row(snap){return {id:snap.id,...snap.data()};}
async function page(query,cursor){
 if(cursor){const snap=await query.firestore.doc(cursor).get();if(!snap.exists)throw problem(409,'The page changed. Refresh the list.');query=query.startAfter(snap);}
 const snap=await query.limit(51).get(),docs=snap.docs.slice(0,50);
 return {rows:docs.map(row),cursor:snap.size>50?docs.at(-1).ref.path:null};
}
function cursorFor(value,prefix){if(value==null)return null;if(typeof value!=='string'||!value.startsWith(prefix+'/')||value.slice(prefix.length+1).includes('/'))throw problem(400,'Invalid page cursor.');return value;}
async function execute(identity,input={}){
 const role=await requireStaff(identity),action=input.action;
 if(action==='session')return {uid:identity.uid,role};
 if(action==='queue'){
   const result=await page(db.collection('reports').orderBy('createdAt','asc'),cursorFor(input.cursor,'reports'));
   const cases=await Promise.all(result.rows.map(r=>db.doc('moderationCases/'+r.id).get()));
   return {...result,rows:result.rows.map((r,i)=>({...r,workflow:cases[i].exists?cases[i].data():{status:'open',priority:'normal',assignee:null,version:0}}))};
 }
 if(action==='history')return page(db.collection('moderationCases').where('status','==','resolved').orderBy('updatedAt','desc'),cursorFor(input.cursor,'moderationCases'));
 if(action==='staff')return page(db.collection('staff').orderBy(FieldPath.documentId()),cursorFor(input.cursor,'staff'));
 if(action==='detail'){
   const caseId=id(input.caseId),[report,workflow,events]=await Promise.all([db.doc('reports/'+caseId).get(),db.doc('moderationCases/'+caseId).get(),page(db.collection('moderationCases/'+caseId+'/events').orderBy('createdAt','desc'),cursorFor(input.cursor,'moderationCases/'+caseId+'/events'))]);
   if(!report.exists&&!workflow.exists)throw problem(404,'Case not found.');
   const target=report.exists?targetFor(report.data()):workflow.get('target');
   const content=target?await db.doc(target).get():null;
   return {report:report.exists?row(report):null,workflow:workflow.exists?row(workflow):{id:caseId,status:'open',priority:'normal',assignee:null,version:0},content:content?.exists?row(content):null,...events};
 }
 if(action==='setStaff'){
   if(!Number.isFinite(identity.auth_time)||Date.now()/1000-identity.auth_time>300)throw problem(401,'Sign in again before changing staff access.');
   if(role!=='admin')throw problem(403,'Only administrators can manage staff.');
   const uid=id(input.uid);if(uid===identity.uid)throw problem(400,'Ask another administrator to change your own staff access.');
   if(!roles.includes(input.role)||typeof input.active!=='boolean')throw problem(400,'Select a valid role and access state.');
   // Require an existing real Auth account; this endpoint never creates accounts or sends invites.
   try{await admin.auth().getUser(uid);}catch(error){if(error.code==='auth/user-not-found')throw problem(404,'That account does not exist. Ask the employee to create an account first.');throw error;}
   const label=text(input.name,80,'Staff display name');
   await db.runTransaction(async tx=>{
     const currentRole=await requireStaff(identity,tx);if(currentRole!=='admin')throw problem(403,'Only administrators can manage staff.');
     const ref=db.doc('staff/'+uid),old=await tx.get(ref);
     if((old.get('version')||0)!==input.version)throw problem(409,'Staff access changed. Refresh and try again.');
     tx.set(ref,{role:input.role,active:input.active,name:label,version:input.version+1,updatedAt:FieldValue.serverTimestamp(),updatedBy:identity.uid});
     tx.create(db.collection('staffAudit').doc(),{actor:identity.uid,subject:uid,action:'setStaff',role:input.role,active:input.active,createdAt:FieldValue.serverTimestamp()});
   });return {ok:true};
 }
 if(action==='staffAudit'){
   if(role!=='admin')throw problem(403,'Administrator access is required.');
   return page(db.collection('staffAudit').orderBy('createdAt','desc'),cursorFor(input.cursor,'staffAudit'));
 }
 if(!['claim','release','assign','triage','note','resolve'].includes(action))throw problem(400,'Unknown staff action.');
 const caseId=id(input.caseId),caseRef=db.doc('moderationCases/'+caseId),reportRef=db.doc('reports/'+caseId);
 await db.runTransaction(async tx=>{
   const currentRole=await requireStaff(identity,tx),lead=currentRole!=='moderator';
   const [reportSnap,caseSnap]=await Promise.all([tx.get(reportRef),tx.get(caseRef)]);
   if(!reportSnap.exists)throw problem(409,'This case is already resolved or no longer available. Refresh the queue.');
   const report=reportSnap.data(),target=targetFor(report),current=caseSnap.data()||{status:'open',priority:'normal',assignee:null,version:0};
   if(!Number.isInteger(input.version)||current.version!==input.version)throw problem(409,'Another staff member updated this case. Refresh it before acting.');
   const patch={target,updatedAt:FieldValue.serverTimestamp(),version:current.version+1};
   const event={actor:identity.uid,action,createdAt:FieldValue.serverTimestamp()};
   if(action==='claim'){
     if(current.assignee&&current.assignee!==identity.uid)throw problem(409,'This case is assigned to another staff member.');
     patch.assignee=identity.uid;
   }else{
     if(action!=='assign'&&current.assignee!==identity.uid&&!lead)throw problem(403,'Claim this case before changing it.');
     if(action==='release')patch.assignee=null;
     if(action==='assign'){
       if(!lead)throw problem(403,'Only leads and administrators can assign another staff member.');
       const assigned=id(input.assignee),staff=await tx.get(db.doc('staff/'+assigned));
       if(!staff.exists||staff.get('active')!==true||!roles.includes(staff.get('role')))throw problem(400,'Choose an active staff member.');
       patch.assignee=assigned;event.assignee=assigned;
     }
     if(action==='triage'){
       if(!['normal','high','urgent'].includes(input.priority)||!['open','escalated'].includes(input.status))throw problem(400,'Invalid case status or priority.');
       if(current.status==='escalated'&&input.status==='open'&&!lead)throw problem(403,'A lead must clear an escalation.');
       patch.priority=input.priority;patch.status=input.status;event.priority=input.priority;event.status=input.status;
     }
     if(action==='note')event.note=text(input.note,2000,'Internal note');
     if(action==='resolve'){
       if(current.status==='escalated'&&!lead)throw problem(403,'Escalated cases require a lead decision.');
       if(!['keep','remove'].includes(input.outcome)||!['Community rules','Law'].includes(input.basis))throw problem(400,'Invalid decision.');
       const ground=text(input.ground,300,'Rule or law'),reason=text(input.reason,2000,'Explanation');
       const content=await tx.get(db.doc(target));
       if(input.outcome==='remove'&&!content.exists)throw problem(409,'The content is already unavailable. Record a no-removal decision.');
       const recipients=[...new Set([report.reporter,content.get('authorId')].filter(v=>typeof v==='string'&&v))];
       for(const recipient of recipients)tx.create(db.collection('moderationDecisions').doc(),{recipients:[recipient],reportId:caseId,target,action:input.outcome,basis:input.basis,ground,reason,createdAt:FieldValue.serverTimestamp()});
       if(input.outcome==='remove')tx.delete(db.doc(target));
       tx.delete(reportRef);patch.status='resolved';patch.outcome=input.outcome;patch.basis=input.basis;patch.ground=ground;patch.reason=reason;patch.resolvedBy=identity.uid;
       event.outcome=input.outcome;event.basis=input.basis;event.ground=ground;event.reason=reason;
     }
   }
   tx.set(caseRef,{...current,...patch});tx.create(caseRef.collection('events').doc(),event);
 });return {ok:true};
}
exports.execute=execute;exports.roleFor=roleFor;exports.requireStaff=requireStaff;
exports.staffModeration=functions.runWith({timeoutSeconds:60,memory:'256MB'}).https.onRequest(async(req,res)=>{
 res.set('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
 let identity;try{const token=/^Bearer (.+)$/.exec(req.get('authorization')||'')?.[1];if(!token)throw Error();identity=await admin.auth().verifyIdToken(token,true);}catch{return res.status(401).json({error:'Sign in again to use the staff workspace.'});}
 try{return res.json(jsonValue(await execute(identity,req.body)));}catch(error){return res.status(error.status||503).json({error:error.status?error.message:'Could not finish the staff action. Please retry.'});}
});
