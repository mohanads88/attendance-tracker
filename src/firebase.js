import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(config);
const db = getFirestore(app);
export const authReady = signInAnonymously(getAuth(app)).catch(() => {});

const ROSTER_DOC = doc(db, "attendance", "roster");

export async function loadRoster() {
  const snap = await getDoc(ROSTER_DOC);
  return snap.exists() ? snap.data().items : null;
}
export async function saveRoster(items) {
  await setDoc(ROSTER_DOC, { items, updatedAt: Date.now() });
}
export function watchRoster(cb) {
  return onSnapshot(ROSTER_DOC, (snap) => {
    if (snap.exists() && Array.isArray(snap.data().items)) cb(snap.data().items);
  });
}
