import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, doc, getFirestore, limit,
  onSnapshot, orderBy, query, serverTimestamp, writeBatch,
} from 'firebase/firestore';

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
      const batch = writeBatch(db);
      const updatedAt = serverTimestamp();
      const message = details.message.trim();
      batch.set(doc(db, 'rsvp', guest.uid), { ...details, message, updatedAt });
      const publicWish = doc(db, 'publicWishes', guest.uid);
      if (message) batch.set(publicWish, { name: details.name, message, updatedAt });
      else batch.delete(publicWish);
      await batch.commit();
    },
    watchWishes(onUpdate, onError) {
      const recent = query(collection(db, 'publicWishes'), orderBy('updatedAt', 'desc'), limit(30));
      return onSnapshot(recent, (snapshot) => onUpdate(snapshot.docs.map((entry) => {
        const { name, message, updatedAt } = entry.data();
        return { name, message, updatedAt: updatedAt?.toDate?.() ?? null };
      })), onError);
    },
  };
}
