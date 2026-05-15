#!/usr/bin/env node

/**
 * Script pour créer un utilisateur Super Admin
 * Usage: node create-admin.js
 * 
 * Ce script nécessite une clé de service Firebase Admin SDK
 */

import admin from 'firebase-admin';
import readline from 'readline';
import { readFileSync, existsSync } from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function initializeFirebase() {
  // Chercher le fichier de clé de service
  const serviceAccountPaths = [
    './serviceAccountKey.json',
    './firebase-admin-key.json',
    './service-account.json'
  ];
  
  let serviceAccount = null;
  for (const path of serviceAccountPaths) {
    if (existsSync(path)) {
      serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
      console.log(`✅ Clé de service trouvée : ${path}`);
      break;
    }
  }
  
  if (!serviceAccount) {
    console.log('\n⚠️  Aucune clé de service Firebase Admin trouvée.');
    console.log('\n📥 Pour télécharger votre clé de service :');
    console.log('1. Allez sur : https://console.firebase.google.com/project/gen-lang-client-0208289492/settings/serviceaccounts/adminsdk');
    console.log('2. Cliquez sur "Generate new private key"');
    console.log('3. Sauvegardez le fichier comme "serviceAccountKey.json" dans ce dossier');
    console.log('4. Relancez ce script\n');
    return false;
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://gen-lang-client-0208289492.firebaseio.com`
    });
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation Firebase:', error.message);
    return false;
  }
}

async function createAdmin(email, password, name) {
  try {
    // Créer l'utilisateur dans Authentication
    console.log('\n🔐 Création de l\'utilisateur dans Authentication...');
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true
    });
    
    console.log(`✅ Utilisateur créé avec UID: ${userRecord.uid}`);
    
    // Créer le profil dans Firestore
    console.log('\n📝 Création du profil dans Firestore...');
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Profil créé dans Firestore');
    
    return userRecord;
  } catch (error) {
    throw error;
  }
}

async function main() {
  console.log('\n🔐 Création d\'un utilisateur Super Admin\n');
  console.log('='.repeat(60));
  
  // Initialiser Firebase Admin
  const initialized = await initializeFirebase();
  if (!initialized) {
    rl.close();
    process.exit(1);
  }
  
  // Demander les informations
  const email = await question('\n📧 Email de l\'admin (défaut: admin@amenatawsil.com) : ') || 'admin@amenatawsil.com';
  const password = await question('🔑 Mot de passe (min. 6 caractères) : ');
  
  if (password.length < 6) {
    console.log('\n❌ Le mot de passe doit contenir au moins 6 caractères.');
    rl.close();
    process.exit(1);
  }
  
  const name = await question('👤 Nom complet (défaut: Administrateur) : ') || 'Administrateur';
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Informations saisies :');
  console.log(`   Email    : ${email}`);
  console.log(`   Nom      : ${name}`);
  console.log(`   Rôle     : Super Admin`);
  
  const confirm = await question('\n✅ Confirmer la création ? (oui/non) : ');
  
  if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
    console.log('\n❌ Création annulée.');
    rl.close();
    process.exit(0);
  }
  
  try {
    const userRecord = await createAdmin(email, password, name);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Super Admin créé avec succès !');
    console.log('\n📋 Détails :');
    console.log(`   UID      : ${userRecord.uid}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Nom      : ${name}`);
    console.log(`   Rôle     : Super Admin`);
    console.log('\n🌐 Vous pouvez maintenant vous connecter sur :');
    console.log('   👉 https://amenatawsil.com');
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création :', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n💡 Cet email existe déjà. Voulez-vous :');
      console.log('   1. Utiliser un autre email');
      console.log('   2. Supprimer l\'utilisateur existant et recréer');
    }
  }
  
  rl.close();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  rl.close();
  process.exit(1);
});
