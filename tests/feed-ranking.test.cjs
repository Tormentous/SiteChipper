const {test}=require('node:test');const assert=require('node:assert/strict');
const now=1800000000000;
const post=(id,extra={})=>({id,authorId:id,board:'General',createdAt:now,...extra});
test('ranking deduplicates, respects blocks, and explains interest/friend signals',async()=>{
 const {rankPosts,deduplicatePosts}=await import('../js/feed-ranking.mjs');
 const a=post('a'),repost={...a,_repost:{createdAt:now+1,authorId:'sharer'}};
 assert.deepEqual(deduplicatePosts([a,repost]),[repost]);
 const ranked=rankPosts([a,repost,post('b',{board:'BeeSid'}),post('c',{authorId:'friend'}),post('d',{authorId:'blocked'})],{now,interests:['BeeSid'],friends:['friend'],blocked:['blocked']});
 assert.deepEqual(ranked.map(p=>p.id),['b','c','a']);
 assert.match(ranked[0]._rankReason,/community/);assert.match(ranked[1]._rankReason,/friends/);
 assert.equal(rankPosts([repost],{now,blocked:['sharer']}).length,0);
});
test('freshness, novelty and diversity have bounded deterministic influence',async()=>{
 const {rankPosts}=await import('../js/feed-ranking.mjs');
 const list=[post('a',{authorId:'prolific'}),post('b',{authorId:'prolific'}),post('c',{authorId:'other'}),post('old',{createdAt:now-90*86400000})];
 const ranked=rankPosts(list,{now,seen:{a:now-1000}});
 assert.equal(ranked[0].id,'b');assert.equal(ranked[1].id,'c');assert.equal(ranked.at(-1).id,'old');
 assert.deepEqual(rankPosts(list,{now}),rankPosts(list.slice().reverse(),{now}));
 assert.equal(list[0]._rankReason,undefined,'inputs are not mutated');
});
test('feed preferences handle invalid storage and cap local history',async()=>{
 const {readFeedPreferences}=await import('../js/feed-ranking.mjs');
 assert.deepEqual(readFeedPreferences({getItem(){throw Error();}},'x'),{interests:[],seen:{}});
 const value={interests:['BeeSid','BeeSid',42],seen:Object.fromEntries(Array.from({length:600},(_,i)=>['p'+i,Date.now()]))};
 value.seen.expired=1;
 const read=readFeedPreferences({getItem:()=>JSON.stringify(value)},'x');assert.deepEqual(read.interests,['BeeSid']);assert.equal(Object.keys(read.seen).length,500);assert.ok(!('expired' in read.seen));
});
