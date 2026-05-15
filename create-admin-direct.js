// Script pour créer directement l'admin avec Node.js
// Utilisation: node create-admin-direct.js

const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "gen-lang-client-0208289492",
  // Vous devez ajouter votre clé privée ici
  // Téléchargez-la depuis Firebase Console > Project Settings > Service Accounts
};

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'gen-lang-client-0208289492'
});

const auth = admin.auth();
const db = admin.firestore();

const email = 'administrateur@amenatawsil.com';
const password = 'Amena2026!';
const uid = 'tzo4E2tr6dQA3skcv8kO3Bek2K93';

async function createAdmin() {
  try {
    console.log('🔧 Création de l\'admin...');
    
    // 1. Créer ou mettre à jour l'utilisateur Auth
    try {
      await auth.updateUser(uid, {
        email: email,
        password: password,
        emailVerified: true,
        disabled: false
      });
      console.log('✅ Utilisateur Auth mis à jour');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await auth.createUser({
          uid: uid,
          email: email,
          password: password,
          emailVerified: true,
          disabled: false
        });
        console.log('✅ Utilisateur Auth créé');
      } else {
        throw error;
      }
    }
    
    // 2. Créer le profil Firestore
    const profileData = {
      email: email,
      name: 'Administrateur',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toLocaleString('fr-FR'),
      balance: 0,
      agency: '',
      performanceScore: 5.0,
      acceptanceRate: 100,
      availability: 'Available'
    };
    
    await db.collection('users').doc(uid).set(profileData, { merge: true });
    console.log('✅ Profil Firestore créé');
    
    // 3. Vérifier la création
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      console.log('✅ Vérification réussie');
      console.log('📋 Données:', userDoc.data());
    }
    
    console.log(`
🎉 ADMIN CRÉÉ AVEC SUCCÈS !

Identifiants:
📧 Email: ${email}
🔑 Password: ${password}
🌐 URL: https://amenatawsil.com

Vous pouvez maintenant vous connecter !
    `);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdmin();