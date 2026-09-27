import { watchAuth, watchOwnReports, watchDecisions, friendlyError } from './social-api.js';
const form = document.querySelector('#legalNotice'), draft = document.querySelector('#noticeDraft');
form.elements.url.value = new URLSearchParams(location.search).get('url') || '';
form.elements.childSafety.onchange = () => {
  form.elements.name.required = form.elements.email.required = !form.elements.childSafety.checked;
};
form.onsubmit = event => {
  event.preventDefault();
  const data = new FormData(form);
  const text = ['Suspected illegal content on Coolbrador', '', 'Exact URL: ' + data.get('url'),
    'Explanation: ' + data.get('explanation'), '', 'Name or organisation: ' + (data.get('name') || '(omitted)'),
    'Reply email: ' + (data.get('email') || '(omitted)'),
    'Child sexual abuse/exploitation notice: ' + (data.get('childSafety') ? 'yes' : 'no'),
    'I believe in good faith that the information and allegations in this notice are accurate and complete.'
  ].join('\n');
  document.querySelector('#noticeText').value = text;
  document.querySelector('#sendNotice').href = 'mailto:support@coolbrador.com?subject=Illegal%20content%20notice&body=' + encodeURIComponent(text);
  draft.hidden = false;
  form.querySelector('[role=status]').textContent = 'Draft ready. It has not been sent. Open your email app or copy the notice to send it.';
  document.querySelector('#noticeText').focus();
};
document.querySelector('#copyNotice').onclick = async () => {
  try { await navigator.clipboard.writeText(document.querySelector('#noticeText').value); draft.querySelector('[role=status]').textContent = 'Copied. Email the notice to support@coolbrador.com to submit it.'; }
  catch { draft.querySelector('[role=status]').textContent = 'Select the draft above and copy it manually.'; document.querySelector('#noticeText').select(); }
};
const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const host = document.querySelector('#myDecisions');
let stops=[];
watchAuth(state => {
  stops.splice(0).forEach(stop=>stop());
  if (!state.user) {host.innerHTML='<p><a href="/login.html?next=/safety.html%23decisions">Sign in to see your reports and decisions.</a> You can use the email route above without an account.</p>';return;}
  host.innerHTML='<div id="pendingReports"></div><div id="decisionList"></div>';
  const pending=host.querySelector('#pendingReports'),decisions=host.querySelector('#decisionList');
  stops.push(watchOwnReports(rows=>{
    pending.innerHTML='<h3>Pending reports</h3>'+(rows.length?rows.map(row=>`<p>Report ${escape(row.id)} · Awaiting review<br>${escape(row.reason)}</p>`).join(''):'<p>No pending reports.</p>');
  },error=>{pending.textContent=friendlyError(error);}));
  stops.push(watchDecisions(rows=>{
    rows.sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
    decisions.innerHTML='<h3>Decisions</h3>'+(rows.length?rows.map(row=>`<article class="social-comment"><h4>${row.action==='remove'?'Content removed':'No removal'}</h4><p>Reference: ${escape(row.id)}</p><p>Basis: ${escape(row.basis)} · ${escape(row.ground)}</p><p>${escape(row.reason)}</p><p>${row.action==='remove'?'Removal applies throughout the service and has no scheduled expiry.':'No content restriction was applied.'} Decision made by a human moderator following a report.</p><p><a href="mailto:support@coolbrador.com?subject=${encodeURIComponent('Review decision '+row.id)}">Ask for a review</a></p></article>`).join(''):'<p>No decisions to show.</p>');
  },error=>{decisions.textContent=friendlyError(error);}));
});
