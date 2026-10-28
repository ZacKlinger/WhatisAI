import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

assert(process.env.FIRESTORE_EMULATOR_HOST, 'Run with the Firestore emulator; never use a live project.');
const env = await initializeTestEnvironment({ projectId: 'demo-whatisai', firestore: { rules: await readFile('firestore.rules', 'utf8') } });
try {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const guest = env.unauthenticatedContext().firestore();
  const data = () => ({ json: '{"v":1}', version: 1, updatedAt: serverTimestamp() });
  await assertSucceeds(setDoc(doc(alice, 'progress/alice'), data()));
  await assertSucceeds(getDoc(doc(alice, 'progress/alice')));
  for (const db of [bob, guest]) {
    await assertFails(getDoc(doc(db, 'progress/alice')));
    await assertFails(setDoc(doc(db, 'progress/alice'), data()));
    await assertFails(deleteDoc(doc(db, 'progress/alice')));
  }
  await assertFails(getDocs(collection(alice, 'progress')));
  await assertFails(setDoc(doc(alice, 'users/alice'), data()));
  await assertFails(setDoc(doc(alice, 'progress/alice'), { ...data(), extra: true }));
  await assertFails(setDoc(doc(alice, 'progress/alice'), { ...data(), version: 2 }));
  await assertFails(setDoc(doc(alice, 'progress/alice'), { ...data(), json: 'x'.repeat(500001) }));
  await assertFails(setDoc(doc(alice, 'progress/alice'), { ...data(), updatedAt: new Date(0) }));
  await assertSucceeds(deleteDoc(doc(alice, 'progress/alice')));
  console.log('PASS Firestore owner access, cross-user/guest denial, list denial, schema, size, timestamps and deletion');
} finally { await env.cleanup(); }
