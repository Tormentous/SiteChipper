import * as api from './social-api.js';
const root = document.querySelector('#socialRoot');
const page = document.body.dataset.page;
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => {
  try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
const profileUrl = id => '/users/' + encodeURIComponent(id);
const postUrl = id => '/post/' + encodeURIComponent(id);
const loginUrl = () => '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
const userName = p => p?.displayName || p?.username || 'Labrador';
const timeLabel = value => {
  const t = api.timestamp(value);
  return t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
};
const time = value => `<time datetime="${api.timestamp(value) ? new Date(api.timestamp(value)).toISOString() : ''}">${escape(timeLabel(value))}</time>`;
const avatar = p => `<img class="social-avatar" src="${escape(safeUrl(p?.avatarUrl || '/users/default/pfp.jpg'))}" alt="" loading="lazy">`;
const empty = (title, description = '', action = '') => `<div class="social-empty"><h2>${escape(title)}</h2><p>${escape(description)}</p>${action}</div>`;
const options = value => api.BOARDS.map(b => `<option${b === value ? ' selected' : ''}>${b}</option>`).join('');
let friends = [], blocks = [], people = [], feedRender = () => {}, disposers = [], cardDisposers = [];
const posts = new Map();
let booted = false;
const notice = document.createElement('div');
notice.className = 'social-toast'; notice.setAttribute('role', 'status'); notice.hidden = true;
document.body.append(notice);
function toast(message) { notice.textContent = message; notice.hidden = false; clearTimeout(notice.timer); notice.timer = setTimeout(() => { notice.hidden = true; }, 6000); }
function failure(error) { toast(api.friendlyError(error)); }
function requireUser() {
  if (api.state.profile) return true;
  location.assign(loginUrl()); return false;
}
function heading(title, description = '') { return `<header class="social-heading"><p class="social-eyebrow">COOLBRADOR / ${escape(title)}</p><h1>${escape(title)}</h1><p>${escape(description)}</p></header>`; }
function gate() { root.innerHTML = heading('Your pack is waiting') + empty('Sign in to continue', 'Connect with friends, share posts, and join the conversation.', `<a class="social-primary" href="${loginUrl()}">Sign in or create an account</a>`); }
function bindForm(form, handler) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.busy || !requireUser()) return;
    form.dataset.busy = '1'; form.setAttribute('aria-busy', 'true');
    const button = form.querySelector('[type=submit]');
    const label = button.textContent; button.disabled = true; button.textContent = 'Saving…';
    const status = form.querySelector('[role=status]');
    try { if (status) status.textContent = ''; await handler(new FormData(form)); }
    catch (error) { if (status) status.textContent = api.friendlyError(error); else failure(error); }
    finally { delete form.dataset.busy; form.removeAttribute('aria-busy'); button.disabled = false; button.textContent = label; }
  });
}
function composer(board = '', reply = null) {
  const container = document.createElement('section'); container.className = 'social-compose';
  if (!api.state.profile) { container.innerHTML = `<p><a href="${loginUrl()}">Sign in</a> to ${reply ? 'reply' : 'share a post with the pack'}.</p>`; return container; }
  const draftKey = `cb_draft_${api.state.user.uid}_${reply?.id || board || 'feed'}`;
  container.innerHTML = `<form><label class="social-compose-label">${reply ? 'Add a reply' : 'What’s happening in your world?'}<textarea name="body" maxlength="2000" rows="3" placeholder="${reply ? 'Keep the conversation going…' : 'A thought, a drawing, a moment from Chipper…'}" ${reply ? 'required' : ''}></textarea></label>
    <div class="social-attachment" hidden></div><div class="social-compose-tools">
    ${reply ? '' : `<label class="social-file">＋ Add media<input name="media" type="file" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"></label>`}
    ${board || reply ? `<span class="social-muted">${reply ? 'Replies are public' : 'Posting to ' + escape(board)}</span>` : `<label class="social-board-picker">Community<select name="board">${options('General')}</select></label>`}
    <span class="social-counter" aria-live="off">0 / 2000</span><button type="submit" class="social-primary">${reply ? 'Reply' : 'Post'}</button></div><p role="status"></p></form>`;
  const form = container.querySelector('form'), textarea = form.elements.body;
  try { textarea.value = localStorage.getItem(draftKey) || ''; } catch (_) {}
  function remember() { container.querySelector('.social-counter').textContent = textarea.value.length + ' / 2000'; try { localStorage.setItem(draftKey, textarea.value); } catch (_) {} }
  remember(); textarea.oninput = remember;
  const file = form.elements.media, preview = container.querySelector('.social-attachment');
  let objectUrl;
  if (file) file.onchange = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const selected = file.files[0]; preview.replaceChildren(); preview.hidden = !selected;
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) { file.value = ''; preview.hidden = true; toast('Choose media under 10 MB.'); return; }
    objectUrl = URL.createObjectURL(selected);
    const el = document.createElement(selected.type.startsWith('video/') ? 'video' : 'img');
    el.src = objectUrl; el.alt = 'Attachment preview'; if (el.tagName === 'VIDEO') el.controls = true;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove attachment';
    remove.onclick = () => { file.value = ''; preview.hidden = true; URL.revokeObjectURL(objectUrl); preview.replaceChildren(); };
    preview.append(el, remove);
  };
  bindForm(form, async data => {
    const body = String(data.get('body') || '').trim();
    if (!body && !file?.files.length) throw new Error('Write something or attach a photo or video.');
    const selected = file?.files[0];
    if (selected && window.CoolbradorMediaSafety) {
      const result = await window.CoolbradorMediaSafety.scan(selected, body);
      if (result?.ok === false) throw new Error('This attachment could not be accepted. Please choose another file.');
    }
    const media = selected ? await api.upload(selected) : null;
    if (reply) await api.comment(reply, body); else await api.createPost({ body, media, board: board || data.get('board') });
    textarea.value = ''; if (file) file.value = ''; preview.hidden = true; preview.replaceChildren();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    remember(); toast(reply ? 'Reply posted.' : 'Your post is live.');
  });
  return container;
}
function mediaHTML(media) {
  if (!media?.url || !safeUrl(media.url)) return '';
  const url = escape(safeUrl(media.url));
  return media.type === 'video' ? `<video class="social-media" src="${url}" controls preload="metadata" playsinline></video>` : `<a href="${url}" target="_blank" rel="noopener"><img class="social-media" src="${url}" alt="Post attachment" loading="lazy"></a>`;
}
function postCard(post, detailed = false) {
  posts.set(post.id, post);
  const el = document.createElement('article'); el.className = 'social-post'; el.dataset.postId = post.id;
  const own = post.authorId === api.state.user?.uid;
  el.innerHTML = `${post._repost ? `<p class="social-muted">↻ <a href="${profileUrl(post._repost.profileId)}">${escape(post._repost.name)}</a> reposted</p>` : ''}<header class="social-post-head"><a class="social-author" href="${profileUrl(post.profileId)}">${avatar()}<strong>Loading profile…</strong></a><a class="social-board-tag" href="/b/${encodeURIComponent(post.board)}">${escape(post.board)}${post.inGame ? ' · In-game' : ''}</a>
    <details class="social-menu"><summary aria-label="Post options">•••</summary><div><button data-action="share" data-id="${escape(post.id)}">Copy link</button>${own ? `<button data-action="edit" data-id="${escape(post.id)}">Edit post</button><button data-action="delete" data-id="${escape(post.id)}">Delete post</button>` : `<button data-action="report" data-id="${escape(post.id)}">Report post</button><button data-action="block" data-id="${escape(post.id)}">Block author</button>`}</div></details></header>
    <a class="social-post-time" href="${postUrl(post.id)}">${time(post.createdAt)}${post.editedAt ? ' · edited' : ''}</a><p class="social-post-text">${escape(post.text)}</p>${mediaHTML(post.media)}
    <footer class="social-post-actions"><button data-action="yeah" data-id="${escape(post.id)}" aria-pressed="false">♡ Yeah! <span>0</span></button><a href="${postUrl(post.id)}${detailed ? '#reply' : ''}">↩ Reply</a><button data-action="repost" data-id="${escape(post.id)}" aria-pressed="false">↻ Repost <span>0</span></button><button data-action="share" data-id="${escape(post.id)}">↗ Share</button></footer>`;
  api.profile(post.profileId).then(p => {
    if (!p) { el.querySelector('.social-author strong').textContent = 'Former member'; return; }
    el.querySelector('.social-author').innerHTML = avatar(p) + `<strong>${escape(userName(p))}</strong>`;
  }).catch(() => { el.querySelector('.social-author strong').textContent = 'Member'; });
  cardDisposers.push(api.watchReactions(post.id, reactions => {
    for (const kind of ['yeah','repost']) {
      const btn = el.querySelector(`[data-action=${kind}]`);
      btn.querySelector('span').textContent = reactions.filter(r => r[kind]).length;
      btn.setAttribute('aria-pressed', String(reactions.some(r => r.id === api.state.user?.uid && r[kind])));
    }
  }, () => {}));
  return el;
}
function disposeCards() { cardDisposers.splice(0).forEach(fn => fn()); }
async function confirmDialog(title, label, value, multiline = false) {
  const dialog = document.createElement('dialog'); dialog.className = 'social-dialog';
  dialog.innerHTML = `<form method="dialog"><h2>${escape(title)}</h2>${label ? `<label>${escape(label)}${multiline ? `<textarea name="value" rows="5" maxlength="2000" required>${escape(value || '')}</textarea>` : `<p>${escape(value || '')}</p>`}</label>` : ''}<div class="social-actions"><button value="cancel">Cancel</button><button class="social-primary" value="confirm">Confirm</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => { const result = dialog.returnValue === 'confirm' ? multiline ? dialog.querySelector('textarea').value : true : null; dialog.remove(); resolve(result); }, { once: true }));
}
root.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]'); if (!button || button.disabled) return;
  const { action, id } = button.dataset, post = posts.get(id);
  if (!post) return;
  if (action !== 'share' && !requireUser()) return;
  button.disabled = true;
  try {
    if (action === 'share') {
      const url = location.origin + postUrl(id);
      try { await navigator.clipboard.writeText(url); toast('Post link copied.'); } catch { await confirmDialog('Link to this post', 'Copy this URL', url); }
    } else if (['yeah','repost'].includes(action)) { await api.react(id, action); if (action === 'repost') toast('Repost updated.'); }
    else if (action === 'delete') { if (await confirmDialog('Delete this post?', 'This cannot be undone.', '')) await api.removePost(id); }
    else if (action === 'edit') { const value = await confirmDialog('Edit post', 'Post text', post.text, true); if (value !== null) await api.editPost(id, value); }
    else if (action === 'report') { const reason = await confirmDialog('Report post', 'Tell the moderators what is wrong', '', true); if (reason !== null) { await api.report(post, reason); toast('Report submitted for review.'); } }
    else if (action === 'block') { if (await confirmDialog('Block this person?', 'Their posts will be hidden and they will be unable to message you.', '')) { await api.block(post.authorId, true); toast('Person blocked. Manage blocks in Friends.'); } }
  } catch (error) { failure(error); } finally { button.disabled = false; }
});
function boardGrid() {
  return `<nav class="social-boards" aria-label="Communities">${api.BOARDS.map((b,i) => `<a href="/b/${b}"><span aria-hidden="true">${['✦','🎮','☾','🌱','🌎','⚑','🎁','🌾'][i]}</span><strong>${b}</strong><small>${b === 'BeeSid' ? 'The Chipper game board' : 'Join the conversation'}</small></a>`).join('')}</nav>`;
}
function renderFeed(board, authorId) {
  const host = root.querySelector('#liveFeed');
  let current = [], reposts = [], stop, stopReposts, generation = 0, count = 30;
  const load = root.querySelector('#loadMore');
  feedRender = () => {
    disposeCards(); host.replaceChildren();
    let filtered = [...current, ...reposts].filter(p => !blocks.includes(p.authorId) && !blocks.includes(p._repost?.authorId));
    filtered.sort((a,b) => api.timestamp(b._repost?.createdAt || b.createdAt)-api.timestamp(a._repost?.createdAt || a.createdAt));
    if (root.querySelector('[data-feed="friends"][aria-selected="true"]')) {
      const ids = friends.filter(f => f.status === 'accepted').flatMap(f => f.participants);
      filtered = filtered.filter(p => ids.includes(p._repost?.authorId || p.authorId) && (p._repost?.authorId || p.authorId) !== api.state.user?.uid);
    }
    const term = (root.querySelector('#feedSearch')?.value || '').toLowerCase().trim();
    if (term) filtered = filtered.filter(p => p.text.toLowerCase().includes(term) || p.board.toLowerCase().includes(term));
    if (!filtered.length) host.innerHTML = empty('A fresh start', term ? 'No matching posts in this page. Load more or try another search.' : 'Share the first post, explore a community, or find people to follow.', '<a href="/friends.html">Discover people →</a>');
    else filtered.forEach(p => host.append(postCard(p)));
  };
  function subscribe() {
    stop?.(); host.setAttribute('aria-busy', 'true');
    stop = api.watchPosts({ board, authorId, count }, rows => { current = rows; host.removeAttribute('aria-busy'); load.hidden = rows.length < count; feedRender(); }, error => {
      host.removeAttribute('aria-busy'); host.innerHTML = empty('Could not load posts', api.friendlyError(error), '<button id="retryFeed">Try again</button>'); host.querySelector('#retryFeed').onclick = subscribe;
    });
  }
  load.onclick = () => { count += 30; subscribe(); };
  root.querySelector('#feedSearch')?.addEventListener('input', feedRender);
  root.querySelectorAll('[data-feed]').forEach(tab => { tab.onclick = () => {
    if (tab.dataset.feed === 'friends' && !requireUser()) return;
    root.querySelectorAll('[data-feed]').forEach(el => { el.setAttribute('aria-selected', String(el === tab)); el.tabIndex = el === tab ? 0 : -1; });
    feedRender();
  }; });
  stopReposts = api.watchReposts({authorId, count: 100}, async entries => {
    const currentGeneration = ++generation;
    const shared = await Promise.all(entries.map(async r => {
      const p = await api.getPost(r.postId).catch(() => null);
      if (!p || board && p.board !== board) return null;
      const sharer = await api.profile(r.profileId).catch(() => null);
      return { ...p, _repost: { ...r, name: userName(sharer) } };
    }));
    if (currentGeneration !== generation) return;
    reposts = shared.filter(Boolean); feedRender();
  }, failure);
  disposers.push(() => { stop?.(); stopReposts?.(); generation++; }); subscribe();
}
async function feedPage(board) {
  const title = board || (page === 'home' ? 'Your corner of the cosmos' : 'Community');
  root.innerHTML = heading(title, board === 'BeeSid' ? 'The Miiverse-style home for Chipper moments, drawings, and in-game discoveries.' : 'Small moments. Big conversations. A place for the whole pack.') +
    (page === 'home' || !board ? boardGrid() : '') +
    `<div id="composer"></div>${board === 'BeeSid' ? '<aside class="social-callout">🎮 Posts on this board are marked for Chipper. <a href="?archive=1">Explore the original game feed →</a></aside>' : ''}
    <div class="social-feed-toolbar"><div role="tablist" aria-label="Feed"><button role="tab" data-feed="latest" aria-selected="true">Latest</button><button role="tab" data-feed="friends" aria-selected="false" tabindex="-1">Friends</button></div><label>Search posts<input id="feedSearch" type="search" placeholder="Find a conversation"></label></div><section id="liveFeed" aria-label="Posts"><p>Loading posts…</p></section><button id="loadMore" class="social-load" hidden>Load more posts</button>`;
  root.querySelector('#composer').append(composer(board)); renderFeed(board);
}
async function threadPage() {
  const id = decodeURIComponent(location.pathname.split('/')[2] || '');
  root.innerHTML = `<a href="/community.html">← Back to community</a><section id="threadPost"><p>Loading post…</p></section><section id="threadComments" aria-label="Replies"></section><div id="reply"></div>`;
  let stopComments, mounted = false;
  disposers.push(api.watchPost(id, post => {
    disposeCards(); const target = root.querySelector('#threadPost'); target.replaceChildren();
    if (!post) { target.innerHTML = empty('Post not found', 'It may have been deleted or the link is incorrect.'); root.querySelector('#reply').replaceChildren(); root.querySelector('#threadComments').replaceChildren(); stopComments?.(); return; }
    target.append(postCard(post, true));
    if (!mounted) {
      mounted = true; root.querySelector('#reply').append(composer('', post));
      stopComments = api.watchComments(id, async comments => {
        const container = root.querySelector('#threadComments');
        const cards = await Promise.all(comments.map(async c => {
          const p = await api.profile(c.profileId).catch(() => null);
          if (blocks.includes(c.authorId)) return '';
          return `<article class="social-comment" id="comment-${escape(c.id)}"><a class="social-author" href="${profileUrl(c.profileId)}">${avatar(p)}<strong>${escape(userName(p))}</strong></a>${time(c.createdAt)}<p>${escape(c.text)}</p>${mediaHTML(c.media)}${api.state.user?.uid === c.authorId || api.state.user?.uid === post.authorId ? `<button data-delete-comment="${escape(c.id)}">Delete reply</button>` : ''}</article>`;
        }));
        container.innerHTML = `<h2>Replies (${comments.length}${comments.length === 200 ? '+' : ''})</h2>` + (cards.join('') || '<p class="social-muted">Start the conversation.</p>');
        container.querySelectorAll('[data-delete-comment]').forEach(button => { button.onclick = async () => { if (await confirmDialog('Delete reply?', '', '')) { try { await api.removeComment(id, button.dataset.deleteComment); } catch (error) { failure(error); } } }; });
      }, failure);
    }
  }, error => { root.querySelector('#threadPost').innerHTML = empty('Could not load post', api.friendlyError(error)); }));
  disposers.push(() => stopComments?.());
}
async function peoplePage() {
  root.innerHTML = heading('Find your pack', 'Real people, shared interests, and conversations that carry on.') + `<label class="social-search">Search people<input id="peopleSearch" type="search" placeholder="Search by display name"></label><div id="requests"></div><h2>Your friends</h2><div id="friendList" class="social-person-grid"></div><h2>Discover people</h2><div id="peopleList" class="social-person-grid"><p>Loading people…</p></div><div id="blockedList"></div>`;
  people = await api.people();
  function paint() {
    const query = root.querySelector('#peopleSearch').value.toLowerCase();
    const accepted = friends.filter(f => f.status === 'accepted').flatMap(f => f.participants);
    const pending = friends.filter(f => f.status === 'pending' && f.requester !== api.state.user?.uid && !blocks.includes(f.requester));
    root.querySelector('#requests').innerHTML = pending.length ? `<h2>Friend requests</h2>${pending.map(f => `<div class="social-request"><span>${escape(userName(people.find(p => p.uid === f.requester)))}</span><button data-accept="${escape(f.id)}">Accept</button><button data-remove="${escape(f.id)}">Decline</button></div>`).join('')}` : '';
    for (const [id, isFriend] of [['friendList',true],['peopleList',false]]) {
      const list = people.filter(p => p.uid !== api.state.user?.uid && !blocks.includes(p.uid) && accepted.includes(p.uid) === isFriend && userName(p).toLowerCase().includes(query));
      root.querySelector('#' + id).innerHTML = list.length ? list.map(p => {
        const relation = friends.find(f => f.participants.includes(p.uid));
        return `<article class="social-person"><a class="social-author" href="${profileUrl(p.id)}">${avatar(p)}<strong>${escape(userName(p))}</strong></a><p>${escape(p.bio || 'Member of the pack')}</p><div class="social-actions">${relation ? `<button data-remove="${escape(relation.id)}">${relation.status === 'accepted' ? 'Remove friend' : 'Cancel request'}</button>` : `<button data-add="${escape(p.uid)}">Add friend</button>`}<button data-message="${escape(p.uid)}">Message</button></div></article>`;
      }).join('') : `<p class="social-muted">${isFriend ? 'No friends yet. Find someone below and send a request.' : 'No people match your search.'}</p>`;
    }
    root.querySelector('#blockedList').innerHTML = blocks.length ? `<h2>Blocked people</h2>${blocks.map(id => `<div class="social-request"><span>${escape(userName(people.find(p => p.uid === id)))}</span><button data-unblock="${escape(id)}">Unblock</button></div>`).join('')}` : '';
    root.querySelectorAll('[data-accept],[data-add],[data-remove],[data-message],[data-unblock]').forEach(button => { button.onclick = async () => {
      if (!requireUser()) return; button.disabled = true;
      try {
        const d = button.dataset;
        if (d.accept) await api.acceptFriend(d.accept);
        if (d.add) { await api.requestFriend(d.add); toast('Friend request sent.'); }
        if (d.remove) await api.removeFriend(d.remove);
        if (d.unblock) await api.block(d.unblock, false);
        if (d.message) location.assign('/messages?thread=' + encodeURIComponent(await api.openConversation(d.message)));
      } catch (error) { failure(error); } finally { button.disabled = false; }
    }; });
  }
  feedRender = paint; root.querySelector('#peopleSearch').oninput = paint; paint();
}
async function profilePage() {
  const id = decodeURIComponent(location.pathname.split('/')[2] || api.state.profile?.id || '');
  const p = await api.profile(id);
  if (!p) { root.innerHTML = heading('Profile') + empty('Profile not found', 'This profile may be an archived demo or its link may be incorrect.', '<a href="/friends.html">Discover people →</a>'); return; }
  const own = p.uid === api.state.user?.uid;
  root.innerHTML = `<header class="social-profile">${avatar(p)}<div><p class="social-eyebrow">MEMBER OF THE PACK</p><h1>${escape(userName(p))}</h1><p class="social-bio">${escape(p.bio || 'A little corner of the Coolbrador cosmos.')}</p><small>Joined ${escape(timeLabel(p.createdAt))}</small></div></header><div class="social-actions">${own ? '<button id="editProfile">Edit profile</button><a href="/settings">Customize appearance</a>' : '<button id="profileFriend">Add friend</button><button id="profileMessage">Message</button>'}</div><div id="profileEditor"></div><h2>Posts</h2><section id="liveFeed"></section><button id="loadMore" class="social-load" hidden>Load more posts</button>`;
  renderFeed(undefined, p.uid);
  if (own) root.querySelector('#editProfile').onclick = () => {
    const editor = root.querySelector('#profileEditor');
    editor.innerHTML = `<form class="social-compose"><label>Display name<input name="displayName" maxlength="48" required value="${escape(userName(p))}"></label><label>Bio<textarea name="bio" maxlength="500" rows="3">${escape(p.bio)}</textarea></label><label>Profile photo<input name="avatar" type="file" accept="image/png,image/jpeg,image/gif,image/webp"></label><div class="social-actions"><button type="button" id="cancelProfile">Cancel</button><button type="submit" class="social-primary">Save profile</button></div><p role="status"></p></form>`;
    editor.querySelector('#cancelProfile').onclick = () => editor.replaceChildren();
    bindForm(editor.querySelector('form'), async data => {
      const file = data.get('avatar');
      const media = file?.size ? await api.upload(file) : null;
      await api.saveProfile({ displayName: data.get('displayName'), bio: data.get('bio'), avatarUrl: media?.url });
      location.reload();
    });
    editor.querySelector('input').focus();
  };
  else {
    const friend = root.querySelector('#profileFriend');
    function update() { const relation = friends.find(f => f.participants.includes(p.uid)); friend.textContent = relation ? relation.status === 'accepted' ? 'Friends ✓' : 'Request pending' : 'Add friend'; friend.disabled = !!relation || blocks.includes(p.uid); }
    const renderPosts = feedRender; feedRender = () => { renderPosts(); update(); }; update();
    friend.onclick = async () => { if (requireUser()) { try { await api.requestFriend(p.uid); } catch (error) { failure(error); } } };
    root.querySelector('#profileMessage').onclick = async () => { if (requireUser()) { try { location.assign('/messages?thread=' + encodeURIComponent(await api.openConversation(p.uid))); } catch (error) { failure(error); } } };
  }
}
async function messagesPage() {
  if (!api.state.profile) return gate();
  people = await api.people();
  root.innerHTML = heading('Messages', 'A quieter corner for conversations with your pack.') + `<div class="social-inbox"><aside><a href="/friends.html">＋ New conversation</a><nav id="conversationList" aria-label="Conversations"></nav></aside><section id="conversation"><div class="social-empty"><h2>Choose a conversation</h2><p>Start a message from someone’s profile or the people directory.</p></div></section></div>`;
  let active = new URLSearchParams(location.search).get('thread'), stopMessages, threadRows = [];
  function select(id) {
    if (!threadRows.some(t => t.id === id)) { root.querySelector('#conversation').innerHTML = empty('Conversation unavailable', 'Choose a conversation you belong to.'); return; }
    active = id; history.replaceState(null, '', '?thread=' + encodeURIComponent(id)); stopMessages?.();
    const thread = threadRows.find(t => t.id === id), otherId = thread.participants.find(uid => uid !== api.state.user.uid);
    const other = people.find(p => p.uid === otherId);
    const pane = root.querySelector('#conversation');
    pane.innerHTML = `<header class="social-chat-head"><a href="${profileUrl(other?.id || otherId)}">${escape(userName(other))}</a><span class="social-muted">Private conversation</span></header><div id="messageLog" class="social-message-log" role="log" aria-label="Messages" aria-live="polite"></div><form class="social-chat-compose"><label>Message<textarea name="message" rows="2" maxlength="2000" required placeholder="Write a message…"></textarea></label><button type="submit" class="social-primary">Send</button><p role="status"></p></form>`;
    const form = pane.querySelector('form');
    bindForm(form, async data => { await api.sendMessage(id, data.get('message')); form.elements.message.value = ''; form.elements.message.focus(); });
    stopMessages = api.watchMessages(id, messages => {
      const log = pane.querySelector('#messageLog');
      const nearEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 80 || !log.children.length;
      log.innerHTML = messages.length ? messages.map(m => `<article class="social-message${m.senderId === api.state.user.uid ? ' is-own' : ''}"><p>${escape(m.text)}</p>${time(m.createdAt)}</article>`).join('') : '<p class="social-muted">Say hello to start the conversation.</p>';
      if (nearEnd) log.scrollTop = log.scrollHeight;
    }, error => { pane.querySelector('[role=status]').textContent = api.friendlyError(error); });
    paintThreads();
  }
  function paintThreads() {
    const list = root.querySelector('#conversationList');
    list.innerHTML = threadRows.length ? threadRows.map(t => { const p = people.find(p => p.uid === t.participants.find(id => id !== api.state.user.uid)); return `<button data-thread="${escape(t.id)}" aria-current="${t.id === active}">${avatar(p)}<span>${escape(userName(p))}<small>${escape(timeLabel(t.updatedAt))}</small></span></button>`; }).join('') : '<p class="social-muted">No conversations yet.</p>';
    list.querySelectorAll('[data-thread]').forEach(button => { button.onclick = () => select(button.dataset.thread); });
  }
  let opened = false;
  disposers.push(api.watchConversations(rows => { threadRows = rows; paintThreads(); if (active && !opened) { opened = true; select(active); } }, failure));
  disposers.push(() => stopMessages?.());
}
async function notificationsPage() {
  if (!api.state.profile) return gate();
  root.innerHTML = heading('Notifications', 'Replies to your posts and new connections.') + '<a href="/friends.html">View friend requests →</a><section id="notificationList"><p>Loading notifications…</p></section>';
  disposers.push(api.watchNotifications(async rows => {
    const entries = await Promise.all(rows.map(async n => {
      const p = await api.profile(n.profileId).catch(() => null);
      return `<article class="social-notification${n.read ? '' : ' is-unread'}">${avatar(p)}<div><a data-read="${escape(n.id)}" href="${postUrl(n.postId)}#comment-${encodeURIComponent(n.commentId)}"><strong>${escape(userName(p))}</strong> replied to your post<p>${escape(n.text)}</p></a>${time(n.createdAt)}</div>${n.read ? '' : `<button data-mark="${escape(n.id)}" aria-label="Mark notification as read">✓</button>`}</article>`;
    }));
    const host = root.querySelector('#notificationList'); host.innerHTML = entries.join('') || empty('You’re all caught up', 'Replies to your posts will appear here.');
    host.querySelectorAll('[data-mark]').forEach(button => { button.onclick = () => api.markRead(button.dataset.mark).catch(failure); });
    host.querySelectorAll('[data-read]').forEach(link => { link.onclick = async event => { event.preventDefault(); try { await api.markRead(link.dataset.read); } catch (_) {} location.assign(link.href); }; });
  }, failure));
}
async function pollsPage() {
  root.innerHTML = heading('The pack decides', 'Ask a question. Cast a vote. Watch the conversation take shape.') + `<details class="social-poll-compose"><summary>＋ Create a poll</summary><form class="social-compose"><label>Question<input name="title" maxlength="180" required placeholder="What should we explore next?"></label><label>Choices, one per line<textarea name="choices" rows="3" required placeholder="A new Chipper world&#10;A community drawing night"></textarea></label><label>Community<select name="board">${options('General')}</select></label><button type="submit" class="social-primary">Create poll</button><p role="status"></p></form></details><div id="pollList"><p>Loading polls…</p></div>`;
  const form = root.querySelector('form'); bindForm(form, async data => {
    await api.createPoll(data.get('title'), String(data.get('choices')).split('\n').map(v => v.trim()).filter(Boolean), data.get('board'));
    form.reset(); root.querySelector('details').open = false; toast('Poll created.');
  });
  let pollStops = [], charts = [];
  disposers.push(() => { pollStops.forEach(fn => fn()); charts.forEach(c => c?.destroy()); });
  disposers.push(api.watchPolls(polls => {
    pollStops.forEach(fn => fn()); charts.forEach(c => c?.destroy()); pollStops = []; charts = [];
    const host = root.querySelector('#pollList'); host.replaceChildren();
    if (!polls.length) host.innerHTML = empty('A question starts a conversation', 'Create the first community poll.');
    polls.forEach(poll => {
      const card = document.createElement('article'); card.className = 'social-poll'; card.id = 'poll-' + poll.id;
      card.innerHTML = `<span class="social-board-tag">${escape(poll.board)}</span><h2>${escape(poll.title)}</h2><div class="social-vote-options">${poll.options.map((option,i) => `<button data-choice="${i}"><span>${escape(option)}</span><strong>0%</strong></button>`).join('')}</div><p class="social-vote-status" role="status"></p><div class="social-chart"></div><p class="social-muted">Share of votes, not betting odds. One vote per account.</p>`;
      host.append(card); let myVote, chart;
      card.querySelectorAll('[data-choice]').forEach(button => { button.onclick = async () => {
        if (!requireUser() || myVote) return;
        card.querySelectorAll('button[data-choice]').forEach(b => { b.disabled = true; });
        try { await api.vote(poll.id, Number(button.dataset.choice)); }
        catch (error) { failure(error); card.querySelectorAll('button[data-choice]').forEach(b => { b.disabled = !!myVote; }); }
      }; });
      pollStops.push(api.watchVotes(poll.id, votes => {
        myVote = votes.find(v => v.id === api.state.user?.uid);
        const counts = poll.options.map((_,i) => votes.filter(v => v.choice === i).length);
        card.querySelectorAll('[data-choice]').forEach((button,i) => { button.disabled = !!myVote; button.setAttribute('aria-pressed', String(myVote?.choice === i)); button.querySelector('strong').textContent = (votes.length ? Math.round(counts[i] / votes.length * 100) : 0) + '%'; });
        card.querySelector('.social-vote-status').textContent = `${votes.length} vote${votes.length === 1 ? '' : 's'}${myVote ? ' · You voted for ' + poll.options[myVote.choice] : ' · Choose an option to vote'}`;
        const sorted = votes.filter(v => api.timestamp(v.createdAt)).sort((a,b) => api.timestamp(a.createdAt)-api.timestamp(b.createdAt));
        const running = poll.options.map(() => 0);
        const series = poll.options.map((name,i) => ({ id: String(i), name, points: [] }));
        sorted.forEach((vote,n) => { running[vote.choice]++; series.forEach((s,i) => s.points.push({ t: api.timestamp(vote.createdAt), v: running[i]/(n+1)*100 })); });
        chart?.destroy(); chart = window.CoolbradorScrubChart.mount(card.querySelector('.social-chart'), { series, title: poll.title, interpolation: 'step' }); charts.push(chart);
      }, failure));
    });
  }, failure));
}
async function archivePage() {
  const board = decodeURIComponent(location.pathname.split('/')[2] || 'BeeSid');
  const response = await fetch(board === 'BeeSid' ? '/data/boards/BeeSid.json' : '/data/community-archive.json'); if (!response.ok) throw new Error('The game archive is temporarily unavailable.');
  const data = await response.json();
  const all = board === 'BeeSid' ? data.posts || [] : data[board] || [];
  root.innerHTML = heading(board === 'BeeSid' ? 'Chipper game archive' : board + ' archive', 'Original Miiverse-style posts, preserved for the game. New conversations happen on the live BeeSid board.') + '<a class="social-primary" href="/b/BeeSid">Join the live board →</a><section id="archivePosts"></section>';
  const route = location.pathname.match(/\/post\/(\d+)\/comments/);
  const chronological = all.slice().sort((a,b) => (Date.parse(a.timestamp) || Number(a.id) || 0)-(Date.parse(b.timestamp) || Number(b.id) || 0));
  const selected = route ? [chronological[Number(route[1])-1]].filter(Boolean) : all;
  const host = root.querySelector('#archivePosts');
  if (!selected.length) { host.innerHTML = empty('Archived post not found'); return; }
  host.innerHTML = selected.map(p => `<article class="social-post"><header class="social-post-head"><strong>${escape(p.username || p.author || 'Chipper player')}</strong><span class="social-board-tag">Chipper archive</span></header><p class="social-post-text">${escape(p.text || p.body)}</p>${(Array.isArray(p.media) ? p.media : [p.media]).map(mediaHTML).join('')}<p class="social-muted">${Array.isArray(p.yeahs) ? p.yeahs.length : Number(p.yeahs) || 0} Yeah! · ${escape(timeLabel(p.timestamp))}</p></article>`).join('');
}
async function moderationPage() {
  if (!await api.isModerator()) { root.innerHTML = heading('Moderation') + empty('Moderator access required', 'Sign in with an account assigned the moderator role.'); return; }
  root.innerHTML = heading('Moderation', 'Review reports from the community. Removing a post also removes it from the live Chipper feed.') + '<section id="reports"></section>';
  disposers.push(api.watchReports(rows => {
    const host = root.querySelector('#reports');
    host.innerHTML = rows.length ? rows.map(r => `<article class="social-post"><a href="${postUrl(r.postId)}">Open reported post →</a><p>${escape(r.reason)}</p>${time(r.createdAt)}<div class="social-actions"><button data-remove-post="${escape(r.postId)}">Remove post</button><button data-dismiss="${escape(r.id)}">Dismiss report</button></div></article>`).join('') : empty('No pending reports');
    host.querySelectorAll('[data-dismiss]').forEach(button => { button.onclick = () => api.dismissReport(button.dataset.dismiss).catch(failure); });
    host.querySelectorAll('[data-remove-post]').forEach(button => { button.onclick = async () => { if (await confirmDialog('Remove this post?', 'It will no longer be publicly visible.', '')) { try { await api.removePost(button.dataset.removePost); toast('Post removed.'); } catch (error) { failure(error); } } }; });
  }, failure));
}
function wireKeyboardTabs() {
  root.addEventListener('keydown', e => {
    const tab = e.target.closest('[role=tab]'); if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    const tabs = [...tab.closest('[role=tablist]').querySelectorAll('[role=tab]')];
    let i = tabs.indexOf(tab); i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length)%tabs.length;
    e.preventDefault(); tabs[i].click(); tabs[i].focus();
  });
}
async function boot() {
  if (booted) return; booted = true;
  if (api.state.error) { root.innerHTML = empty('Could not connect to your account', api.friendlyError(api.state.error), '<button onclick="location.reload()">Try again</button>'); return; }
  if (api.state.profile) {
    disposers.push(api.watchFriends(rows => { friends = rows; feedRender(); }, failure));
    disposers.push(api.watchBlocks(rows => { blocks = rows; feedRender(); }, failure));
  }
  try {
    if (page === 'home' || page === 'community') await feedPage();
    else if (page === 'board') {
      const board = decodeURIComponent(location.pathname.split('/')[2] || 'General');
      if (!api.BOARDS.includes(board)) root.innerHTML = heading('Community') + empty('Community not found', 'Choose a community below.') + boardGrid();
      else if (board === 'BeeSid' && new URLSearchParams(location.search).has('archive')) await archivePage();
      else await feedPage(board);
    } else if (page === 'post') await threadPage();
    else if (page === 'friends') await peoplePage();
    else if (page === 'profile') await profilePage();
    else if (page === 'messages') await messagesPage();
    else if (page === 'notifications') await notificationsPage();
    else if (page === 'polls') await pollsPage();
    else if (page === 'archive') await archivePage();
    else if (page === 'moderation') await moderationPage();
  } catch (error) { root.innerHTML = empty('Could not load this page', api.friendlyError(error), '<button onclick="location.reload()">Try again</button>'); }
  wireKeyboardTabs();
}
await api.ready; boot();
window.addEventListener('pagehide', () => { disposers.forEach(fn => fn()); disposeCards(); });
document.addEventListener('error', e => { if (e.target instanceof HTMLImageElement && !e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = '/users/default/pfp.jpg'; } }, true);
