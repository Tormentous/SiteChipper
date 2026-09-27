import {auth,friendlyError} from './social-api.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=v=>String(v||'').replace(/([A-Z])/g,' $1');
const stamp=v=>v?new Date(v).toLocaleString():'—';
function targetLink(target){const p=String(target||'').split('/');return p[0]==='polls'?'/polls#poll-'+encodeURIComponent(p[1]):'/post/'+encodeURIComponent(p[1])+(p[2]==='comments'?'#comment-'+encodeURIComponent(p[3]):'');}
export async function staffRequest(action,data={}){
  if(!auth.currentUser)throw Error('Sign in with your staff account.');
  const response=await fetch('/api/staff/moderation',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:JSON.stringify({...data,action})});
  const result=await response.json().catch(()=>({error:'Staff service is unavailable. Check that the Functions deployment is running.'}));
  if(!response.ok)throw Error(result.error||'Staff action failed.');return result;
}
export async function mountStaffPanel(root){
  let session;
  try{session=await staffRequest('session');}catch(error){root.innerHTML=`<header class="social-heading"><h1>Staff workspace</h1></header><p role="status">${esc(friendlyError(error))}</p><a href="/login.html?next=/mod.html">Sign in</a><p>Staff access must be granted by an administrator.</p>`;return;}
  document.body.classList.add('staff-page');
  root.innerHTML=`<header class="social-heading"><p class="social-eyebrow">COOLBRADOR / STAFF</p><h1>Moderation workspace</h1><p>Signed in as ${esc(session.role)}. Claim a case, review the context, and record a reasoned decision.</p></header><nav class="social-actions staff-tabs" aria-label="Staff sections"><button data-tab="queue" aria-pressed="true">Report queue</button><button data-tab="history" aria-pressed="false">Decision history</button><button data-tab="staff" aria-pressed="false">Staff directory</button>${session.role==='admin'?'<button data-tab="staffAudit" aria-pressed="false">Access audit</button>':''}<button id="staffRefresh">Refresh</button></nav><p id="staffStatus" role="status"></p><div id="staffBody"></div>`;
  const status=root.querySelector('#staffStatus'),body=root.querySelector('#staffBody');
  let tab='queue',rows=[],cursor=null,selected=null,viewVersion=0,caseVersion=0,busy=false;
  function mayLeave(){return !body.querySelector('[data-dirty]')||confirm('Discard unsaved case notes or form changes?');}
  function fail(error){status.textContent=friendlyError(error);}
  function lock(value){busy=value;root.querySelectorAll('.staff-tabs button').forEach(b=>b.disabled=value);}
  async function load(more=false){
    if(busy)return;if(!more&&!mayLeave())return;lock(true);status.textContent='Loading…';
    const version=++viewVersion;
    try{const result=await staffRequest(tab,{cursor:more?cursor:null});if(version!==viewVersion)return;
      rows=more?[...new Map([...rows,...result.rows].map(r=>[r.id,r])).values()]:result.rows;cursor=result.cursor;
      if(!more){selected=null;caseVersion++;}render();status.textContent=`${rows.length} records loaded${cursor?' · More available':''}. Counts cover loaded records.`;
    }catch(error){fail(error);}finally{lock(false);}
  }
  function render(){
    if(tab==='queue'||tab==='history'){
      body.innerHTML=`<div class="staff-filters"><label>Search loaded cases<input id="caseSearch" type="search" placeholder="Reference, reason or assignee"></label>${tab==='queue'?'<label>Assignment<select id="caseAssignment"><option value="all">All</option><option value="unassigned">Unassigned</option><option value="mine">Assigned to me</option></select></label><label>Status<select id="caseState"><option value="all">All</option><option>open</option><option>escalated</option></select></label><label>Priority<select id="casePriority"><option value="all">All</option><option>urgent</option><option>high</option><option>normal</option></select></label>':''}</div><div class="staff-workspace"><section aria-label="Cases"><div id="caseList"></div><button id="staffMore" ${cursor?'':'hidden'}>Load more cases</button></section><section id="caseDetail" aria-label="Case details"><p class="social-empty">Choose a case to review.</p></section></div>`;
      const paint=()=>{const term=body.querySelector('#caseSearch').value.toLowerCase(),assignment=body.querySelector('#caseAssignment')?.value,priority=body.querySelector('#casePriority')?.value,state=body.querySelector('#caseState')?.value;
        const filtered=rows.filter(r=>{const w=r.workflow||r;return (!term||[r.id,r.reason,w.assignee].join(' ').toLowerCase().includes(term))&&(!state||state==='all'||w.status===state)&&(!priority||priority==='all'||w.priority===priority)&&(!assignment||assignment==='all'||(assignment==='mine'?w.assignee===session.uid:!w.assignee));});
        body.querySelector('#caseList').innerHTML=filtered.length?filtered.map(r=>{const w=r.workflow||r;return `<button class="staff-case" data-case="${esc(r.id)}" aria-pressed="${r.id===selected}"><strong>${esc(w.priority||'normal')} · ${esc(w.status||'open')}</strong><span>${esc(r.reason||w.ground||'Reported content')}</span><small>${esc(r.id)}<br>${w.assignee===session.uid?'Assigned to you':w.assignee?'Assigned: '+esc(w.assignee):'Unassigned'} · ${esc(stamp(r.createdAt||w.updatedAt))}</small></button>`;}).join(''):'<p>No matching cases in the loaded records.</p>';
        body.querySelectorAll('[data-case]').forEach(button=>{button.onclick=()=>{if(!busy&&mayLeave())showCase(button.dataset.case);};});};
      body.querySelectorAll('.staff-filters input,.staff-filters select').forEach(input=>input.oninput=paint);paint();
      body.querySelector('#staffMore').onclick=()=>{if(mayLeave())load(true);};
    }else if(tab==='staff'){
      body.innerHTML=`<h2>Staff directory</h2><p>Access applies to the staff workspace. Disabling staff access does not delete the person's social account.</p><div class="social-person-grid">${rows.map(r=>`<article class="social-person"><h3>${esc(r.name||r.id)}</h3><p>${esc(r.role)} · ${r.active?'Active':'Disabled'}</p><p class="staff-id">${esc(r.id)}</p>${session.role==='admin'?`<button data-edit-staff="${esc(r.id)}">Edit access</button>`:''}</article>`).join('')||'<p>No staff records. Legacy moderators can still access the queue until an administrator creates their staff record.</p>'}</div><button id="staffMore" ${cursor?'':'hidden'}>Load more staff</button>${session.role==='admin'?'<form id="staffAccess" class="social-compose"><h2>Grant or change staff access</h2><p>The employee must already have an account. Confirm their UID through your company onboarding process.</p><label>Account UID<input name="uid" required maxlength="150"></label><label>Staff display name<input name="name" required maxlength="80"></label><label>Role<select name="role"><option>moderator</option><option>lead</option><option>admin</option></select></label><label class="social-check"><input name="active" type="checkbox" checked>Active staff access</label><button type="submit">Save access</button><p role="status"></p></form>':''}`;
      body.querySelector('#staffMore').onclick=()=>{if(mayLeave())load(true);};
      const form=body.querySelector('#staffAccess');if(form){let version=0;
        form.elements.uid.oninput=()=>{version=0;};
        body.querySelectorAll('[data-edit-staff]').forEach(button=>{button.onclick=()=>{if(!mayLeave())return;const r=rows.find(x=>x.id===button.dataset.editStaff);form.elements.uid.value=r.id;form.elements.name.value=r.name||'';form.elements.role.value=r.role;form.elements.active.checked=r.active;version=r.version||0;delete form.dataset.dirty;form.scrollIntoView({block:'center'});form.elements.name.focus();};});
        bind(form,async data=>{await staffRequest('setStaff',{uid:data.get('uid'),name:data.get('name'),role:data.get('role'),active:!!data.get('active'),version});return 'Staff access updated. Refresh the directory to view the latest records.';});
      }
    }else{
      body.innerHTML='<h2>Staff access audit</h2>'+rows.map(r=>`<article class="social-comment"><p>${esc(stamp(r.createdAt))} · ${esc(r.actor)}</p><p>${esc(r.action)} · ${esc(r.subject)} · ${esc(r.role)} · ${r.active?'Enabled':'Disabled'}</p></article>`).join('')+`<button id="staffMore" ${cursor?'':'hidden'}>Load older events</button>`;
      body.querySelector('#staffMore').onclick=()=>load(true);
    }
    body.querySelectorAll('form').forEach(form=>form.addEventListener('input',()=>{form.dataset.dirty='1';}));
  }
  function bind(form,work){form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;const data=new FormData(form),controls=[...form.elements].map(e=>[e,e.disabled]),message=form.querySelector('[role=status]');
    lock(true);controls.forEach(([e])=>e.disabled=true);form.setAttribute('aria-busy','true');message.textContent='Saving…';
    try{message.textContent=await work(data)||'Saved.';delete form.dataset.dirty;}catch(error){message.textContent=friendlyError(error);}finally{controls.forEach(([e,disabled])=>e.disabled=disabled);form.removeAttribute('aria-busy');lock(false);}
  };}
  async function showCase(caseId){
    selected=caseId;const version=++caseVersion,host=body.querySelector('#caseDetail');if(!host)return;
    host.innerHTML='<p role="status">Loading case…</p>';
    body.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===caseId)));
    try{
      const detail=await staffRequest('detail',{caseId});if(version!==caseVersion||!host.isConnected)return;
      const w=detail.workflow,canManage=session.role!=='moderator'||w.assignee===session.uid,resolved=w.status==='resolved',target=w.target||(detail.report?.pollId?'polls/'+detail.report.pollId:'posts/'+detail.report?.postId+(detail.report?.commentId?'/comments/'+detail.report.commentId:''));
      host.innerHTML=`<h2>Case ${esc(caseId)}</h2><p>${esc(w.priority)} · ${esc(w.status)} · Version ${w.version}</p><p>Assigned to: ${esc(w.assignee||'Nobody')}</p><p><a href="${targetLink(target)}" target="_blank" rel="noopener">Open content in a new tab</a></p><p>${esc(detail.report?.reason||w.reason||'Resolved report')}</p><details><summary>Current content text</summary><p class="social-post-text">${esc(detail.content?.text||detail.content?.title||'Content is unavailable.')}</p></details><div class="social-actions"><button id="reloadCase">Refresh case</button>${!resolved?`<button data-case-action="claim" ${w.assignee&&w.assignee!==session.uid?'disabled':''}>Claim case</button><button data-case-action="release" ${canManage?'':'disabled'}>Release case</button>`:''}</div><p id="caseStatus" role="status"></p>
      ${!resolved?`<form id="triageCase" class="social-compose"><h3>Triage</h3><label>Priority<select name="priority">${['normal','high','urgent'].map(p=>`<option ${p===w.priority?'selected':''}>${p}</option>`).join('')}</select></label><label>Status<select name="status"><option ${w.status==='open'?'selected':''}>open</option><option ${w.status==='escalated'?'selected':''}>escalated</option></select></label><button ${canManage?'':'disabled'}>Save triage</button><p role="status"></p></form>${session.role!=='moderator'?'<form id="assignCase" class="social-compose"><label>Assign to active staff UID<input name="assignee" required maxlength="150"></label><button>Assign case</button><p role="status"></p></form>':''}<form id="noteCase" class="social-compose"><h3>Internal note</h3><p>Visible only to staff. Do not include credentials or copies of illegal media.</p><label>Note<textarea name="note" required maxlength="2000" rows="3"></textarea></label><button ${canManage?'':'disabled'}>Add note</button><p role="status"></p></form><form id="resolveCase" class="social-compose"><h3>Record decision</h3><p>The explanation is shared with the reporter and author. Keep internal notes and reporter identity out of it. Removal is permanent.</p><label>Outcome<select name="outcome"><option value="keep">No removal</option><option value="remove">Remove content</option></select></label><label>Basis<select name="basis"><option>Community rules</option><option>Law</option></select></label><label>Specific rule or law<input name="ground" required maxlength="300"></label><label>Facts and explanation<textarea name="reason" required maxlength="2000" rows="4"></textarea></label><button ${canManage&&(w.status!=='escalated'||session.role!=='moderator')?'':'disabled'}>Record decision</button><p role="status"></p></form>`:''}<h3>Case history</h3><div id="caseEvents"></div><button id="moreEvents" ${detail.cursor?'':'hidden'}>Load older case events</button>`;
      host.querySelector('#reloadCase').onclick=()=>{if(!busy&&mayLeave())showCase(caseId);};
      const act=async(action,data={})=>{await staffRequest(action,{caseId,version:w.version,...data});await showCase(caseId);status.textContent='Case updated. Refresh the queue to update its summary.';};
      host.querySelectorAll('[data-case-action]').forEach(button=>{button.onclick=async()=>{if(busy||!mayLeave())return;lock(true);button.disabled=true;try{await act(button.dataset.caseAction);}catch(error){host.querySelector('#caseStatus').textContent=friendlyError(error);}finally{lock(false);if(button.isConnected)button.disabled=false;}};});
      for(const [selector,action] of [['#triageCase','triage'],['#assignCase','assign'],['#noteCase','note'],['#resolveCase','resolve']]){const form=host.querySelector(selector);if(form)bind(form,async data=>{await act(action,Object.fromEntries(data));});}
      host.querySelectorAll('form').forEach(form=>form.addEventListener('input',()=>{form.dataset.dirty='1';}));
      let eventCursor=detail.cursor;
      const appendEvents=events=>{host.querySelector('#caseEvents').insertAdjacentHTML('beforeend',events.map(e=>`<article class="social-comment"><p><strong>${esc(label(e.action))}</strong> · ${esc(stamp(e.createdAt))}</p><p>Staff: ${esc(e.actor)}</p><p>${esc(e.note||e.reason||[e.status,e.priority,e.assignee].filter(Boolean).join(' · '))}</p></article>`).join(''));};appendEvents(detail.rows);
      host.querySelector('#moreEvents').onclick=async event=>{event.target.disabled=true;try{const page=await staffRequest('detail',{caseId,cursor:eventCursor});if(version!==caseVersion)return;appendEvents(page.rows);eventCursor=page.cursor;event.target.hidden=!eventCursor;}catch(error){host.querySelector('#caseStatus').textContent=friendlyError(error);}finally{event.target.disabled=false;}};
    }catch(error){if(version===caseVersion)host.innerHTML=`<p role="status">${esc(friendlyError(error))}</p>`;}
  }
  root.querySelectorAll('[data-tab]').forEach(button=>{button.onclick=()=>{if(busy||!mayLeave())return;body.querySelectorAll('[data-dirty]').forEach(f=>delete f.dataset.dirty);tab=button.dataset.tab;root.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load();};});
  root.querySelector('#staffRefresh').onclick=()=>load();await load();
}
