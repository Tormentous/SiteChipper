// Explicit project + dry-run default. Safe to re-run after the privacy migration.
import {createRequire} from 'node:module';import {searchTokens} from '../js/search-utils.mjs';
const require=createRequire(new URL('../functions/package.json',import.meta.url));const admin=require('firebase-admin');
const projectId=process.env.GCLOUD_PROJECT;if(!projectId)throw Error('Set GCLOUD_PROJECT explicitly.');
const app=admin.initializeApp({projectId}),db=app.firestore(),apply=process.argv.includes('--apply');let changed=0;
try{
 for(const name of ['profiles','posts']){let cursor;
  for(;;){const query=db.collection(name).orderBy('__name__');const page=await(cursor?query.startAfter(cursor):query).limit(200).get();if(page.empty)break;
   const batch=db.batch();let writes=0;
   for(const doc of page.docs){const data=doc.data(),tokens=searchTokens(name==='posts'?data.text:(data.displayName||data.username||'')+' '+(data.bio||''));
    if(JSON.stringify(tokens)!==JSON.stringify(data.searchTokens)){changed++;if(apply){batch.update(doc.ref,{searchTokens:tokens});writes++;}}
   }if(writes)await batch.commit();cursor=page.docs.at(-1);
  }
 }
 console.log(`${apply?'Indexed':'Would index'} ${changed} public records.`);
}finally{await app.delete();}
