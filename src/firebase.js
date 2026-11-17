import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import {
  connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc,
} from 'firebase/firestore/lite';

export function connectWedding(firebaseConfig, useEmulators) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  let inFlight;
  async function identifyGuest() {
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser;
    inFlight ??= signInAnonymously(auth).then((credential) => credential.user).finally(() => { inFlight = null; });
    return inFlight;
  }

  return {
    async saveAttendance(details) {
      const guest = await identifyGuest();
      await setDoc(doc(db, 'rsvp', guest.uid), {
        ...details,
        updatedAt: serverTimestamp(),
      });
    },
  };
}
