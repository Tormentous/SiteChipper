#!/usr/bin/env node
// Run with admin credentials for the selected project, before opening public
// profile reads. Dry-run by default. Never copies browser-local demo identities.
const admin = require('../functions/node_modules/firebase-admin');
const projectId = process.env.GCLOUD_PROJECT;
if (!projectId) throw new Error('Set GCLOUD_PROJECT explicitly.');
const apply = process.argv.includes('--apply');
admin.initializeApp({ projectId });
async function main() {
  const db = admin.firestore();
  const all = await db.collection('profiles').get();
  let changed = 0;
  for (const snapshot of all.docs) {
    const value = snapshot.data();
    const privateFields = ['email','phoneNumber','phone','password','refreshToken','accessToken'];
    const remove = Object.fromEntries(privateFields.filter(k => k in value).map(k => [k, admin.firestore.FieldValue.delete()]));
    if (!Object.keys(remove).length) continue;
    if (!value.uid) throw new Error('A profile contains private fields but has no owner UID. Review it before migration.');
    if (apply) {
      const batch = db.batch();
      // Retain contact information privately. Never retain legacy credentials.
      const contact = {};
      if (typeof value.email === 'string') contact.email = value.email;
      if (typeof value.phoneNumber === 'string') contact.phoneNumber = value.phoneNumber;
      if (Object.keys(contact).length) batch.set(db.collection('accountPrivate').doc(value.uid),contact,{merge:true});
      batch.update(snapshot.ref, remove);
      await batch.commit();
    }
    changed++;
  }
  console.log(`${apply ? 'Sanitized' : 'Would sanitize'} ${changed} profiles. No identities or contact values were logged.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
