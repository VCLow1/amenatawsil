#!/usr/bin/env node

/**
 * Script automatique pour créer le Super Admin
 * Ce script utilise l'API REST de Firebase
 */

import https from 'https';
import { readFileSync } from 'fs';

// Configuration Firebase
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q",
  projectId: "gen-lang-client-0208289492",
  databaseId: "(default)"
};

// Identifiants du Super Admin
const ADMIN_CREDENTIALS = {
  email: "admin@amenatawsil.com",
  password: "Admin2026!",
  name: "Administrateur"
};

console.log('\n🔐 Création automatique du Super Admin\n');
console.log('='.repeat(70));
console.log('\n📋 Identifiants qui seront créés :');
console.log(`   Email    : ${ADMIN_CREDENTIALS.email}`);
console.log(`   Password : ${ADMIN_CREDENTIALS.password}`);
console.log(`   Nom      : ${ADMIN_CREDENTIALS.name}`);
console.log(`   Rôle     : Super Admin`);
console.log('\n' + '='.repeat(70));

// Fonction pour créer l'utilisateur via l'API REST Firebase Auth
function createAuthUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Fonction pour créer le profil dans Firestore
function createFirestoreProfile(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_CREDENTIALS.email },
        name: { stringValue: ADMIN_CREDENTIALS.name },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/users/${uid}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Exécution principale
async function main() {
  try {
    console.log('\n🔐 Étape 1/2 : Création de l\'utilisateur dans Authentication...');
    const authResponse = await createAuthUser();
    console.log(`✅ Utilisateur créé avec UID: ${authResponse.localId}`);
    
    console.log('\n📝 Étape 2/2 : Création du profil dans Firestore...');
    await createFirestoreProfile(authResponse.localId, authResponse.idToken);
    console.log('✅ Profil créé dans Firestore');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 SUPER ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 VOS IDENTIFIANTS DE CONNEXION :');
    console.log('\n   🌐 URL      : https://amenatawsil.com');
    console.log(`   📧 Email    : ${ADMIN_CREDENTIALS.email}`);
    console.log(`   🔑 Password : ${ADMIN_CREDENTIALS.password}`);
    console.log(`   👤 Nom      : ${ADMIN_CREDENTIALS.name}`);
    console.log(`   🎯 Rôle     : Super Admin`);
    console.log(`   🆔 UID      : ${authResponse.localId}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Vous pouvez maintenant vous connecter sur https://amenatawsil.com');
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création :', error.message);
    
    if (error.message.includes('EMAIL_EXISTS')) {
      console.log('\n💡 L\'email existe déjà dans Firebase Authentication.');
      console.log('\n📋 VOS IDENTIFIANTS (déjà créés) :');
      console.log('\n   🌐 URL      : https://amenatawsil.com');
      console.log(`   📧 Email    : ${ADMIN_CREDENTIALS.email}`);
      console.log(`   🔑 Password : ${ADMIN_CREDENTIALS.password}`);
      console.log('\n✅ Essayez de vous connecter avec ces identifiants.');
      console.log('\n⚠️  Si vous avez oublié le mot de passe, utilisez la fonction');
      console.log('   "Mot de passe oublié" sur la page de connexion.\n');
    } else {
      console.log('\n⚠️  Création manuelle requise. Suivez ces étapes :');
      console.log('\n1️⃣  Allez sur Firebase Console :');
      console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
      console.log('\n2️⃣  Cliquez sur "Add user" et utilisez :');
      console.log(`    📧 Email    : ${ADMIN_CREDENTIALS.email}`);
      console.log(`    🔑 Password : ${ADMIN_CREDENTIALS.password}`);
      console.log('\n3️⃣  Copiez l\'UID et créez le profil dans Firestore');
      console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
      console.log('\n    Collection: users');
      console.log('    Document ID: [UID copié]');
      console.log('    Champs:');
      console.log(`      - email: "${ADMIN_CREDENTIALS.email}"`);
      console.log(`      - name: "${ADMIN_CREDENTIALS.name}"`);
      console.log('      - role: "Super Admin"');
      console.log('      - status: "Active"');
      console.log(`      - lastLogin: "${new Date().toISOString().split('T')[0]}"`);
      console.log('\n');
    }
    process.exit(1);
  }
}

main();
