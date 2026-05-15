#!/usr/bin/env node

import https from 'https';

const FIREBASE_API_KEY = "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q";
const PROJECT_ID = "gen-lang-client-0208289492";

// Nouvel email pour éviter les conflits
const ADMIN_EMAIL = "administrateur@amenatawsil.com";
const ADMIN_PASSWORD = "Amena2026!";
const ADMIN_NAME = "Administrateur Principal";

console.log('\n🔐 Création du Super Admin\n');
console.log('='.repeat(70));

function createUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
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
        const response = JSON.parse(body);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function createFirestoreDoc(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_EMAIL },
        name: { stringValue: ADMIN_NAME },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${uid}`,
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
        const response = JSON.parse(body);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n📝 Étape 1/2 : Création de l\'utilisateur dans Authentication...');
    const authResponse = await createUser();
    console.log(`✅ Utilisateur créé ! UID: ${authResponse.localId}`);
    
    console.log('\n📝 Étape 2/2 : Création du profil dans Firestore...');
    await createFirestoreDoc(authResponse.localId, authResponse.idToken);
    console.log('✅ Profil créé dans Firestore !');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 SUPER ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 VOS IDENTIFIANTS DE CONNEXION :');
    console.log('\n   🌐 URL      : https://amenatawsil.com');
    console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password : ${ADMIN_PASSWORD}`);
    console.log(`   👤 Nom      : ${ADMIN_NAME}`);
    console.log(`   🎯 Rôle     : Super Admin`);
    console.log(`   🆔 UID      : ${authResponse.localId}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Vous pouvez maintenant vous connecter sur https://amenatawsil.com');
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message || error);
    console.log('\n⚠️  Impossible de créer l\'utilisateur automatiquement.');
    console.log('\nVeuillez créer manuellement via Firebase Console :');
    console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users\n');
  }
}

main();
