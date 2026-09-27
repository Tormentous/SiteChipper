const {test}=require('node:test');const assert=require('node:assert/strict');
test('search normalizes complete words, duplicates, punctuation and unicode without indexing private fields',async()=>{
 const {searchTokens}=await import('../js/search-utils.mjs');
 assert.deepEqual(searchTokens('Chipper, CHIPPER! Hello pack. 世界'),['chipper','hello','pack','世界']);
 assert.equal(searchTokens(Array.from({length:150},(_,i)=>'word'+i).join(' ')).length,100);
 assert.equal(searchTokens('x'.repeat(1000))[0].length,48);
});
