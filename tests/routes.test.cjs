const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');
test('local routing keeps stable social links and blocks private workspace paths',async()=>{
 const child=spawn(process.execPath,['tools/dev-server.mjs','--port','0'],{stdio:['ignore','pipe','pipe']});
 try {
  const port=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Preview test server did not start')),10000);
   child.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/[^:]+:(\d+)/);if(match){clearTimeout(timer);resolve(Number(match[1]));}});
   child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);reject(Error('Preview test server exited: '+code));});
  });
  for(const route of ['/','/post/stable-id','/b/drawing-club','/users/example','/settings','/safety.html','/privacy.html','/search?q=drawing','/messages','/polls','/games/chipper.html','/img/Chipper%20Masterlogo.png'])assert.equal((await fetch('http://127.0.0.1:'+port+route)).status,200,route);
  for(const route of ['/functions/src/index.js','/tools/dev.mjs','/tests/social.rules.test.cjs','/.emulator-data/auth_export/accounts.json','/.firebaserc','/package.json','/firestore.rules','/unknown-page'])assert.equal((await fetch('http://127.0.0.1:'+port+route)).status,404,route);
 } finally {child.kill();await new Promise(resolve=>child.once('exit',resolve));}
});
