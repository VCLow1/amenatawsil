#!/usr/bin/env node

/**
 * Script pour vérifier et corriger le profil admin
 */

import https from 'https';

const FIREBASE_API_KEY = "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q";
const PROJECT_ID = "gen-lang-client-0208289492";

console.log('\n🔍 Vérification des utilisateurs\n');
console.log('='.repeat(70));

// Liste des emails possibles
const POSSIBLE_USERS = [
  { email: 'admin@amenatawsil.com', password: 'Admin2026!' },
  { email: 'administrateur@amenatawsil.com', password: 'Amena2026!' }
];

function trySignIn(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password,
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
          resolve({ success: false, email, error: response.error.message });
        } else {
          resolve({ success: true, email, uid: response.localId, token: response.idToken });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function updateFirestoreProfile(uid, email, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: email },
        name: { stringValue: "Administrateur" },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
  console.log('\n📝 Test de connexion avec tous les utilisateurs possibles...\n');
  
  for (const user of POSSIBLE_USERS) {
    console.log(`\nTest : ${user.email}`);
    const result = await trySignIn(user.email, user.password);
    
    if (result.success) {
      console.log(`✅ Connexion réussie !`);
      console.log(`   UID: ${result.uid}`);
      
      console.log(`\n📝 Mise à jour du profil Firestore...`);
      try {
        await updateFirestoreProfile(result.uid, user.email, result.token);
        console.log(`✅ Profil mis à jour !`);
        
        console.log('\n' + '='.repeat(70));
        console.log('\n🎉 UTILISATEUR FONCTIONNEL TROUVÉ !');
        console.log('\n' + '='.repeat(70));
        console.log('\n📋 VOS IDENTIFIANTS :');
        console.log(`\n   🌐 URL      : https://amenatawsil.com`);
        console.log(`   📧 Email    : ${user.email}`);
        console.log(`   🔑 Password : ${user.password}`);
        console.log(`   🆔 UID      : ${result.uid}`);
        console.log('\n' + '='.repeat(70));
        console.log('\n✅ Essayez de vous connecter maintenant sur https://amenatawsil.com\n');
        return;
      } catch (error) {
        console.log(`⚠️  Erreur lors de la mise à jour du profil: ${error.message}`);
      }
    } else {
      console.log(`❌ Échec : ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n❌ Aucun utilisateur ne fonctionne avec les mots de passe testés.');
  console.log('\n💡 SOLUTION :');
  console.log('\n1. Allez sur Firebase Authentication :');
  console.log('   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
  console.log('\n2. Trouvez l\'utilisateur "admin@amenatawsil.com" ou "administrateur@amenatawsil.com"');
  console.log('\n3. Cliquez sur les 3 points ⋮ et sélectionnez "Reset password"');
  console.log('\n4. Définissez un nouveau mot de passe : SuperAdmin2026!');
  console.log('\n5. Notez l\'UID de l\'utilisateur');
  console.log('\n6. Vérifiez que le document dans Firestore a le même UID');
  console.log('\n7. Essayez de vous connecter avec le nouveau mot de passe\n');
}

main().catch(console.error);
