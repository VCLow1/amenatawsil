#!/usr/bin/env node

import https from 'https';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q",
  projectId: "gen-lang-client-0208289492"
};

const ADMIN_CREDENTIALS = {
  email: "administrateur@amenatawsil.com",
  password: "Amena2026!",
  uid: "tzo4E2tr6dQA3skcv8kO3Bek2K93"
};

console.log('\n🔧 CRÉATION DU PROFIL ADMIN FINAL\n');
console.log('='.repeat(70));

async function getAuthToken() {
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
        const response = JSON.parse(body);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.idToken);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createProfile(token) {
  return new Promise((resolve, reject) => {
    // Format correct pour Firestore REST API
    const profileData = {
      fields: {
        email: { stringValue: ADMIN_CREDENTIALS.email },
        name: { stringValue: "Administrateur" },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: "2026-05-15" },
        balance: { integerValue: "0" }, // Utiliser integerValue au lieu de numberValue
        agency: { stringValue: "" }
      }
    };

    const data = JSON.stringify(profileData);

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/users?documentId=${ADMIN_CREDENTIALS.uid}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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

async function main() {
  try {
    console.log('📝 Obtention du token d\'authentification...');
    const token = await getAuthToken();
    console.log('✅ Token obtenu !');

    console.log('\n📝 Création du profil Firestore...');
    await createProfile(token);
    console.log('✅ Profil créé avec succès !');

    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 PROFIL ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 VOS IDENTIFIANTS DE CONNEXION :');
    console.log('\n   🌐 URL      : https://amenatawsil.com');
    console.log(`   📧 Email    : ${ADMIN_CREDENTIALS.email}`);
    console.log(`   🔑 Password : ${ADMIN_CREDENTIALS.password}`);
    console.log(`   🆔 UID      : ${ADMIN_CREDENTIALS.uid}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Vous pouvez maintenant vous connecter sur https://amenatawsil.com');
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message || JSON.stringify(error));
    
    console.log('\n💡 SOLUTION MANUELLE :');
    console.log('\n1. Allez sur Firestore :');
    console.log('   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
    console.log('\n2. Cliquez sur la collection "users"');
    console.log('\n3. Cliquez sur "+ Ajouter un document"');
    console.log(`\n4. ID du document : ${ADMIN_CREDENTIALS.uid}`);
    console.log('\n5. Ajoutez ces champs :');
    console.log('   - email (string) : administrateur@amenatawsil.com');
    console.log('   - name (string) : Administrateur');
    console.log('   - role (string) : Super Admin');
    console.log('   - status (string) : Active');
    console.log('   - lastLogin (string) : 2026-05-15');
    console.log('   - balance (number) : 0');
    console.log('   - agency (string) : (vide)');
    console.log('\n6. Cliquez sur "Enregistrer"');
    console.log('\n7. Essayez de vous connecter sur https://amenatawsil.com\n');
  }
}

main();