import { auth, watchAuth, friendlyError } from './social-api.js';
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
