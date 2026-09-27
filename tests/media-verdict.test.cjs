const {test}=require('node:test');const assert=require('node:assert/strict');const {mediaVerdict}=require('../functions/src/mediaVerdict');
test('remote scan errors cannot be reported as clean results',()=>{
 assert.deepEqual(mediaVerdict(500,{status:'clear'}),{ok:false,classification:'unavailable'});
 assert.deepEqual(mediaVerdict(429,{}),{ok:false,classification:'unavailable'});
});
test('positive matches block while negative-match strings are not false positives',()=>{
 for(const status of ['match','matched','block','csam'])assert.equal(mediaVerdict(200,{status}).ok,false);
 for(const status of ['no_match','unmatched','clear'])assert.equal(mediaVerdict(200,{status}).ok,true);
 assert.equal(mediaVerdict(200,{matched:true}).ok,false);
});
