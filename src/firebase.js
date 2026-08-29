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
const auth = getAuth(app);
 
// Sign in lazily — don't block app startup
let authPromise = null;
export function ensureAuth() {
  if (!authPromise) authPromise = signInAnonymously(auth).catch(() => {});
  return authPromise;
}
 
const ROSTER_DOC = doc(db, "attendance", "roster");
 
export async function loadRoster() {
  await ensureAuth();
  const snap = await getDoc(ROSTER_DOC);
  return snap.exists() ? snap.data().items : null;
}
export async function saveRoster(items) {
  await ensureAuth();
  await setDoc(ROSTER_DOC, { items, updatedAt: Date.now() });
}
export function watchRoster(cb) {
  ensureAuth().then(() => {
    onSnapshot(ROSTER_DOC, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().items)) cb(snap.data().items);
    });
  });
  return () => {};
}
 
