// Pure projection: keep Chipper's existing JSON shape while using shared posts.
function publicUrl(value) {
  try { const url = new URL(value || '/users/default/pfp.jpg', 'https://coolbrador.com'); return ['http:','https:'].includes(url.protocol) ? url.href : ''; }
  catch (_) { return ''; }
}
function toGamePost(post, profile, reactions) {
  const timestamp = post.createdAt && typeof post.createdAt.toDate === 'function'
    ? post.createdAt.toDate().toISOString() : post.createdAt || null;
  const yeahs = (reactions || []).filter(r => r.yeah).length;
  const media = post.media && /^https?:\/\//.test(post.media.url || '') ? [post.media] : [];
  const name = profile && (profile.displayName || profile.username) || 'Chipper player';
  return {
    id: 'social-' + post.id, boardPostId: post.id, userId: post.profileId || post.authorId || '',
    author: name, display_name: name, username: name,
    avatar_url: publicUrl(profile && profile.avatarUrl), body: post.text || '',
    yeahs, likes: yeahs, views: 0, media, timestamp,
    url: 'https://coolbrador.com/post/' + encodeURIComponent(post.id),
    inGame: true, feeling: 'happy', contentWarnings: post.contentWarnings || [],
    sensitive: !!post.sensitive || !!post.contentWarnings?.length,
    nsfw: !!post.nsfw || (post.contentWarnings || []).includes('nsfw')
  };
}
function mergeFeed(base, livePosts) {
  const feed = base || { board:'chipper-game-board', version:1, posts:[] };
  return { ...feed, posts:[...livePosts, ...(feed.posts || []).filter(p => !String(p.id).startsWith('social-'))],
    meta:{ ...feed.meta, liveSource:'firestore:posts+chipper/feed', servedAt:new Date().toISOString() } };
}
module.exports = { toGamePost, mergeFeed };
