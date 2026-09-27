const {test}=require('node:test');const assert=require('node:assert/strict');
test('muted phrases normalize unicode, deduplicate and treat regex syntax literally',async()=>{
 const {normalizeMuted,matchesMuted,readMuted}=await import('../js/content-preferences.mjs');
 const words=normalizeMuted('  ChIPPER  \nCHIPPER\nＦＯＯ\n[a-z]+\n');
 assert.deepEqual(words,['chipper','foo','[a-z]+']);
 assert.equal(matchesMuted('A drawing in CHIPPER',words),true);
 assert.equal(matchesMuted('unrelated words',words),false);
 assert.equal(matchesMuted('Literal [a-z]+ string',words),true);
 assert.equal(normalizeMuted(Array.from({length:200},(_,i)=>'word'+i).join('\n')).length,100);
 assert.deepEqual(readMuted({getItem(){throw Error('blocked storage');}}),[]);
});
