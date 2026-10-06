import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Values come from .env.local (see .env.example). On Vercel, add the same
// variables under Project Settings > Environment Variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Placeholder keeps getAuth() from throwing on import when .env.local is missing;
// App.jsx shows a setup message instead of using Firebase in that case.
const app = initializeApp(isFirebaseConfigured ? firebaseConfig : { ...firebaseConfig, apiKey: 'missing', projectId: 'missing' });

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Offline cache: the app keeps working without signal and syncs when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
