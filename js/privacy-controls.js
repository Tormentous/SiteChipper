import { readFeedPreferences } from './feed-ranking.mjs';
import { auth, watchAuth, friendlyError, loadBoards, BOARDS } from './social-api.js';
import { MUTED_KEY, normalizeMuted, readMuted } from './content-preferences.mjs';
const form = document.querySelector('#mutedWordsForm');
form.elements.mutedWords.value = readMuted().join('\n');
form.onsubmit = event => {
  event.preventDefault();
  try {
    const words = normalizeMuted(form.elements.mutedWords.value);
    localStorage.setItem(MUTED_KEY, words.join('\n'));
    form.elements.mutedWords.value = words.join('\n');
    form.querySelector('[role=status]').textContent = `Saved ${words.length} muted words or phrases on this device.`;
  } catch { form.querySelector('[role=status]').textContent = 'Your browser could not save this preference. Check device storage and try again.'; }
};
const host = document.querySelector('#dataControls');
watchAuth(state => {
  host.innerHTML = state.user ? '<h3>Download your data</h3><p>Download a JSON copy of your profile, posts, replies, votes, relationships, reports and messages you sent. Media links are included; image and video files are not bundled. Keep the download private. Service logs and backups require a separate access request.</p><button id="downloadAccount">Download account data</button><p role="status"></p>' : '<p><a href="/login.html?next=/settings#privacyControls">Sign in to download your data.</a></p>';
  const button = host.querySelector('button'); if (!button) return;
  button.onclick = async () => {
    button.disabled = true; host.querySelector('[role=status]').textContent = 'Preparing your download…';
    try {
      const response = await fetch('/api/account/export', { method: 'POST', headers: { Authorization: 'Bearer ' + await auth.currentUser.getIdToken() } });
      if (!response.ok) throw Error((await response.json()).error || 'Could not prepare the download.');
      const blob = await response.blob(), url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'coolbrador-account-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      host.querySelector('[role=status]').textContent = 'Download prepared. Check your browser downloads.';
    } catch (error) { host.querySelector('[role=status]').textContent = friendlyError(error); }
    finally { button.disabled = false; }
  };
});

try{await loadBoards();}catch{document.querySelector('#feedPreferencesForm [role=status]').textContent='Some communities could not be loaded. Refresh to retry.';}
watchAuth(state=>{
  const key='cb_feed_'+(state.user?.uid||'guest'),form=document.querySelector('#feedPreferencesForm');
  let prefs;try{prefs=readFeedPreferences(localStorage,key);}catch{prefs={interests:[],seen:{}};}
  const host=document.querySelector('#feedInterests');host.replaceChildren();
  for(const board of BOARDS){const label=document.createElement('label');label.className='social-check';const input=document.createElement('input');input.type='checkbox';input.name='interest';input.value=board;input.checked=prefs.interests.includes(board);label.append(input,document.createTextNode(board));host.append(label);}
  form.onsubmit=event=>{event.preventDefault();try{const current=readFeedPreferences(localStorage,key);current.interests=new FormData(form).getAll('interest').slice(0,30);localStorage.setItem(key,JSON.stringify(current));form.querySelector('[role=status]').textContent='Interests saved. Choose For you in the feed to use them.';}catch{form.querySelector('[role=status]').textContent='Could not save preferences on this device.';}};
  document.querySelector('#resetFeed').onclick=()=>{try{localStorage.removeItem(key);form.querySelectorAll('input').forEach(input=>input.checked=false);form.querySelector('[role=status]').textContent='Interests and seen history cleared.';}catch{form.querySelector('[role=status]').textContent='Could not clear preferences.';}};
});
