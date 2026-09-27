// Pure projection: keep Chipper's existing JSON shape while using shared posts.
function toGamePost(post, profile, reactions) {
  const timestamp = post.createdAt && typeof post.createdAt.toDate === 'function'
    ? post.createdAt.toDate().toISOString() : post.createdAt || null;
  const yeahs = (reactions || []).filter(r => r.yeah).length;
  const media = post.media && /^https?:\/\//.test(post.media.url || '') ? [post.media] : [];
  const name = profile && (profile.displayName || profile.username) || 'Chipper player';
  return {
    id: 'social-' + post.id, boardPostId: post.id,
    author: name, display_name: name, username: name,
    avatar_url: profile && profile.avatarUrl || '', body: post.text || '',
    yeahs, likes: yeahs, views: 0, media, timestamp,
    url: 'https://coolbrador.com/post/' + encodeURIComponent(post.id),
    inGame: true, feeling: 'happy', sensitive: false
  };
}
function mergeFeed(base, livePosts) {
  const feed = base || { board:'chipper-game-board', version:1, posts:[] };
  return { ...feed, posts:[...livePosts, ...(feed.posts || []).filter(p => !String(p.id).startsWith('social-'))],
    meta:{ ...feed.meta, liveSource:'firestore:posts+chipper/feed', servedAt:new Date().toISOString() } };
}
module.exports = { toGamePost, mergeFeed };
