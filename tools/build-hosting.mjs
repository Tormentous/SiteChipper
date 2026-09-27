// Build a public-only artifact; never deploy the repository or local emulator data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directories=new Set(['b','data','fonts','games','img','js','models','secret','shared','simulations','users']);
const extensions=new Set(['.html','.css','.js','.mjs','.json','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.mp4','.webm','.mp3','.wav','.ogg','.ttf','.otf','.woff','.woff2','.glb','.gltf','.bin','.wasm','.xml','.txt','.webmanifest']);
const gameFiles=new Set(['data/chipper_game_board_feed.json','data/chipper-miiverse.json','data/boards/BeeSid.json']);
export function publicFile(relative, live=true) {
 const parts=relative.split('/');
 if(parts.some(p=>p.startsWith('.')||p.startsWith('_')||p==='node_modules'))return false;
 if(parts.length>1&&!directories.has(parts[0]))return false;
 if(parts.length===1&&!['.html','.css'].includes(path.extname(relative)))return false;
 if(relative==='test.html'||relative.includes('.bak')||!extensions.has(path.extname(relative).toLowerCase()))return false;
 return !(live&&gameFiles.has(relative));
}
export async function buildGameArchives() {
 await fs.mkdir(path.join(root,'functions/data'),{recursive:true});
 for(const [from,to] of [['data/chipper_game_board_feed.json','feed.json'],['data/boards/BeeSid.json','board.json']]) {
   const contents=await fs.readFile(path.join(root,from),'utf8');
   if(!Array.isArray(JSON.parse(contents).posts))throw Error('Invalid curated game archive: '+from);
   await fs.writeFile(path.join(root,'functions/data',to),contents);
 }
}
export async function buildHosting({live=true}={}) {
 const stage=await fs.mkdtemp(path.join(root,'.hosting-build-'));let count=0;
 async function walk(dir='') {
   for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})) {
     const relative=dir?dir+'/'+entry.name:entry.name;
     if(entry.isSymbolicLink()||entry.name.startsWith('.')||entry.name.startsWith('_')||entry.name==='node_modules')continue;
     if(entry.isDirectory()){if(dir||directories.has(entry.name))await walk(relative);}
     else if(publicFile(relative,live)){await fs.mkdir(path.dirname(path.join(stage,relative)),{recursive:true});await fs.copyFile(path.join(root,relative),path.join(stage,relative));count++;}
   }
 }
 try {
   await walk(); await buildGameArchives();
   for(const required of ['index.html','js/social.js','js/account-settings.js','js/drawing.js','js/search-utils.mjs','data/community-archive.json','games/chipper.html'])await fs.access(path.join(stage,required));
   await fs.rm(path.join(root,'.hosting'),{recursive:true,force:true});await fs.rename(stage,path.join(root,'.hosting'));
   return {count,live};
 } finally {await fs.rm(stage,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.includes('--functions-only')){await buildGameArchives();console.log('Curated game archives packaged for Functions.');}
 else {const result=await buildHosting({live:!process.argv.includes('--archive')});console.log(`Built ${result.count} public files in .hosting (${result.live?'live game feed':'archived game feed'}).`);}
}
