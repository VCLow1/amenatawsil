/**
 * Script de nettoyage Firestore
 * Supprime toutes les collections et recrée uniquement les données propres
 * Usage: npx tsx scripts/clean-firestore.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, process.env.VITE_FIREBASE_DATABASE_ID || '(default)');

// ── S'authentifier en tant que Super Admin ────────────────────────────
async function loginAsAdmin() {
  await signInWithEmailAndPassword(auth, 'admin@logitrack.tn', 'LogiTrack2024!');
  console.log('🔐 Connecté en tant que Super Admin');
}

// ── Supprimer toute une collection ────────────────────────────────────
async function clearCollection(name: string) {
  const snap = await getDocs(collection(db, name));
  const deletions = snap.docs.map(d => deleteDoc(doc(db, name, d.id)));
  await Promise.all(deletions);
  console.log(`🗑️  Collection "${name}" vidée (${snap.docs.length} docs supprimés)`);
}

// ── Données propres ───────────────────────────────────────────────────
const CLEAN_USERS = [
  { email: 'admin@logitrack.tn',       password: 'LogiTrack2024!', data: { name: 'Ahmed Ben Salem',  role: 'Super Admin',      status: 'Active', lastLogin: '' } },
  { email: 'moderator@logitrack.tn',   password: 'LogiTrack2024!', data: { name: 'Sonia Mansour',    role: 'Agency Moderator', status: 'Active', lastLogin: '', agency: 'Agence Tunis Centre' } },
  { email: 'shipper@logitrack.tn',     password: 'LogiTrack2024!', data: { name: 'Mohamed Ali',      role: 'Shipper',          status: 'Active', lastLogin: '', companyName: 'Fashion Store' } },
  { email: 'courier@logitrack.tn',     password: 'LogiTrack2024!', data: { name: 'Yassine Jendoubi', role: 'Courier',          status: 'Active', lastLogin: '', vehicle: 'Moto', zone: 'Tunis', balance: 125.5, performanceScore: 4.9, acceptanceRate: 98 } },
];

const CLEAN_AGENCIES = [
  { name: 'Agence Tunis Centre', location: 'Tunis',  manager: 'Sonia Mansour', phone: '+216 71 123 456', email: 'tunis@logitrac.tn',  status: 'Active',   packages: 0 },
  { name: 'Agence Sfax Sud',     location: 'Sfax',   manager: '',              phone: '+216 74 123 456', email: 'sfax@logitrac.tn',   status: 'Active',   packages: 0 },
  { name: 'Agence Sousse',       location: 'Sousse', manager: '',              phone: '+216 73 123 456', email: 'sousse@logitrac.tn', status: 'Inactive', packages: 0 },
];

const CLEAN_SETTINGS = {
  companyName: 'LogiTrack Tunisie',
  contactEmail: 'contact@logitrac.tn',
  primaryPhone: '+216 71 000 000',
  defaultCurrency: 'TND (Dinar Tunisien)',
  maintenanceMode: false,
  autoAssign: true,
};

async function clean() {
  console.log('🧹 Nettoyage de Firestore...\n');

  // Se connecter en tant qu'admin pour avoir les permissions
  await loginAsAdmin();

  // Vider toutes les collections
  await clearCollection('agencies');
  await clearCollection('packages');
  await clearCollection('notifications');
  await clearCollection('transactions');

  // Pour les users : supprimer Firestore uniquement (Auth nécessite Admin SDK)
  await clearCollection('users');

  console.log('');

  // Recréer les settings
  await setDoc(doc(db, 'settings', 'global'), CLEAN_SETTINGS);
  console.log('✅ Settings recréés');

  // Recréer les agences propres
  for (const agency of CLEAN_AGENCIES) {
    await addDoc(collection(db, 'agencies'), agency);
  }
  console.log('✅ 3 agences propres créées');

  // Recréer les utilisateurs
  for (const user of CLEAN_USERS) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        ...user.data,
        lastLogin: new Date().toLocaleString('fr-FR'),
      });
      await signOut(auth);
      console.log(`✅ Utilisateur recréé : ${user.email}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Auth déjà existant (ignoré) : ${user.email}`);
      } else {
        console.error(`❌ Erreur pour ${user.email}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Nettoyage terminé !');
  console.log('\n📋 Comptes de connexion :');
  CLEAN_USERS.forEach(u => console.log(`   ${u.data.role.padEnd(20)} → ${u.email}  /  ${u.password}`));
  process.exit(0);
}

clean().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
