// Explainable ranking of the loaded candidate window. No remote tracking.
export function millis(value) {
  const n=value?.toMillis?.() ?? (typeof value==='number'?value:Date.parse(value));
  return Number.isFinite(n)?n:0;
}
export function deduplicatePosts(posts) {
  const unique=new Map();
  for(const post of posts){if(!post?.id)continue;const previous=unique.get(post.id);
    if(!previous||millis(post._repost?.createdAt||post.createdAt)>millis(previous._repost?.createdAt||previous.createdAt))unique.set(post.id,post);
  }
  return [...unique.values()];
}
export function rankPosts(posts,{now=Date.now(),interests=[],friends=[],seen={},blocked=[]}={}) {
  const candidates=deduplicatePosts(posts).filter(p=>!blocked.includes(p.authorId)&&!blocked.includes(p._repost?.authorId)).map(post=>{
    const age=Math.max(0,(now-millis(post.createdAt))/3600000),freshness=4/(1+age/24);
    const interest=interests.includes(post.board)?3:0,friend=friends.includes(post.authorId)?2:0;
    const viewed=Number.isFinite(seen[post.id])&&seen[post.id]>now-7*86400000;
    return {post,score:freshness+interest+friend+(viewed?0:1),reason:interest?'A community you chose':friend?'From your friends':viewed?'Recent community activity':'A post you have not seen on this device'};
  });
  // Greedy diversity penalty: one prolific author/community cannot occupy every top slot.
  const authors=new Map(),boards=new Map(),result=[];
  while(candidates.length){
    candidates.sort((a,b)=>(b.score-(authors.get(b.post.authorId)||0)*2-(boards.get(b.post.board)||0)*.5)-(a.score-(authors.get(a.post.authorId)||0)*2-(boards.get(a.post.board)||0)*.5)||millis(b.post.createdAt)-millis(a.post.createdAt)||a.post.id.localeCompare(b.post.id));
    const selected=candidates.shift();result.push({...selected.post,_rankReason:selected.reason});
    authors.set(selected.post.authorId,(authors.get(selected.post.authorId)||0)+1);boards.set(selected.post.board,(boards.get(selected.post.board)||0)+1);
  }
  return result;
}
export function readFeedPreferences(storage,key) {
  try { const value=JSON.parse(storage.getItem(key)||'{}');return {interests:Array.isArray(value.interests)?[...new Set(value.interests.filter(v=>typeof v==='string'))].slice(0,30):[],seen:Object.fromEntries(Object.entries(value.seen||{}).filter(([id,t])=>id.length<200&&Number.isFinite(t)&&t>Date.now()-7*86400000).sort((a,b)=>b[1]-a[1]).slice(0,500))}; }catch{return {interests:[],seen:{}};}
}
