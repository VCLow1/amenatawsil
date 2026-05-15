import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
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

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const SEED_USERS = [
  { email: 'admin@amenatawsil.com', password: 'AmenaTawsil2024!', name: 'Admin', role: 'Super Admin', status: 'Active' },
];

const SEED_AGENCIES = [
  { name: 'Agence Tunis Centre', location: 'Tunis',  manager: 'Sonia Mansour', phone: '+216 71 123 456', email: 'tunis@amenatawsil.com',  status: 'Active',   packages: 0 },
  { name: 'Agence Sfax Sud',     location: 'Sfax',   manager: '',              phone: '+216 74 123 456', email: 'sfax@amenatawsil.com',   status: 'Active',   packages: 0 },
  { name: 'Agence Sousse',       location: 'Sousse', manager: '',              phone: '+216 73 123 456', email: 'sousse@amenatawsil.com', status: 'Inactive', packages: 0 },
];

const SEED_SETTINGS = {
  companyName: 'AMENA TAWSIL',
  contactEmail: 'contact@amenatawsil.com',
  primaryPhone: '+216 71 000 000',
  defaultCurrency: 'TND (Dinar Tunisien)',
  maintenanceMode: false,
  autoAssign: true,
  notifApprovals: true,
  notifDelivered: true,
  notifReturned: true,
  notifDailyReport: false,
};

async function getUidByLogin(email: string, password: string): Promise<string | null> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    await signOut(auth);
    return uid;
  } catch {
    return null;
  }
}

async function seed() {
  console.log('🌱 Démarrage du seed Firestore...\n');

  await setDoc(doc(db, 'settings', 'global'), SEED_SETTINGS);
  console.log('✅ Settings créés');

  for (const agency of SEED_AGENCIES) {
    await addDoc(collection(db, 'agencies'), agency);
  }
  console.log('✅ Agences créées');

  for (const user of SEED_USERS) {
    try {
      const { password, ...userData } = user;
      let uid: string;

      try {
        const credential = await createUserWithEmailAndPassword(auth, user.email, password);
        uid = credential.user.uid;
        await signOut(auth);
        console.log(`✅ Compte Auth créé : ${user.email} (${uid})`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          const existingUid = await getUidByLogin(user.email, password);
          if (!existingUid) {
            console.error(`❌ Impossible de récupérer l'UID pour ${user.email}`);
            continue;
          }
          uid = existingUid;
          console.log(`♻️  Compte existant récupéré : ${user.email} (${uid})`);
        } else {
          throw err;
        }
      }

      await setDoc(doc(db, 'users', uid), {
        ...userData,
        lastLogin: new Date().toLocaleString('fr-FR'),
      });
      console.log(`✅ Document Firestore écrit : ${user.email}`);

    } catch (err: any) {
      console.error(`❌ Erreur pour ${user.email}:`, err.message);
    }
  }

  await addDoc(collection(db, 'packages'), {
    trackingId: 'AT-782910',
    shipper: 'Fashion Store',
    recipientName: 'Amine Abdellaoui',
    recipientPhone: '98765432',
    recipientAddress: 'Tunis, El Menzah',
    city: 'Tunis',
    weight: 1.5,
    fragile: false,
    status: 'Delivered',
    approvalStatus: 'approved',
    date: yesterday,
    deliveryDate: today,
    collectedAmount: 45.5,
    shippingFee: 7.0,
    paymentStatus: 'Paid',
    courier: 'Yassine Jendoubi',
    history: [
      { status: 'Pending',    date: `${yesterday} 09:00`, message: 'Colis créé' },
      { status: 'Received',   date: `${yesterday} 14:00`, message: 'Reçu à l\'agence' },
      { status: 'In Transit', date: `${today} 08:30`,     message: 'En cours de livraison' },
      { status: 'Delivered',  date: `${today} 11:45`,     message: 'Livré avec succès' },
    ],
  });

  await addDoc(collection(db, 'packages'), {
    trackingId: 'AT-782911',
    shipper: 'Tech Hub',
    recipientName: 'Sarah Dridi',
    recipientPhone: '22334455',
    recipientAddress: 'Sousse, Khezama',
    city: 'Sousse',
    weight: 2.0,
    fragile: true,
    status: 'In Transit',
    approvalStatus: 'approved',
    date: today,
    collectedAmount: 120.0,
    shippingFee: 8.0,
    paymentStatus: 'Pending',
    history: [
      { status: 'Pending',    date: `${today} 10:00`, message: 'Colis créé' },
      { status: 'In Transit', date: `${today} 16:30`, message: 'En cours de livraison' },
    ],
  });

  await addDoc(collection(db, 'packages'), {
    trackingId: 'AT-782912',
    shipper: 'Fashion Store',
    recipientName: 'Omar Feki',
    recipientPhone: '55667788',
    recipientAddress: 'Sfax, Sakiet Ezzit',
    city: 'Sfax',
    weight: 0.8,
    fragile: false,
    status: 'Pending',
    approvalStatus: 'waiting',
    date: today,
    collectedAmount: 32.2,
    shippingFee: 7.0,
    paymentStatus: 'Pending',
    history: [{ status: 'Pending', date: `${today} 11:00`, message: 'Colis créé — en attente d\'approbation' }],
  });

  console.log('✅ Colis de démonstration créés');
  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n📋 Comptes de connexion :');
  SEED_USERS.forEach(u => console.log(`   ${u.role.padEnd(20)} → ${u.email}  /  ${u.password}`));
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
