const {test} = require('node:test');
const assert = require('node:assert/strict');
const {toGamePost,mergeFeed} = require('../functions/src/socialFeed');
test('shared BeeSid posts retain the Chipper contract and stable public URLs',()=>{
 const p=toGamePost({id:'stable-id',text:'Drawing from the game',createdAt:{toDate:()=>new Date('2026-01-01')},media:{url:'https://example.test/drawing.png',type:'image'}},{displayName:'Sky'},[{yeah:true},{yeah:false},{yeah:true}]);
 assert.equal(p.boardPostId,'stable-id'); assert.equal(p.yeahs,2); assert.equal(p.likes,2);
 assert.equal(p.body,'Drawing from the game'); assert.equal(p.url,'https://coolbrador.com/post/stable-id');
 assert.equal(p.timestamp,'2026-01-01T00:00:00.000Z'); assert.equal(p.media.length,1);
});
test('game feed preserves curated posts and sensitivity defaults without duplicating stale live entries',()=>{
 const feed=mergeFeed({version:7,sensitivity:{chipperDefault:'hide'},posts:[{id:'cg-48'},{id:'social-old'}]},[{id:'social-new'}]);
 assert.deepEqual(feed.posts.map(p=>p.id),['social-new','cg-48']); assert.equal(feed.sensitivity.chipperDefault,'hide'); assert.equal(feed.version,7);
});
test('non-web media URLs never reach game clients',()=>{
 assert.deepEqual(toGamePost({id:'x',media:{url:'javascript:alert(1)'}},null,[]).media,[]);
});

test('game projection preserves sensitive and mature content flags',()=>{
 const p=toGamePost({id:'flagged',contentWarnings:['nsfw','sensitive']},null,[]);
 assert.equal(p.sensitive,true); assert.equal(p.nsfw,true); assert.deepEqual(p.contentWarnings,['nsfw','sensitive']);
});
