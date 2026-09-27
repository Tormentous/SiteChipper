const {test}=require('node:test');const assert=require('node:assert/strict');
test('hosting artifact excludes tooling, backups and static game overrides while retaining public assets',async()=>{
 const {publicFile}=await import('../tools/build-hosting.mjs');
 for(const p of ['functions/src/index.js','tools/dev.mjs','tests/lifecycle.test.cjs','.emulator-data/auth_export/accounts.json','node_modules/firebase/index.js','data/_backup_pre_autopublish/feed.json','data/file.json.bak','package.json','firebase.json','__/firebase/init.json','test.html','data/chipper_game_board_feed.json','data/chipper-miiverse.json','data/boards/BeeSid.json'])assert.equal(publicFile(p),false,p);
 for(const p of ['index.html','social.css','js/social.js','games/chipper.html','models/Stars.glb','data/community-archive.json','users/default/pfp.jpg','simulations/labradorsim/assets/index-B19r3pgH.js','secret/home.html'])assert.equal(publicFile(p),true,p);
 assert.equal(publicFile('data/chipper_game_board_feed.json',false),true);
});
