import { ready, state, profile, friendlyError } from './social-api.js';
// A public display card, never a login token or an account-verification assertion.
const preview = document.querySelector('#linkPayload, #chipperLinkJson');
const status = document.querySelector('#linkStatus, #chipperLinkStatus');
const copy = document.querySelector('#btnCopy, #chipperCopyBtn');
const refresh = document.querySelector('#btnRegen, #chipperRegenBtn');
let payload;
async function render() {
  try {
    await ready;
    const id = new URLSearchParams(location.search).get('profile') || state.profile?.id;
    const user = id ? await profile(id) : null;
    if (!user) {
      if (preview) preview.textContent = 'Sign in to share your profile with Chipper.';
      if (status) status.textContent = 'Open your account from the menu to sign in.';
      if (copy) copy.disabled = true;
      return;
    }
    payload = { userId: user.id, handle: user.handle || user.displayName || 'Labrador', displayName: user.displayName || user.username,
      avatarUrl: new URL(user.avatarUrl || '/users/default/pfp.jpg', location.origin).href,
      openUrl: location.origin + '/chipper-link.html?profile=' + encodeURIComponent(user.id) };
    if (preview) preview.textContent = JSON.stringify(payload, null, 2);
    if (status) status.textContent = 'Public profile card ready. Paste the JSON into a compatible Chipper client. No sign-in credentials are included.';
    if (copy) copy.disabled = false;
    const link = document.querySelector('#chipperOpenLink'); if (link) link.href = payload.openUrl;
  } catch (error) { if (status) status.textContent = friendlyError(error); }
}
if (copy) copy.onclick = async () => {
  if (!payload) return;
  try { await navigator.clipboard.writeText(JSON.stringify(payload)); if (status) status.textContent = 'Public profile card copied.'; }
  catch { if (status) status.textContent = 'Select and copy the JSON shown above.'; }
};
if (refresh) refresh.onclick = render;
render();
