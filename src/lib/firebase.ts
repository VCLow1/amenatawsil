import { initializeApp, initializeApp as initializeSecondaryApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// App principale — session de l'utilisateur connecté
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// App secondaire — pour créer des comptes sans déconnecter l'admin
const secondaryApp = initializeSecondaryApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';
export const db = getFirestore(app, firestoreDatabaseId);

export default app;
