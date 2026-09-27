// Shared social data. Firebase Auth is the authority; browser storage is only a UI cache.
import { auth, db, getStorageInstance } from './firebase.js';
import { onAuthStateChanged, updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp, writeBatch, runTransaction
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

export { auth };
export const BOARDS = ['General', 'BeeSid', 'Starry', 'ChipperCorner', 'Labradoria', 'MutinyDesk', 'GiftDrive', 'FarmReport'];
export const state = { user: null, profile: null, ready: false };
const listeners = new Set();
const profiles = new Map();
let resolveReady;
export const ready = new Promise(resolve => { resolveReady = resolve; });
export const timestamp = value => value?.toMillis?.() || (typeof value === 'number' ? value : Date.parse(value)) || 0;
export const pairId = (a, b) => [a, b].sort().join('__');
const row = snapshot => ({ ...snapshot.data(), id: snapshot.id });
function signedIn() {
  if (!auth.currentUser || !state.profile) throw new Error('Sign in to continue.');
  return auth.currentUser.uid;
}
function text(value, max, label) {
  value = String(value || '').trim();
  if (!value || value.length > max) throw new Error(`${label} must contain 1–${max} characters.`);
  return value;
}
export function friendlyError(error) {
  if (error?.code === 'permission-denied' || error?.code === 'storage/unauthorized') return 'You do not have permission to do that. Check that you are signed in.';
  if (error?.code === 'unavailable' || error?.code === 'auth/network-request-failed') return 'Connection lost. Your draft is still here; please try again.';
  return error?.message || 'Something went wrong. Please try again.';
}
export async function ensureProfile(user, displayName) {
  // Preserve established profile URLs. New accounts use collision-free Auth IDs.
  const existing = await getDocs(query(collection(db, 'profiles'), where('uid', '==', user.uid), limit(1)));
  if (!existing.empty) {
    const profile = row(existing.docs[0]);
    profiles.set(profile.id, profile);
    return profile;
  }
  const profile = { uid: user.uid, displayName: text(displayName || user.displayName || 'New Labrador', 48, 'Display name'),
    bio: '', avatarUrl: '/users/default/pfp.jpg', createdAt: serverTimestamp() };
  await runTransaction(db, async tx => {
    const ref = doc(db, 'profiles', user.uid);
    if (!(await tx.get(ref)).exists()) tx.set(ref, profile);
  });
  return row(await getDoc(doc(db, 'profiles', user.uid)));
}
function cacheProfile(profile) {
  const id = profile.id;
  profiles.set(id, profile);
  try {
    localStorage.setItem('user_' + id, JSON.stringify({ ...profile, username: profile.displayName, profilePicture: profile.avatarUrl }));
    localStorage.setItem('profile_' + id, JSON.stringify({ ...profile, avatar: profile.avatarUrl }));
    localStorage.setItem('pfp_' + id, profile.avatarUrl || '/users/default/pfp.jpg');
  } catch (_) { /* Storage full/private mode must not block a real session. */ }
}
onAuthStateChanged(auth, async user => {
  state.user = user;
  state.profile = null;
  state.error = null;
  try {
    if (user) {
      const profile = await ensureProfile(user);
      if (auth.currentUser?.uid !== user.uid) return;
      state.profile = profile;
      cacheProfile(profile);
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('currentUserId', profile.id);
      localStorage.setItem('firebaseUid', user.uid);
    } else {
      for (const key of ['loggedIn', 'currentUserId', 'firebaseUid']) localStorage.removeItem(key);
      sessionStorage.removeItem('cb_auth_chrome_v2');
    }
  } catch (error) { state.error = error; }
  state.ready = true;
  resolveReady(state);
  listeners.forEach(fn => fn(state));
  window.dispatchEvent(new CustomEvent('cb-social-auth', { detail: state }));
});
export function watchAuth(fn) { listeners.add(fn); if (state.ready) fn(state); return () => listeners.delete(fn); }
export async function logout() { await signOut(auth); }
export async function profile(id) {
  if (profiles.has(id)) return profiles.get(id);
  const snap = await getDoc(doc(db, 'profiles', id));
  if (!snap.exists()) return null;
  const value = row(snap); cacheProfile(value); return value;
}
export async function people() {
  const snap = await getDocs(query(collection(db, 'profiles'), limit(100)));
  return snap.docs.map(s => { const p = row(s); cacheProfile(p); return p; });
}
export async function saveProfile(fields) {
  signedIn();
  const value = { displayName: text(fields.displayName, 48, 'Display name'), bio: String(fields.bio || '').trim().slice(0, 500) };
  if (fields.avatarUrl) value.avatarUrl = fields.avatarUrl;
  await updateDoc(doc(db, 'profiles', state.profile.id), value);
  state.profile = { ...state.profile, ...value };
  cacheProfile(state.profile);
  await updateProfile(auth.currentUser, { displayName: value.displayName, photoURL: value.avatarUrl || state.profile.avatarUrl });
  listeners.forEach(fn => fn(state));
}
export async function upload(file) {
  const uid = signedIn();
  if (!file) return null;
  if (!/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm))$/.test(file.type)) throw new Error('Choose a JPG, PNG, GIF, WebP, MP4 or WebM file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Media must be 10 MB or smaller.');
  const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js');
  const path = `media/${uid}/${crypto.randomUUID()}`;
  const target = ref(await getStorageInstance(), path);
  await uploadBytes(target, file, { contentType: file.type });
  return { url: await getDownloadURL(target), type: file.type.startsWith('video/') ? 'video' : 'image', path };
}
export async function createPost({ body, board = 'General', media = null }) {
  const uid = signedIn();
  body = String(body || '').trim();
  if ((!body && !media) || body.length > 2000) throw new Error('Write a post or attach media (up to 2,000 characters).');
  if (!BOARDS.includes(board)) throw new Error('Choose a community from the list.');
  const ref = await addDoc(collection(db, 'posts'), { authorId: uid, profileId: state.profile.id, board, text: body,
    media, inGame: board === 'BeeSid', createdAt: serverTimestamp(), editedAt: null });
  return ref.id;
}
export function watchPosts({ board, authorId, after, count = 30 } = {}, success, error) {
  const clauses = [];
  if (board) clauses.push(where('board', '==', board));
  if (authorId) clauses.push(where('authorId', '==', authorId));
  clauses.push(orderBy('createdAt', 'desc'));
  if (after) clauses.push(startAfter(after));
  clauses.push(limit(count));
  return onSnapshot(query(collection(db, 'posts'), ...clauses), snap => success(snap.docs.map(row), snap.docs.at(-1)), error);
}
export function watchPost(id, success, error) {
  return onSnapshot(doc(db, 'posts', id), snap => success(snap.exists() ? row(snap) : null), error);
}
export async function editPost(id, body) { signedIn(); await updateDoc(doc(db, 'posts', id), { text: text(body, 2000, 'Post'), editedAt: serverTimestamp() }); }
export async function removePost(id) { signedIn(); await deleteDoc(doc(db, 'posts', id)); }
export function watchReactions(id, success, error) {
  return onSnapshot(collection(db, 'posts', id, 'reactions'), snap => success(snap.docs.map(row)), error);
}
export async function react(id, kind) {
  const uid = signedIn();
  if (!['yeah', 'repost'].includes(kind)) throw new Error('Unknown reaction.');
  const ref = doc(db, 'posts', id, 'reactions', uid);
  await runTransaction(db, async tx => {
    const current = await tx.get(ref);
    const value = current.exists() ? current.data() : { yeah: false, repost: false };
    tx.set(ref, { ...value, [kind]: !value[kind] });
  });
}
export function watchComments(id, success, error) {
  return onSnapshot(query(collection(db, 'posts', id, 'comments'), orderBy('createdAt'), limit(200)), snap => success(snap.docs.map(row)), error);
}
export async function comment(post, body, media = null) {
  const uid = signedIn();
  const ref = doc(collection(db, 'posts', post.id, 'comments'));
  const batch = writeBatch(db);
  const value = text(body, 2000, 'Reply');
  batch.set(ref, { authorId: uid, profileId: state.profile.id, text: value, media, createdAt: serverTimestamp() });
  if (post.authorId !== uid) batch.set(doc(db, 'users', post.authorId, 'notifications', ref.id), {
    senderId: uid, profileId: state.profile.id, kind: 'reply', postId: post.id, commentId: ref.id,
    text: value.slice(0, 160), read: false, createdAt: serverTimestamp()
  });
  await batch.commit();
}
export async function removeComment(postId, id) { signedIn(); await deleteDoc(doc(db, 'posts', postId, 'comments', id)); }
export function watchFriends(success, error) {
  return onSnapshot(query(collection(db, 'friendships'), where('participants', 'array-contains', signedIn())), snap => success(snap.docs.map(row)), error);
}
export async function requestFriend(target) {
  const uid = signedIn();
  if (target === uid) throw new Error('That is your account.');
  await setDoc(doc(db, 'friendships', pairId(uid, target)), { participants: [uid, target].sort(), requester: uid, status: 'pending', createdAt: serverTimestamp() });
}
export async function acceptFriend(id) { signedIn(); await updateDoc(doc(db, 'friendships', id), { status: 'accepted' }); }
export async function removeFriend(id) { signedIn(); await deleteDoc(doc(db, 'friendships', id)); }
export function watchBlocks(success, error) {
  return onSnapshot(collection(db, 'users', signedIn(), 'blocks'), snap => success(snap.docs.map(s => s.id)), error);
}
export async function block(target, blocked) {
  const ref = doc(db, 'users', signedIn(), 'blocks', target);
  if (blocked) await setDoc(ref, { createdAt: serverTimestamp() }); else await deleteDoc(ref);
}
export async function report(post, reason) {
  await addDoc(collection(db, 'reports'), { reporter: signedIn(), postId: post.id, reason: text(reason, 1000, 'Report'), createdAt: serverTimestamp() });
}
export async function openConversation(target) {
  const uid = signedIn();
  if (uid === target) throw new Error('Choose another person.');
  const id = pairId(uid, target), ref = doc(db, 'conversations', id);
  await runTransaction(db, async tx => {
    if (!(await tx.get(ref)).exists()) tx.set(ref, { participants: [uid, target].sort(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  return id;
}
export function watchConversations(success, error) {
  return onSnapshot(query(collection(db, 'conversations'), where('participants', 'array-contains', signedIn())), snap => success(snap.docs.map(row).sort((a,b) => timestamp(b.updatedAt)-timestamp(a.updatedAt))), error);
}
export function watchMessages(id, success, error) {
  return onSnapshot(query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'desc'), limit(100)), snap => success(snap.docs.map(row).reverse()), error);
}
export async function sendMessage(id, body) {
  const uid = signedIn(), batch = writeBatch(db);
  batch.set(doc(collection(db, 'conversations', id, 'messages')), { senderId: uid, text: text(body, 2000, 'Message'), createdAt: serverTimestamp() });
  batch.update(doc(db, 'conversations', id), { updatedAt: serverTimestamp() });
  await batch.commit();
}
export function watchNotifications(success, error) {
  return onSnapshot(query(collection(db, 'users', signedIn(), 'notifications'), orderBy('createdAt', 'desc'), limit(100)), snap => success(snap.docs.map(row)), error);
}
export async function markRead(id) { await updateDoc(doc(db, 'users', signedIn(), 'notifications', id), { read: true }); }
export async function createPoll(title, options, board) {
  const uid = signedIn();
  options = options.map(v => text(v, 80, 'Choice'));
  if (options.length < 2 || options.length > 6 || new Set(options.map(v => v.toLowerCase())).size !== options.length) throw new Error('Use 2–6 different choices.');
  if (!BOARDS.includes(board)) throw new Error('Choose a community.');
  return addDoc(collection(db, 'polls'), { authorId: uid, profileId: state.profile.id, title: text(title, 180, 'Question'), options, board, createdAt: serverTimestamp() });
}
export function watchPolls(success, error) { return onSnapshot(query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(30)), snap => success(snap.docs.map(row)), error); }
export function watchVotes(id, success, error) { return onSnapshot(query(collection(db, 'polls', id, 'votes'), orderBy('createdAt')), snap => success(snap.docs.map(row)), error); }
export async function vote(id, choice) { await setDoc(doc(db, 'polls', id, 'votes', signedIn()), { choice, createdAt: serverTimestamp() }); }
