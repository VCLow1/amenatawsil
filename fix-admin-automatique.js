#!/usr/bin/env node

/**
 * Script automatique pour diagnostiquer et corriger le problème de connexion admin
 */

import https from 'https';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q",
  projectId: "gen-lang-client-0208289492",
  databaseId: "(default)"
};

const ADMIN_CREDENTIALS = {
  email: "administrateur@amenatawsil.com",
  password: "Amena2026!",
  expectedUID: "tzo4E2tr6dQA3skcv8kO3Bek2K93"
};

console.log('\n🔍 DIAGNOSTIC AUTOMATIQUE DE CONNEXION ADMIN\n');
console.log('='.repeat(70));

// Étape 1: Test d'authentification
async function testAuthentication() {
  console.log('\n📝 ÉTAPE 1/4 : Test d\'authentification Firebase...');
  
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
            console.log(`❌ Authentification échouée: ${response.error.message}`);
            resolve({ success: false, error: response.error.message });
          } else {
            console.log(`✅ Authentification réussie !`);
            console.log(`   UID: ${response.localId}`);
            console.log(`   Email: ${response.email}`);
            
            if (response.localId !== ADMIN_CREDENTIALS.expectedUID) {
              console.log(`⚠️  ATTENTION: UID différent de celui attendu !`);
              console.log(`   UID actuel: ${response.localId}`);
              console.log(`   UID attendu: ${ADMIN_CREDENTIALS.expectedUID}`);
            }
            
            resolve({ 
              success: true, 
              uid: response.localId, 
              token: response.idToken,
              email: response.email 
            });
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

// Étape 2: Vérifier le profil Firestore
async function checkFirestoreProfile(uid, token) {
  console.log('\n📝 ÉTAPE 2/4 : Vérification du profil Firestore...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/users/${uid}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            if (response.error.code === 404) {
              console.log(`❌ Profil Firestore manquant pour UID: ${uid}`);
              resolve({ exists: false });
            } else {
              console.log(`❌ Erreur Firestore: ${response.error.message}`);
              resolve({ exists: false, error: response.error.message });
            }
          } else {
            console.log(`✅ Profil Firestore trouvé !`);
            
            // Extraire les données
            const fields = response.fields || {};
            const userData = {};
            Object.keys(fields).forEach(key => {
              const field = fields[key];
              if (field.stringValue !== undefined) userData[key] = field.stringValue;
              if (field.numberValue !== undefined) userData[key] = field.numberValue;
              if (field.booleanValue !== undefined) userData[key] = field.booleanValue;
            });
            
            console.log(`   Données: ${JSON.stringify(userData, null, 2)}`);
            resolve({ exists: true, data: userData });
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Étape 3: Créer le profil Firestore
async function createFirestoreProfile(uid, token) {
  console.log('\n📝 ÉTAPE 3/4 : Création du profil Firestore...');
  
  const profileData = {
    fields: {
      email: { stringValue: ADMIN_CREDENTIALS.email },
      name: { stringValue: "Administrateur" },
      role: { stringValue: "Super Admin" },
      status: { stringValue: "Active" },
      lastLogin: { stringValue: "2026-05-15" },
      balance: { numberValue: 0 },
      agency: { stringValue: "" }
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(profileData);

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents/users?documentId=${uid}`,
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
        try {
          const response = JSON.parse(body);
          if (response.error) {
            console.log(`❌ Erreur création profil: ${response.error.message}`);
            resolve({ success: false, error: response.error.message });
          } else {
            console.log(`✅ Profil créé avec succès !`);
            resolve({ success: true });
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

// Étape 4: Validation finale
function validateProfile(profileData) {
  console.log('\n📝 ÉTAPE 4/4 : Validation du profil...');
  
  const requiredFields = {
    email: ADMIN_CREDENTIALS.email,
    role: "Super Admin",
    status: "Active"
  };

  let isValid = true;
  Object.keys(requiredFields).forEach(field => {
    const expected = requiredFields[field];
    const actual = profileData[field];
    
    if (actual === expected) {
      console.log(`✅ ${field}: OK (${actual})`);
    } else {
      console.log(`❌ ${field}: ERREUR - Attendu: "${expected}", Actuel: "${actual}"`);
      isValid = false;
    }
  });

  return isValid;
}

// Fonction principale
async function main() {
  try {
    // Étape 1: Test d'authentification
    const authResult = await testAuthentication();
    if (!authResult.success) {
      console.log('\n❌ ÉCHEC: Impossible de s\'authentifier avec ces identifiants.');
      console.log('\n💡 SOLUTION: Vérifiez que l\'utilisateur existe dans Firebase Authentication');
      console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
      return;
    }

    // Étape 2: Vérifier le profil Firestore
    const profileResult = await checkFirestoreProfile(authResult.uid, authResult.token);
    
    let profileData = null;
    if (!profileResult.exists) {
      // Étape 3: Créer le profil s'il n'existe pas
      const createResult = await createFirestoreProfile(authResult.uid, authResult.token);
      if (!createResult.success) {
        console.log('\n❌ ÉCHEC: Impossible de créer le profil Firestore.');
        console.log(`Erreur: ${createResult.error}`);
        return;
      }
      
      // Re-vérifier après création
      const newProfileResult = await checkFirestoreProfile(authResult.uid, authResult.token);
      profileData = newProfileResult.data;
    } else {
      profileData = profileResult.data;
    }

    // Étape 4: Validation finale
    if (profileData && validateProfile(profileData)) {
      console.log('\n' + '='.repeat(70));
      console.log('\n🎉 SUCCÈS ! TOUT EST CONFIGURÉ CORRECTEMENT !');
      console.log('\n' + '='.repeat(70));
      console.log('\n📋 VOS IDENTIFIANTS DE CONNEXION :');
      console.log('\n   🌐 URL      : https://amenatawsil.com');
      console.log(`   📧 Email    : ${ADMIN_CREDENTIALS.email}`);
      console.log(`   🔑 Password : ${ADMIN_CREDENTIALS.password}`);
      console.log(`   🆔 UID      : ${authResult.uid}`);
      console.log('\n' + '='.repeat(70));
      console.log('\n✅ Vous pouvez maintenant vous connecter sur https://amenatawsil.com');
      console.log('\n' + '='.repeat(70) + '\n');
    } else {
      console.log('\n❌ ÉCHEC: Le profil existe mais contient des erreurs.');
      console.log('\n💡 SOLUTION: Corrigez manuellement le profil dans Firestore');
      console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
    }

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.log('\n💡 SOLUTION: Vérifiez que Firestore est activé et accessible');
    console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore');
  }
}

main();