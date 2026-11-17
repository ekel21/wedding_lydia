import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, collection, doc, getDoc,
  getDocs, query, where, limit, serverTimestamp, setDoc, setLogLevel,
} from 'firebase/firestore/lite';
import { connectWedding } from '../src/firebase.js';

const projectId = 'demo-moses-lidya';
const config = { projectId, apiKey: 'demo-only-key', authDomain: projectId + '.firebaseapp.com', appId: '1:123456:web:demo' };
setLogLevel('silent');

function client(name) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { db, async login() { return (await signInAnonymously(auth)).user.uid; } };
}
const denied = (callback) => assert.rejects(callback, (error) => error.code === 'permission-denied');

test('saves RSVP and optional prayer as one private record', async () => {
  const wedding = connectWedding(config, true);
  const guest = client('another-guest');
  const publicClient = client('public');
  const anotherUid = await guest.login();

  const message = 'Selamat menikah, Moses dan Lidya!\nSemoga selalu diberkati.';
  await wedding.saveAttendance({ name: 'Tamu Pengujian', status: 'hadir', guestCount: 2, message });
  const webUid = getAuth().currentUser.uid;
  const ref = doc(getFirestore(), 'rsvp', webUid);
  const record = (await getDoc(ref)).data();
  assert.equal(record.status, 'hadir');
  assert.equal(record.guestCount, 2);
  assert.equal(record.message, message);
  await denied(() => getDoc(doc(guest.db, 'rsvp', webUid)));
  await denied(() => getDocs(collection(publicClient.db, 'rsvp')));

  const guestRef = doc(guest.db, 'rsvp', anotherUid);
  const attendance = { name: 'Tamu Lain', status: 'hadir', guestCount: 1, updatedAt: serverTimestamp() };
  await denied(() => setDoc(guestRef, { ...attendance, status: 'tidak-hadir' }));
  await denied(() => setDoc(guestRef, { ...attendance, message: 'x'.repeat(501) }));
  await denied(() => setDoc(guestRef, { ...attendance, message: true }));

  await wedding.saveAttendance({ name: 'Tamu Pengujian', status: 'tidak-hadir', guestCount: 0, message: '' });
  const updated = (await getDoc(ref)).data();
  assert.equal(updated.status, 'tidak-hadir');
  assert.equal(updated.guestCount, 0);
  assert.equal(updated.message, '');

  const legacy = await fetch(
    'http://127.0.0.1:8080/v1/projects/' + projectId + '/databases/(default)/documents/wishes/' + anotherUid,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { approved: { booleanValue: true }, message: { stringValue: 'Ucapan lama' } } }),
    },
  );
  assert.equal(legacy.status, 200);
  await denied(() => getDoc(doc(guest.db, 'wishes', anotherUid)));
  await denied(() => getDocs(query(collection(publicClient.db, 'wishes'), where('approved', '==', true), limit(30))));
  await denied(() => setDoc(doc(guest.db, 'wishes', anotherUid), { message, approved: false }));
});
