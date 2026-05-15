#!/usr/bin/env node

import https from 'https';

const FIREBASE_API_KEY = "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q";
const PROJECT_ID = "gen-lang-client-0208289492";

const ADMIN_EMAIL = "administrateur@amenatawsil.com";
const ADMIN_PASSWORD = "Amena2026!";
const ADMIN_UID = "tzo4E2tr6dQA3skcv8kO3Bek2K93";
const ADMIN_NAME = "Administrateur Principal";

console.log('\n🔐 Finalisation du Super Admin\n');
console.log('='.repeat(70));

function signIn() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
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
          // Si le document existe déjà, essayer de le mettre à jour
          if (response.error.code === 409 || response.error.status === 'ALREADY_EXISTS') {
            updateFirestoreDoc(uid, idToken).then(resolve).catch(reject);
          } else {
            reject(response.error);
          }
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

function updateFirestoreDoc(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_EMAIL },
        name: { stringValue: ADMIN_NAME },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
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
    console.log('\n🔐 Connexion avec l\'utilisateur existant...');
    const authResponse = await signIn();
    console.log(`✅ Connexion réussie ! UID: ${authResponse.localId}`);
    
    console.log('\n📝 Création du profil Firestore...');
    await createFirestoreDoc(authResponse.localId, authResponse.idToken);
    console.log('✅ Profil créé/mis à jour dans Firestore !');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 SUPER ADMIN PRÊT !');
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
    console.error('\n❌ Erreur:', error.message || JSON.stringify(error));
    console.log('\n⚠️  Impossible de finaliser automatiquement.');
    console.log('\nVeuillez créer le profil manuellement dans Firestore :');
    console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
    console.log('\nCollection: users');
    console.log(`Document ID: ${ADMIN_UID}`);
    console.log('Champs:');
    console.log(`  - email: "${ADMIN_EMAIL}"`);
    console.log(`  - name: "${ADMIN_NAME}"`);
    console.log('  - role: "Super Admin"');
    console.log('  - status: "Active"');
    console.log(`  - lastLogin: "${new Date().toISOString().split('T')[0]}"`);
    console.log('');
  }
}

main();
