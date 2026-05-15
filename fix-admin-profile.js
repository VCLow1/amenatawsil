#!/usr/bin/env node

/**
 * Script pour vérifier et créer le profil Firestore du Super Admin
 */

import https from 'https';

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

console.log('\n🔍 Vérification du profil Super Admin\n');
console.log('='.repeat(70));

// Fonction pour se connecter et obtenir l'UID
function signIn() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`,
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

// Fonction pour créer/mettre à jour le profil dans Firestore
function createOrUpdateProfile(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_CREDENTIALS.email },
        name: { stringValue: ADMIN_CREDENTIALS.name },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/users?documentId=${uid}`,
      method: 'POST',
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
            // Si le document existe déjà, on le met à jour
            if (response.error.code === 409 || response.error.status === 'ALREADY_EXISTS') {
              updateProfile(uid, idToken).then(resolve).catch(reject);
            } else {
              reject(new Error(response.error.message));
            }
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

// Fonction pour mettre à jour le profil existant
function updateProfile(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_CREDENTIALS.email },
        name: { stringValue: ADMIN_CREDENTIALS.name },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        updatedAt: { timestampValue: new Date().toISOString() }
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
    console.log('\n🔐 Connexion avec les identifiants admin...');
    const authResponse = await signIn();
    console.log(`✅ Connexion réussie ! UID: ${authResponse.localId}`);
    
    console.log('\n📝 Création/Mise à jour du profil Firestore...');
    await createOrUpdateProfile(authResponse.localId, authResponse.idToken);
    console.log('✅ Profil créé/mis à jour dans Firestore');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 SUPER ADMIN CONFIGURÉ AVEC SUCCÈS !');
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
    console.error('\n❌ Erreur :', error.message);
    
    if (error.message.includes('INVALID_PASSWORD') || error.message.includes('EMAIL_NOT_FOUND')) {
      console.log('\n⚠️  Les identifiants ne correspondent pas.');
      console.log('\nVeuillez créer manuellement l\'utilisateur :');
      console.log('\n1️⃣  Allez sur Firebase Console :');
      console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
      console.log('\n2️⃣  Cliquez sur "Add user" :');
      console.log(`    📧 Email    : ${ADMIN_CREDENTIALS.email}`);
      console.log(`    🔑 Password : ${ADMIN_CREDENTIALS.password}`);
      console.log('\n3️⃣  Ensuite relancez ce script\n');
    } else {
      console.log('\n⚠️  Erreur technique. Détails :', error.message);
    }
    process.exit(1);
  }
}

main();
